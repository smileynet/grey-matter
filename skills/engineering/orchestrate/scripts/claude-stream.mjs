import { startOwnedProcess } from './owned-process.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MODEL = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const START_KEYS = ['executable', 'cwd', 'env', 'limits', 'sessionId', 'model'];
const MESSAGE_KEYS = ['messageId', 'messageHash', 'protocolUuid', 'sessionId', 'text'];
const MAX_TEXT_BYTES = 4 * 1024 * 1024;
const MAX_QUEUED_EVENTS = 4096;
const MAX_QUEUED_EVENT_BYTES = 8 * 1024 * 1024;
const EMPTY_MCP_CONFIG = '{"mcpServers":{}}';

function demand(condition, message, code = 'INVALID_INPUT') {
  if (!condition) throw new ClaudeStreamError(message, code);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function drainStderr(stream) {
  const diagnostics = (async () => {
    const chunks = [];
    let length = 0;
    for await (const chunk of stream) {
      chunks.push(chunk);
      length += chunk.length;
    }
    return Buffer.concat(chunks, length);
  })();
  void diagnostics.catch(() => {});
  return diagnostics;
}

function exactKeys(value, expected, name) {
  demand(isRecord(value) && Object.keys(value).length === expected.length
    && expected.every(key => Object.hasOwn(value, key)), `${name} must contain exactly: ${expected.join(', ')}`);
}

function uuid(value, name) {
  demand(typeof value === 'string' && UUID.test(value), `${name} must be a canonical UUID`);
}

function snapshotStartOptions(options) {
  exactKeys(options, START_KEYS, 'options');
  const executable = isRecord(options.executable) ? { ...options.executable } : options.executable;
  const env = isRecord(options.env) ? { ...options.env } : options.env;
  const limits = isRecord(options.limits) ? { ...options.limits } : options.limits;
  const snapshot = {
    executable,
    cwd: options.cwd,
    env,
    limits,
    sessionId: options.sessionId,
    model: options.model,
  };
  uuid(snapshot.sessionId, 'sessionId');
  demand(typeof snapshot.model === 'string' && MODEL.test(snapshot.model), 'model must be a bounded model name');
  return snapshot;
}

function snapshotMessage(input, expectedSessionId, maxInputBytes) {
  exactKeys(input, MESSAGE_KEYS, 'message');
  const snapshot = {
    messageId: input.messageId,
    messageHash: input.messageHash,
    protocolUuid: input.protocolUuid,
    sessionId: input.sessionId,
    text: input.text,
  };
  demand(typeof snapshot.messageId === 'string' && snapshot.messageId.length > 0
    && snapshot.messageId.length <= 256 && !snapshot.messageId.includes('\0'), 'messageId must be a non-empty opaque identifier');
  demand(typeof snapshot.messageHash === 'string' && /^[a-f0-9]{64}$/i.test(snapshot.messageHash),
    'messageHash must be a SHA-256 hex digest');
  uuid(snapshot.protocolUuid, 'protocolUuid');
  uuid(snapshot.sessionId, 'message sessionId');
  demand(snapshot.sessionId === expectedSessionId, 'message sessionId does not match the owned session', 'SESSION_MISMATCH');
  demand(typeof snapshot.text === 'string' && Buffer.byteLength(snapshot.text, 'utf8') <= MAX_TEXT_BYTES,
    `text must be a string no larger than ${MAX_TEXT_BYTES} UTF-8 bytes`);

  const identity = Object.freeze({
    messageId: snapshot.messageId,
    messageHash: snapshot.messageHash,
    protocolUuid: snapshot.protocolUuid,
    sessionId: snapshot.sessionId,
  });
  const wire = {
    type: 'user',
    uuid: snapshot.protocolUuid,
    session_id: snapshot.sessionId,
    message: { role: 'user', content: snapshot.text },
    parent_tool_use_id: null,
    client_composed: true,
  };
  const line = `${JSON.stringify(wire)}\n`;
  demand(Buffer.byteLength(line, 'utf8') <= maxInputBytes, 'encoded message exceeds the owned process input limit', 'INPUT_LIMIT');
  return { identity, text: snapshot.text, line };
}

export function claudeArgv({ sessionId, model }) {
  return [
    '-p',
    '--input-format', 'stream-json',
    '--output-format', 'stream-json',
    '--replay-user-messages',
    '--verbose',
    '--include-partial-messages',
    '--session-id', sessionId,
    '--model', model,
    '--restricted',
    '--tools', '',
    '--permission-prompts', 'none',
    '--strict-mcp-config',
    '--mcp-config', EMPTY_MCP_CONFIG,
    '--no-session-persistence',
  ];
}

function matchesInput(record, protocolUuid) {
  if (record.user_message_uuid === protocolUuid) return true;
  return Array.isArray(record.user_message_uuids) && record.user_message_uuids.includes(protocolUuid);
}

function assertCorrelated(record, active, allowBoundContinuation) {
  const hasExact = record.user_message_uuid !== undefined || record.user_message_uuids !== undefined;
  if (hasExact) {
    demand(matchesInput(record, active.identity.protocolUuid), 'record is correlated to a different input', 'CORRELATION_MISMATCH');
    active.responseBound = true;
    return;
  }
  demand(allowBoundContinuation && active.responseBound,
    'record has no exact input correlation before the documented sequential response boundary', 'UNCORRELATED_RECORD');
}

function identityEvent(type, active, details = {}) {
  return { type, ...active.identity, ...details };
}

export class ClaudeStreamError extends Error {
  constructor(message, code = 'CLAUDE_STREAM_ERROR', details = {}) {
    super(message);
    this.name = 'ClaudeStreamError';
    this.code = code;
    Object.assign(this, details);
  }
}

class EventQueue {
  #events = [];
  #readers = [];
  #space = [];
  #bytes = 0;
  #closed = false;
  #claimed = false;

  async push(event) {
    if (this.#closed) return false;
    const bytes = Buffer.byteLength(JSON.stringify(event), 'utf8');
    demand(bytes <= MAX_QUEUED_EVENT_BYTES, 'single event exceeds the adapter event buffer limit', 'EVENT_LIMIT');
    while (!this.#closed && (this.#events.length >= MAX_QUEUED_EVENTS || this.#bytes + bytes > MAX_QUEUED_EVENT_BYTES)) {
      await new Promise(resolve => this.#space.push(resolve));
    }
    if (this.#closed) return false;
    const reader = this.#readers.shift();
    if (reader) reader.resolve({ value: event, done: false });
    else {
      this.#events.push({ event, bytes });
      this.#bytes += bytes;
    }
    return true;
  }

  close() {
    if (this.#closed) return;
    this.#closed = true;
    for (const release of this.#space.splice(0)) release();
    if (!this.#events.length) {
      for (const reader of this.#readers.splice(0)) reader.resolve({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator]() {
    demand(!this.#claimed, 'events supports one reader', 'EVENT_READER_EXISTS');
    this.#claimed = true;
    return {
      next: () => {
        if (this.#events.length) {
          const { event, bytes } = this.#events.shift();
          this.#bytes -= bytes;
          for (const release of this.#space.splice(0)) release();
          return Promise.resolve({ value: event, done: false });
        }
        if (this.#closed) return Promise.resolve({ value: undefined, done: true });
        return new Promise(resolve => this.#readers.push({ resolve }));
      },
      return: async () => {
        this.close();
        return { value: undefined, done: true };
      },
    };
  }
}

/** Pure protocol boundary; it accepts decoded records and never owns or attaches to a process. */
export function createClaudeStreamProtocol(sessionId) {
  uuid(sessionId, 'sessionId');
  let phase = 'starting';
  let active = null;
  let stopRequested = false;
  const used = new Set();

  function observe(value) {
    demand(isRecord(value), 'stream record must be a JSON object', 'PROTOCOL_SHAPE');
    demand(typeof value.type === 'string', 'stream record is missing type', 'PROTOCOL_SHAPE');
    if (value.session_id !== undefined) {
      demand(value.session_id === sessionId, 'record belongs to a different session', 'SESSION_MISMATCH');
    }

    if (value.type === 'system') {
      demand(value.session_id === sessionId && typeof value.subtype === 'string', 'system record has no exact session or subtype', 'PROTOCOL_SHAPE');
      if (value.subtype === 'init') {
        demand(phase === 'starting', 'duplicate or out-of-order init record', 'PROTOCOL_ORDER');
        demand(typeof value.model === 'string' && typeof value.claude_code_version === 'string'
          && Array.isArray(value.tools) && Array.isArray(value.mcp_servers)
          && typeof value.permissionMode === 'string', 'init record is missing documented session metadata', 'PROTOCOL_SHAPE');
        demand(value.tools.every(tool => typeof tool === 'string')
          && value.mcp_servers.every(server => isRecord(server) && typeof server.name === 'string' && typeof server.status === 'string'),
        'init record has malformed tool or MCP server metadata', 'PROTOCOL_SHAPE');
        demand(value.tools.length === 0 && value.mcp_servers.length === 0,
          'Claude session did not start with an empty tool and MCP surface', 'UNSAFE_SESSION');
        demand(!['auto', 'acceptEdits', 'bypassPermissions'].includes(value.permissionMode),
          'Claude session is using an automatic permission mode', 'UNSAFE_SESSION');
        phase = 'ready';
        return {
          type: 'ready', sessionId, model: value.model, version: value.claude_code_version,
          tools: [...value.tools], mcpServers: value.mcp_servers.map(server => ({ ...server })),
          permissionMode: value.permissionMode,
        };
      }
      if (phase === 'starting' && value.subtype === 'plugin_install') {
        return { type: 'status', sessionId, subtype: value.subtype, uuid: value.uuid ?? null };
      }
      demand(phase !== 'starting' && phase !== 'closed' && phase !== 'faulted',
        'system record arrived outside an initialized session', 'PROTOCOL_ORDER');
      return { type: 'status', sessionId, subtype: value.subtype, uuid: value.uuid ?? null };
    }

    if (['hook_started', 'hook_progress', 'hook_response', 'plugin_install'].includes(value.type)) {
      demand(value.session_id === sessionId, 'startup event is missing the exact session', 'SESSION_MISMATCH');
      demand(phase !== 'closed' && phase !== 'faulted', 'startup event arrived after process completion', 'PROTOCOL_ORDER');
      return { type: 'status', sessionId, subtype: value.type, uuid: value.uuid ?? null };
    }

    if (phase === 'starting') throw new ClaudeStreamError('session record arrived before system/init', 'PROTOCOL_ORDER');
    demand(phase !== 'closed' && phase !== 'faulted', 'record arrived after process completion', 'PROTOCOL_ORDER');

    if (value.type === 'user') {
      demand(active !== null && value.session_id === sessionId && value.uuid === active.identity.protocolUuid,
        'user echo does not match the single in-flight input', 'CORRELATION_MISMATCH');
      demand(value.parent_tool_use_id === null && value.agent_id === undefined,
        'subagent user records are outside this adapter scope', 'UNEXPECTED_RECORD');
      demand(isRecord(value.message) && value.message.role === 'user' && value.message.content === active.text,
        'user echo content does not match the submitted input', 'CORRELATION_MISMATCH');
      if (value.isReplay === true) {
        demand(!active.replayed, 'duplicate replay acknowledgment', 'PROTOCOL_ORDER');
        active.replayed = true;
        return identityEvent('input-replayed', active, { isReplay: true });
      }
      return identityEvent('input-observed', active, { isReplay: false });
    }

    if (value.type === 'assistant') {
      demand(phase === 'busy' && active !== null && value.session_id === sessionId,
        'assistant record arrived without an in-flight input', 'PROTOCOL_ORDER');
      demand(value.parent_tool_use_id === null, 'subagent assistant records are outside this adapter scope', 'UNEXPECTED_RECORD');
      assertCorrelated(value, active, true);
      demand(isRecord(value.message) && typeof value.message.id === 'string' && Array.isArray(value.message.content),
        'assistant record is missing documented message content', 'PROTOCOL_SHAPE');
      return identityEvent('assistant', active, { messageId: value.message.id, content: value.message.content });
    }

    if (value.type === 'stream_event') {
      demand(phase === 'busy' && active !== null && value.session_id === sessionId && isRecord(value.event),
        'stream event arrived without an in-flight input or exact session', 'PROTOCOL_ORDER');
      demand(value.parent_tool_use_id === null, 'subagent stream events are outside this adapter scope', 'UNEXPECTED_RECORD');
      if (value.event.type === 'ping') return null;
      assertCorrelated(value, active, true);
      return identityEvent('stream-event', active, { event: value.event, messageId: value.uuid ?? null });
    }

    if (value.type === 'result') {
      demand(value.session_id === sessionId, 'result is missing the exact session', 'SESSION_MISMATCH');
      if (phase === 'starting' && active === null && value.subtype === 'error_during_execution') {
        phase = 'closed';
        return { type: 'startup-error', sessionId, subtype: value.subtype, errors: Array.isArray(value.errors) ? [...value.errors] : [] };
      }
      demand(phase === 'busy' && active !== null, 'terminal result arrived without an in-flight input', 'PROTOCOL_ORDER');
      demand(matchesInput(value, active.identity.protocolUuid), 'result does not identify the submitted protocol UUID', 'CORRELATION_MISMATCH');
      demand(typeof value.subtype === 'string' && typeof value.is_error === 'boolean',
        'result is missing its documented terminal classification', 'PROTOCOL_SHAPE');
      const event = identityEvent('provider-result', active, {
        subtype: value.subtype,
        isError: value.is_error,
        result: typeof value.result === 'string' ? value.result : null,
        errors: Array.isArray(value.errors) ? [...value.errors] : [],
        terminalReason: value.terminal_reason ?? null,
        providerUuid: value.uuid ?? null,
      });
      active = null;
      phase = stopRequested ? 'stopping' : 'ready';
      return event;
    }

    throw new ClaudeStreamError(`unexpected Claude stream record type: ${value.type}`, 'UNEXPECTED_RECORD');
  }

  function prepare(input, maxInputBytes) {
    const snapshot = snapshotMessage(input, sessionId, maxInputBytes);
    demand(!used.has(snapshot.identity.protocolUuid), 'protocolUuid has already been used', 'DUPLICATE_INPUT');
    demand(active === null, 'one turn is already in flight', 'BUSY');
    demand(phase === 'ready' && !stopRequested, 'owned Claude session is not accepting input', 'NOT_READY');
    used.add(snapshot.identity.protocolUuid);
    active = { ...snapshot, responseBound: false, replayed: false };
    phase = 'busy';
    return { identity: snapshot.identity, line: snapshot.line };
  }

  function writeFailure(error) {
    if (!active) return { type: 'write-failed', sessionId, code: error?.code ?? 'WRITE_ERROR' };
    return identityEvent('write-failed-ambiguous', active, { code: error?.code ?? 'WRITE_ERROR' });
  }

  function requestStop() {
    stopRequested = true;
    if (phase === 'ready') phase = 'stopping';
  }

  function finish(exit) {
    const events = [];
    if (phase === 'starting') {
      events.push({ type: 'startup-failed', sessionId, exitCode: exit.exitCode, reason: exit.reason });
    }
    if (active) {
      events.push(identityEvent('ambiguous-disconnect', active, { reason: 'process closed before a correlated result' }));
      active = null;
    }
    phase = 'closed';
    events.push({
      type: 'process-exit', sessionId, pid: exit.pid, generation: exit.generation,
      reason: exit.reason, exitCode: exit.exitCode, signal: exit.signal,
      startedAt: exit.startedAt, exitedAt: exit.exitedAt, closedAt: exit.closedAt,
      stdoutBytes: exit.stdoutBytes, stderrBytes: exit.stderrBytes,
      error: exit.error ? { phase: exit.error.phase, code: exit.error.code } : null,
    });
    return events;
  }

  return {
    get phase() { return phase; },
    get current() { return active ? active.identity : null; },
    observe,
    prepare,
    writeFailure,
    requestStop,
    finish,
  };
}

/** Start a single Claude Code process that accepts sequential, UUID-correlated turns. */
export async function startClaudeStream(options) {
  const snapshot = snapshotStartOptions(options);
  const owned = await startOwnedProcess({
    executable: snapshot.executable,
    argv: claudeArgv(snapshot),
    cwd: snapshot.cwd,
    env: snapshot.env,
    limits: snapshot.limits,
    stdoutMode: 'jsonl',
  });
  const stderr = drainStderr(owned.stderr);
  const processCompletion = owned.completion;
  const completion = (async () => {
    const [processResult, diagnostics] = await Promise.allSettled([processCompletion, stderr]);
    if (processResult.status === 'rejected') throw processResult.reason;
    if (diagnostics.status === 'rejected') throw diagnostics.reason;
    return Object.freeze({ ...processResult.value, stderrBytes: diagnostics.value.length });
  })();
  void completion.catch(() => {});
  const protocol = createClaudeStreamProtocol(snapshot.sessionId);
  const events = new EventQueue();
  let resolveReady;
  let rejectReady;
  let readySettled = false;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  void ready.catch(() => {});

  async function publish(event) {
    const accepted = await events.push(event);
    if (!accepted) {
      void owned.stop().catch(() => {});
      return false;
    }
    return true;
  }

  const pump = (async () => {
    try {
      for await (const record of owned.stdout) {
        if (record.type !== 'record') {
          throw new ClaudeStreamError(`Claude stdout ${record.type} record`, 'MALFORMED_OUTPUT', { line: record.line ?? null });
        }
        const event = protocol.observe(record.value);
        if (event?.type === 'ready' && !readySettled) {
          readySettled = true;
          resolveReady(event);
        }
        if (event && !await publish(event)) break;
      }
    } catch (error) {
      if (!readySettled) {
        readySettled = true;
        rejectReady(new ClaudeStreamError('Claude stream failed before session initialization', error.code ?? 'STARTUP_ERROR'));
      }
      await owned.stop().catch(() => {});
      await publish({ type: 'protocol-fault', sessionId: snapshot.sessionId, code: error.code ?? 'CLAUDE_STREAM_ERROR' });
    } finally {
      const exit = await owned.completion;
      try { await stderr; }
      catch (error) { await publish({ type: 'stderr-error', sessionId: snapshot.sessionId, code: error.code ?? 'STDERR_ERROR' }); }
      for (const event of protocol.finish(exit)) await publish(event);
      if (!readySettled) {
        readySettled = true;
        rejectReady(new ClaudeStreamError('Claude process exited before session initialization', 'STARTUP_EXIT'));
      }
      events.close();
    }
  })();
  void pump.catch(() => {});

  async function send(input) {
    const prepared = protocol.prepare(input, snapshot.limits.maxInputBytes);
    try {
      const written = await owned.write(prepared.line);
      return { type: 'stdin-written', ...prepared.identity, bytes: written.bytes, backpressured: written.backpressured };
    } catch (error) {
      await publish(protocol.writeFailure(error));
      void owned.stop().catch(() => {});
      throw new ClaudeStreamError('Claude stream input write failed; delivery is ambiguous', error.code ?? 'WRITE_ERROR');
    }
  }

  async function stop() {
    protocol.requestStop();
    const exit = await owned.stop();
    await stderr;
    return exit;
  }

  return {
    sessionId: snapshot.sessionId,
    pid: owned.pid,
    generation: owned.generation,
    ready,
    events,
    processCompletion,
    completion,
    stderr,
    send,
    stop,
  };
}

import { startOwnedProcess } from './owned-process.mjs';

const CLIENT_INFO = Object.freeze({ name: 'grey-matter-orchestrator', title: 'grey-matter', version: '1.0.0' });
const CLIENT_CAPABILITIES = Object.freeze({});
const REQUEST_TIMEOUT_MS = 60_000;
const ALLOWED_OPTIONS = ['executable', 'cwd', 'env', 'limits', 'agent', 'model'];
const CLIENT_REQUEST_METHODS = new Set([
  'session/request_permission', 'fs/read_text_file', 'fs/write_text_file',
  'terminal/create', 'terminal/output', 'terminal/release', 'terminal/wait_for_exit', 'terminal/kill',
  'elicitation/create',
]);

function demand(ok, message, code = 'INVALID_INPUT') {
  if (!ok) throw new KiroAcpError(message, code);
}

function isRecord(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

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

function snapshotRecord(value, name) {
  demand(isRecord(value), `${name} must be an object`);
  return Object.fromEntries(Object.keys(value).map(key => [key, value[key]]));
}

export class KiroAcpError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'KiroAcpError';
    this.code = code;
    Object.assign(this, details);
  }
}

function protocolError(message, code = 'PROTOCOL_ERROR') { return new KiroAcpError(message, code); }

function validateInitializeResult(value) {
  demand(isRecord(value) && value.protocolVersion === 1,
    `Kiro selected unsupported ACP protocol version ${String(value?.protocolVersion)}`, 'UNSUPPORTED_PROTOCOL');
  return value;
}

function validateOptions(options) {
  demand(isRecord(options), 'Options must be an object');
  const keys = Object.keys(options);
  demand(keys.every(key => ALLOWED_OPTIONS.includes(key)), 'Unsupported Kiro ACP option');
  const supplied = Object.fromEntries(keys.map(key => [key, options[key]]));
  const { cwd, agent, model } = supplied;
  const executable = snapshotRecord(supplied.executable, 'Executable descriptor');
  const env = snapshotRecord(supplied.env, 'Environment');
  const limits = snapshotRecord(supplied.limits, 'Process limits');
  demand(typeof cwd === 'string' && cwd.length > 0, 'An explicit working directory is required');
  demand(Object.values(env).every(value => typeof value === 'string'), 'Environment values must be strings');
  demand(typeof agent === 'string' && agent.trim() === agent && agent.length > 0 && agent.length <= 128 && !/[\0\r\n]/.test(agent), 'A task-private Kiro agent name is required');
  demand(typeof model === 'string' && model.trim() === model && model.length > 0 && model.length <= 128 && !/[\0\r\n]/.test(model), 'A Kiro model name is required');
  return {
    executable: { ...executable }, cwd,
    env: { ...env }, limits: { ...limits }, agent, model,
  };
}

class EventQueue {
  #values = [];
  #waiters = [];
  #closed = false;
  #error = null;

  push(value) {
    if (this.#closed) return;
    const waiter = this.#waiters.shift();
    if (waiter) waiter.resolve({ value, done: false });
    else this.#values.push(value);
  }

  close(error = null) {
    if (this.#closed) return;
    this.#closed = true;
    this.#error = error;
    for (const waiter of this.#waiters.splice(0)) {
      if (error) waiter.reject(error);
      else waiter.resolve({ value: undefined, done: true });
    }
  }

  next() {
    if (this.#values.length) return Promise.resolve({ value: this.#values.shift(), done: false });
    if (this.#closed) return this.#error ? Promise.reject(this.#error) : Promise.resolve({ value: undefined, done: true });
    return new Promise((resolve, reject) => this.#waiters.push({ resolve, reject }));
  }

  [Symbol.asyncIterator]() { return this; }
}

/**
 * Own a Kiro ACP stdio process and create exactly one new, task-local session.
 * This module never executes tools requested by the agent.
 */
export async function startKiroAcp(input) {
  const options = validateOptions(input);
  const argv = ['acp', '--agent-engine', 'v2', '--agent', options.agent, '--model', options.model];
  const process = await startOwnedProcess({
    executable: options.executable,
    argv,
    cwd: options.cwd,
    env: options.env,
    limits: options.limits,
    stdoutMode: 'jsonl',
  });
  const stderr = drainStderr(process.stderr);
  const processCompletion = process.completion;
  const completion = (async () => {
    const [processResult, diagnostics] = await Promise.allSettled([processCompletion, stderr]);
    if (processResult.status === 'rejected') throw processResult.reason;
    if (diagnostics.status === 'rejected') throw diagnostics.reason;
    return Object.freeze({ ...processResult.value, stderrBytes: diagnostics.value.length });
  })();
  void completion.catch(() => {});
  const connection = createConnection({
    send: value => process.write(`${JSON.stringify(value)}\n`),
    onDisconnect: () => { void process.stop().catch(() => {}); },
  });
  const reader = consumeStdout(process, connection);
  const onExit = processCompletion.then(result => {
    connection.disconnect(new KiroAcpError('Kiro ACP process closed', 'DISCONNECTED', { process: result }));
    return result;
  });

  try {
    const initialized = validateInitializeResult(await connection.request('initialize', {
      protocolVersion: 1,
      clientCapabilities: CLIENT_CAPABILITIES,
      clientInfo: CLIENT_INFO,
    }));
    let created;
    try {
      created = await connection.request('session/new', { cwd: options.cwd, mcpServers: [] });
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED' || error.rpcCode === -32000) {
        throw new KiroAcpError('Kiro requires an authentication flow this adapter does not provide; use the existing Kiro CLI login and retry manually.', 'AUTH_REQUIRED');
      }
      throw error;
    }
    demand(isRecord(created) && typeof created.sessionId === 'string' && created.sessionId.length > 0,
      'session/new did not return a sessionId', 'INVALID_SESSION');
    connection.bindSession(created.sessionId);
    void reader.catch(() => {});

    let activePrompt = null;
    let closed = false;
    return Object.freeze({
      sessionId: created.sessionId,
      protocolVersion: 1,
      agentCapabilities: initialized.agentCapabilities ?? {},
      pid: process.pid,
      generation: process.generation,
      requestedAt: process.requestedAt,
      updates: connection.updates,
      async prompt(message) {
        demand(!closed, 'Kiro ACP session is closed', 'CLOSED');
        demand(activePrompt === null, 'Kiro ACP session is busy; overlapping prompts are refused', 'BUSY');
        const snapshot = validatePrompt(message);
        const requestId = connection.nextId();
        activePrompt = requestId;
        try {
          const result = await connection.requestWithId(requestId, 'session/prompt', {
            sessionId: created.sessionId,
            prompt: [{ type: 'text', text: snapshot.text }],
          });
          demand(isRecord(result) && typeof result.stopReason === 'string', 'session/prompt returned no stopReason', 'INVALID_RESULT');
          return Object.freeze({
            outcome: result.stopReason === 'cancelled' ? 'cancelled' : 'completed',
            stopReason: result.stopReason,
            sessionId: created.sessionId,
            requestId,
            messageId: snapshot.messageId,
            messageHash: snapshot.messageHash,
          });
        } catch (error) {
          if (error.code === 'CANCELLED') return Object.freeze({
            outcome: 'cancelled', stopReason: 'cancelled', sessionId: created.sessionId,
            requestId, messageId: snapshot.messageId, messageHash: snapshot.messageHash,
          });
          if (error.code !== 'RPC_ERROR') throw new KiroAcpError(
            'Kiro did not return a correlated prompt result; delivery and completion are ambiguous. Do not resend automatically.',
            'AMBIGUOUS', { requestId, messageId: snapshot.messageId, messageHash: snapshot.messageHash, causeCode: error.code ?? 'TRANSPORT_ERROR' },
          );
          throw error;
        } finally {
          activePrompt = null;
        }
      },
      async cancel() {
        demand(!closed, 'Kiro ACP session is closed', 'CLOSED');
        demand(activePrompt !== null, 'No active prompt to cancel', 'NO_ACTIVE_PROMPT');
        await connection.notify('session/cancel', { sessionId: created.sessionId });
      },
      async close() {
        let result;
        if (closed) result = await onExit;
        else {
          closed = true;
          result = await process.stop();
          connection.disconnect(new KiroAcpError('Kiro ACP process stopped by its owner', 'CLOSED', { process: result }));
        }
        await stderr;
        return result;
      },
      processCompletion,
      completion,
      stderr,
    });
  } catch (error) {
    connection.disconnect(error);
    try {
      const processResult = await process.stop();
      error.cleanup = { outcome: 'observed', process: processResult };
    } catch (stopError) {
      error.cleanup = { outcome: 'unobserved', code: stopError.code ?? 'STOP_ERROR', message: stopError.message };
      error.processCompletion = process.completion;
    }
    try { error.stderrBytes = (await stderr).length; }
    catch (stderrError) { error.stderrError = { code: stderrError.code ?? 'STDERR_ERROR' }; }
    throw error;
  }
}

function validatePrompt(value) {
  demand(isRecord(value), 'Prompt must be an object');
  const keys = Object.keys(value);
  const snapshot = { messageId: value.messageId, messageHash: value.messageHash, text: value.text };
  demand(keys.length === 3 && typeof snapshot.messageId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(snapshot.messageId)
    && typeof snapshot.messageHash === 'string' && /^[a-f0-9]{64}$/i.test(snapshot.messageHash)
    && typeof snapshot.text === 'string' && snapshot.text.length > 0 && !snapshot.text.includes('\0'),
  'Prompt requires messageId, SHA-256 messageHash and non-empty text');
  return { messageId: snapshot.messageId, messageHash: snapshot.messageHash.toLowerCase(), text: snapshot.text };
}

function validateSessionUpdate(params, sessionId) {
  demand(isRecord(params), 'Malformed session/update params', 'MALFORMED_UPDATE');
  const targetSessionId = params.sessionId;
  const rawUpdate = params.update;
  demand(targetSessionId === sessionId, 'Update targeted an unknown session', 'WRONG_SESSION');
  demand(isRecord(rawUpdate), 'Malformed session/update payload', 'MALFORMED_UPDATE');
  const update = structuredClone(rawUpdate);
  const discriminator = update.sessionUpdate;
  demand(typeof discriminator === 'string' && discriminator.length > 0,
    'Malformed session/update payload', 'MALFORMED_UPDATE');
  return update;
}

async function consumeStdout(process, connection) {
  try {
    for await (const frame of process.stdout) {
      if (frame.type !== 'record') throw protocolError(`Invalid ACP stdio frame (${frame.type})`, 'MALFORMED_FRAME');
      connection.receive(frame.value);
    }
    const result = await process.completion;
    if (result.reason !== 'stopped') connection.disconnect(new KiroAcpError('Kiro ACP stdout closed', 'DISCONNECTED', { process: result }));
  } catch (error) {
    connection.disconnect(error instanceof KiroAcpError ? error : new KiroAcpError('Kiro ACP transport failed', 'TRANSPORT_ERROR', { cause: error.message }));
    try { await process.stop(); } catch { /* shutdown evidence remains on process.completion */ }
  }
}

function createConnection({ send, onDisconnect = () => {} }) {
  const pending = new Map();
  const updates = new EventQueue();
  let id = 0;
  let sessionId = null;
  let closed = null;
  let promptOutstanding = false;

  function nextId() { id += 1; return id; }
  function disconnect(error) {
    if (closed) return;
    closed = error;
    onDisconnect(error);
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    pending.clear();
    updates.close(error);
  }
  function sendResponse(idValue, body) { return send({ jsonrpc: '2.0', id: idValue, ...body }); }
  async function notify(method, params) {
    if (closed) throw closed;
    await send({ jsonrpc: '2.0', method, params });
  }
  function requestWithId(requestId, method, params) {
    if (closed) return Promise.reject(closed);
    if (pending.has(requestId)) return Promise.reject(protocolError('Duplicate local JSON-RPC request id'));
    if (method === 'session/prompt' && promptOutstanding) return Promise.reject(new KiroAcpError('Kiro ACP session is busy; overlapping prompts are refused', 'BUSY'));
    if (method === 'session/prompt') promptOutstanding = true;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        disconnect(new KiroAcpError(`Kiro ACP ${method} request timed out`, 'REQUEST_TIMEOUT', { requestId }));
      }, REQUEST_TIMEOUT_MS);
      timer.unref?.();
      pending.set(requestId, { resolve, reject, timer, method });
    });
    void send({ jsonrpc: '2.0', id: requestId, method, params }).catch(error => {
      disconnect(error instanceof KiroAcpError ? error : new KiroAcpError('Kiro ACP stdin write failed', 'TRANSPORT_ERROR', { cause: error.message }));
    });
    return method === 'session/prompt' ? promise.finally(() => { promptOutstanding = false; }) : promise;
  }
  function request(method, params) { return requestWithId(nextId(), method, params); }

  function receive(frame) {
    if (closed) return;
    if (!isRecord(frame) || frame.jsonrpc !== '2.0') return disconnect(protocolError('Invalid JSON-RPC envelope', 'MALFORMED_FRAME'));
    if (Object.hasOwn(frame, 'method')) {
      if (typeof frame.method !== 'string') return disconnect(protocolError('JSON-RPC method is not a string', 'MALFORMED_FRAME'));
      const hasId = Object.hasOwn(frame, 'id');
      if (frame.method === 'session/update' && hasId) return disconnect(protocolError('session/update must be a notification', 'MALFORMED_FRAME'));
      if (!hasId && CLIENT_REQUEST_METHODS.has(frame.method)) return disconnect(protocolError(`${frame.method} requires a JSON-RPC request id`, 'MALFORMED_FRAME'));
      if (hasId) {
        if (!(typeof frame.id === 'string' || (typeof frame.id === 'number' && Number.isFinite(frame.id)))) {
          return disconnect(protocolError('Agent request has an invalid JSON-RPC id', 'MALFORMED_FRAME'));
        }
        if (frame.method === 'session/request_permission') {
          if (frame.params?.sessionId !== sessionId) return disconnect(protocolError('Permission request targeted an unknown session', 'WRONG_SESSION'));
          void sendResponse(frame.id, { result: { outcome: { outcome: 'cancelled' } } }).catch(disconnect);
        } else {
          void sendResponse(frame.id, { error: { code: -32601, message: `Unsupported client request: ${frame.method}` } }).catch(disconnect);
        }
        return;
      }
      if (frame.method === 'session/update') {
        if (!sessionId) return disconnect(protocolError('Update arrived before a session was bound', 'WRONG_SESSION'));
        try { updates.push(validateSessionUpdate(frame.params, sessionId)); }
        catch (error) { disconnect(error); }
      }
      return;
    }

    if (!Object.hasOwn(frame, 'id') || (Object.hasOwn(frame, 'result') === Object.hasOwn(frame, 'error'))) {
      return disconnect(protocolError('Malformed JSON-RPC response', 'MALFORMED_FRAME'));
    }
    const entry = pending.get(frame.id);
    if (!entry) return disconnect(protocolError(`Response used unknown or already-settled request id ${String(frame.id)}`, 'UNKNOWN_RESPONSE'));
    pending.delete(frame.id);
    clearTimeout(entry.timer);
    if (Object.hasOwn(frame, 'error')) {
      if (!isRecord(frame.error) || !Number.isInteger(frame.error.code) || typeof frame.error.message !== 'string') {
        entry.reject(protocolError('Malformed JSON-RPC error object', 'MALFORMED_FRAME'));
        return disconnect(protocolError('Malformed JSON-RPC error object', 'MALFORMED_FRAME'));
      }
      const errorCode = frame.error?.code === -32000 ? 'AUTH_REQUIRED' : frame.error?.code === -32800 ? 'CANCELLED' : 'RPC_ERROR';
      const error = new KiroAcpError(frame.error?.message ?? 'Kiro ACP request failed', errorCode, {
        rpcCode: frame.error?.code,
        requestId: frame.id,
        method: entry.method,
      });
      entry.reject(error);
    } else entry.resolve(structuredClone(frame.result));
  }

  return { nextId, request, requestWithId, notify, receive, disconnect, bindSession(value) { sessionId = value; }, updates };
}

/** Pure protocol seam used by synthetic JSON-RPC fixtures; it cannot launch a process. */
export function createKiroAcpProtocolFixture() {
  const sent = [];
  const connection = createConnection({ send: async message => { sent.push(structuredClone(message)); } });
  return Object.freeze({
    sent,
    receive: frame => connection.receive(structuredClone(frame)),
    bindSession: id => connection.bindSession(id),
    disconnect: error => connection.disconnect(error),
    request: (method, params) => connection.request(method, params),
    validateInitializeResult,
    validatePrompt,
    updates: connection.updates,
  });
}

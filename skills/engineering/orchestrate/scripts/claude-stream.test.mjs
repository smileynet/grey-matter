import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startOwnedProcess } from './owned-process.mjs';
import { claudeArgv, createClaudeStreamProtocol, startClaudeStream } from './claude-stream.mjs';

const sessionId = '2a1b9c3d-4e5f-4678-9abc-def012345678';
const protocolUuid = '3b2c0d4e-5f6a-4789-abcd-ef0123456789';
const executablePath = await realpath(process.execPath);
const executableHash = await hashFile(executablePath);
const env = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP']
  .filter(key => typeof process.env[key] === 'string')
  .map(key => [key, process.env[key]]));
const limits = {
  maxArgumentBytes: 32 * 1024,
  maxInputBytes: 1024 * 1024,
  maxStdoutBytes: 1024 * 1024,
  maxStderrBytes: 64 * 1024,
  maxLineBytes: 128 * 1024,
  deadlineMs: 5000,
  eofGraceMs: 150,
  terminateGraceMs: 150,
  forceGraceMs: 500,
};
const compiler = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const canCompileLocalFixture = process.platform === 'win32' && existsSync(compiler);
const stderrBytes = 2 * 1024 * 1024;
const csharpFixture = `using System;
class Fixture {
  static void Main(string[] args) {
    int remaining = Int32.Parse(Environment.GetEnvironmentVariable("FIXTURE_STDERR_BYTES") ?? "0");
    string block = new string('x', 8192);
    while (remaining > 0) { int count = Math.Min(remaining, block.Length); Console.Error.Write(block.Substring(0, count)); remaining -= count; }
    Console.Error.Flush();
    string sid = null;
    for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "--session-id") sid = args[i + 1];
    if (sid == null) { Environment.ExitCode = 13; return; }
    Console.Out.WriteLine("{\\\"type\\\":\\\"system\\\",\\\"subtype\\\":\\\"init\\\",\\\"uuid\\\":\\\"4c3d1e5f-6071-489a-bcde-f0123456789a\\\",\\\"session_id\\\":\\\"" + sid + "\\\",\\\"model\\\":\\\"synthetic\\\",\\\"claude_code_version\\\":\\\"fixture\\\",\\\"tools\\\":[],\\\"mcp_servers\\\":[],\\\"permissionMode\\\":\\\"dontAsk\\\"}"); Console.Out.Flush();
    while (Console.ReadLine() != null) { }
  }
}`;
let fixtureDirectory;
let fixtureExecutable;
let fixtureCwd;

async function localWrapperFixture(t) {
  if (!canCompileLocalFixture) t.skip('local wrapper executable fixture requires the already-installed Windows Framework C# compiler');
  if (!fixtureExecutable) {
    fixtureDirectory = await mkdtemp(join(tmpdir(), 'grey-matter-claude-stderr-'));
    const source = join(fixtureDirectory, 'Fixture.cs');
    const output = join(fixtureDirectory, 'Fixture.exe');
    await writeFile(source, csharpFixture, 'utf8');
    const compiled = spawnSync(compiler, ['/nologo', `/out:${output}`, source], { encoding: 'utf8' });
    assert.equal(compiled.status, 0, `${compiled.stdout}\n${compiled.stderr}`);
    fixtureCwd = await realpath(fixtureDirectory);
    const canonicalPath = await realpath(output);
    fixtureExecutable = { canonicalPath, sha256: await hashFile(canonicalPath), maxBytes: 1024 * 1024 };
  }
  const fixtureEnv = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP']
    .filter(key => typeof process.env[key] === 'string').map(key => [key, process.env[key]]));
  return { executable: fixtureExecutable, cwd: fixtureCwd, env: fixtureEnv };
}

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

test.after(async () => { if (fixtureDirectory) await rm(fixtureDirectory, { recursive: true, force: true }); });

function initRecord(overrides = {}) {
  return {
    type: 'system', subtype: 'init', uuid: '4c3d1e5f-6071-489a-bcde-f0123456789a',
    session_id: sessionId, model: 'claude-test', claude_code_version: 'test-fixture',
    tools: [], mcp_servers: [], permissionMode: 'dontAsk', ...overrides,
  };
}

function input(overrides = {}) {
  return {
    messageId: 'message-core-1', messageHash: 'a'.repeat(64), protocolUuid,
    sessionId, text: 'Review café 😀', ...overrides,
  };
}

function fixtureScript(replayUserMessages) {
  const sid = JSON.stringify(sessionId);
  const replay = replayUserMessages ? ', isReplay: true' : '';
  return `
    const sid = ${sid};
    const emit = value => process.stdout.write(JSON.stringify(value) + '\\n');
    emit({ type: 'system', subtype: 'init', uuid: '4c3d1e5f-6071-489a-bcde-f0123456789a', session_id: sid,
      model: 'claude-test', claude_code_version: 'test-fixture', tools: [], mcp_servers: [], permissionMode: 'dontAsk' });
    let pending = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      pending += chunk;
      const newline = pending.indexOf('\\n');
      if (newline < 0) return;
      const sent = JSON.parse(pending.slice(0, newline));
      emit({ type: 'user', uuid: sent.uuid, session_id: sid, message: sent.message,
        parent_tool_use_id: null${replay} });
      emit({ type: 'stream_event', uuid: '5d4e2f60-7182-49ab-cdef-0123456789ab', session_id: sid,
        parent_tool_use_id: null, user_message_uuid: sent.uuid,
        event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'réponse' } } });
      emit({ type: 'assistant', uuid: '5d4e2f60-7182-49ab-cdef-0123456789ab', session_id: sid,
        parent_tool_use_id: null, user_message_uuid: sent.uuid,
        message: { id: 'assistant-message-1', content: [{ type: 'text', text: 'réponse' }] } });
      emit({ type: 'result', uuid: '6e5f3071-8293-4abc-def0-123456789abc', session_id: sid,
        subtype: 'success', is_error: false, result: 'done', user_message_uuid: sent.uuid });
    });
    process.stdin.resume();
  `;
}

async function ownedFixture(script, customLimits = limits) {
  return startOwnedProcess({
    executable: { canonicalPath: executablePath, sha256: executableHash, maxBytes: 512 * 1024 * 1024 },
    argv: ['-e', script], cwd: tmpdir(), env, limits: customLimits, stdoutMode: 'jsonl',
  });
}

test('maps one streamed turn through exact replay, response correlation, result and process exit', async () => {
  const argv = claudeArgv({ sessionId, model: 'claude-test' });
  assert.ok(argv.includes('--replay-user-messages'));
  assert.deepEqual(argv.slice(argv.indexOf('--input-format'), argv.indexOf('--input-format') + 6), [
    '--input-format', 'stream-json', '--output-format', 'stream-json', '--replay-user-messages', '--verbose',
  ]);
  const child = await ownedFixture(fixtureScript(argv.includes('--replay-user-messages')));
  const protocol = createClaudeStreamProtocol(sessionId);
  const events = [];
  let resolveReady;
  const readyPromise = new Promise(resolve => { resolveReady = resolve; });
  const reading = (async () => {
    for await (const record of child.stdout) {
      assert.equal(record.type, 'record');
      const event = protocol.observe(record.value);
      if (event) events.push(event);
      if (event?.type === 'ready') resolveReady(event);
    }
  })();

  const ready = await readyPromise;
  assert.equal(ready.type, 'ready');
  assert.deepEqual(ready.tools, []);
  assert.deepEqual(ready.mcpServers, []);

  const source = input();
  const prepared = protocol.prepare(source, limits.maxInputBytes);
  source.text = 'mutated after prepare';
  const wire = JSON.parse(prepared.line);
  assert.deepEqual(Object.keys(wire).sort(), ['client_composed', 'message', 'parent_tool_use_id', 'session_id', 'type', 'uuid'].sort());
  assert.equal(wire.type, 'user');
  assert.equal(wire.uuid, protocolUuid);
  assert.equal(wire.session_id, sessionId);
  assert.deepEqual(wire.message, { role: 'user', content: 'Review café 😀' });
  assert.equal(wire.client_composed, true);
  assert.equal(wire.parent_tool_use_id, null);
  assert.throws(() => protocol.prepare(input({ protocolUuid: '7f604293-a4b5-4cde-8f01-23456789abcd' }), limits.maxInputBytes), error => error.code === 'BUSY');

  await child.write(prepared.line);
  await child.endInput();
  const processExit = await child.completion;
  await reading;
  assert.equal(processExit.exitCode, 0);
  events.push(...protocol.finish(processExit));

  assert.deepEqual(events.map(event => event.type), [
    'ready', 'input-replayed', 'stream-event', 'assistant', 'provider-result', 'process-exit',
  ]);
  assert.equal(events[1].messageId, 'message-core-1');
  assert.equal(events[1].protocolUuid, protocolUuid);
  assert.equal(events[1].isReplay, true);
  assert.equal(events[2].event.delta.text, 'réponse');
  assert.equal(events[3].messageId, 'assistant-message-1');
  assert.equal(events[4].result, 'done');
  assert.equal(events[4].isError, false);
  assert.equal(events[5].exitCode, 0);
  assert.throws(() => protocol.prepare(input(), limits.maxInputBytes), error => error.code === 'DUPLICATE_INPUT');
});

test('a synthetic input echo without the fixed replay flag is not an acknowledgment', () => {
  const argv = claudeArgv({ sessionId, model: 'claude-test' }).filter(flag => flag !== '--replay-user-messages');
  assert.ok(!argv.includes('--replay-user-messages'));
  const protocol = createClaudeStreamProtocol(sessionId);
  protocol.observe(initRecord());
  protocol.prepare(input(), limits.maxInputBytes);
  const event = protocol.observe({
    type: 'user', uuid: protocolUuid, session_id: sessionId,
    message: { role: 'user', content: 'Review café 😀' }, parent_tool_use_id: null,
  });
  assert.equal(event.type, 'input-observed');
  assert.equal(event.isReplay, false);
});

test('rejects wrong sessions, uncorrelated terminal results and duplicate replay', () => {
  const protocol = createClaudeStreamProtocol(sessionId);
  assert.throws(() => protocol.observe(initRecord({ session_id: '7f604293-a4b5-4cde-8f01-23456789abcd' })), error => error.code === 'SESSION_MISMATCH');
  protocol.observe(initRecord());
  protocol.prepare(input(), limits.maxInputBytes);
  const replay = {
    type: 'user', uuid: protocolUuid, session_id: sessionId, isReplay: true,
    parent_tool_use_id: null,
    message: { role: 'user', content: 'Review café 😀' },
  };
  assert.equal(protocol.observe(replay).type, 'input-replayed');
  assert.throws(() => protocol.observe(replay), error => error.code === 'PROTOCOL_ORDER');
  assert.throws(() => protocol.observe({
    type: 'result', session_id: sessionId, subtype: 'success', is_error: false,
    result: 'wrong task', user_message_uuid: '7f604293-a4b5-4cde-8f01-23456789abcd',
  }), error => error.code === 'CORRELATION_MISMATCH');
  assert.throws(() => protocol.observe({ type: 'assistant', session_id: '7f604293-a4b5-4cde-8f01-23456789abcd' }), error => error.code === 'SESSION_MISMATCH');
});

test('refuses initialization with tools, MCP servers or automatic permission mode', () => {
  for (const unsafe of [
    { tools: ['Read'] },
    { mcp_servers: [{ name: 'unexpected', status: 'connected' }] },
    { permissionMode: 'bypassPermissions' },
  ]) {
    const protocol = createClaudeStreamProtocol(sessionId);
    assert.throws(() => protocol.observe(initRecord(unsafe)), error => error.code === 'UNSAFE_SESSION');
    assert.equal(protocol.phase, 'starting');
  }
});

test('process exit is ambiguous for an accepted input without a correlated result', () => {
  const protocol = createClaudeStreamProtocol(sessionId);
  protocol.observe(initRecord());
  protocol.prepare(input(), limits.maxInputBytes);
  const events = protocol.finish({
    pid: 123, generation: 'fixture-generation', reason: 'exit', exitCode: 0, signal: null,
    startedAt: null, exitedAt: null, closedAt: null, stdoutBytes: 0, stderrBytes: 0, error: null,
  });
  assert.equal(events[0].type, 'ambiguous-disconnect');
  assert.equal(events[0].protocolUuid, protocolUuid);
  assert.equal(events[1].type, 'process-exit');
  assert.equal(events[1].exitCode, 0);
});

test('bounds fixture output through the owned-process byte limit', async () => {
  const child = await ownedFixture("process.stdout.write('x'.repeat(128)); setInterval(() => {}, 1000);", {
    ...limits, maxStdoutBytes: 32, maxLineBytes: 32, eofGraceMs: 30, terminateGraceMs: 150, forceGraceMs: 500,
  });
  const processExit = await child.completion;
  assert.equal(processExit.reason, 'output-limit');
  assert.ok(processExit.stdoutBytes > 32);
});

test('Claude wrapper eagerly drains chatty stderr before readiness and observes bounded diagnostics', { skip: !canCompileLocalFixture && 'already-installed Windows Framework C# compiler unavailable' }, async t => {
  const fixture = await localWrapperFixture(t);
  const client = await startClaudeStream({
    ...fixture,
    env: { ...fixture.env, FIXTURE_STDERR_BYTES: String(stderrBytes) },
    limits: { ...limits, maxStderrBytes: 4 * 1024 * 1024 },
    sessionId,
    model: 'synthetic-model',
  });
  const ready = await client.ready;
  assert.equal(ready.type, 'ready');
  const processExit = await client.stop();
  const [completion, diagnostics] = await Promise.all([client.completion, client.stderr]);
  assert.equal(processExit.exitCode, 0);
  assert.equal(completion.pid, processExit.pid);
  assert.equal(completion.stderrBytes, stderrBytes);
  assert.ok(Buffer.isBuffer(diagnostics));
  assert.equal(diagnostics.length, stderrBytes);
  assert.equal(diagnostics[0], 'x'.charCodeAt(0));
});

test('stderr limit failure rejects completion after owned-process cleanup', { skip: !canCompileLocalFixture && 'already-installed Windows Framework C# compiler unavailable' }, async t => {
  const fixture = await localWrapperFixture(t);
  const client = await startClaudeStream({
    ...fixture,
    env: { ...fixture.env, FIXTURE_STDERR_BYTES: String(stderrBytes) },
    limits: { ...limits, maxStderrBytes: 128 * 1024 },
    sessionId,
    model: 'synthetic-model',
  });
  const eventTypes = (async () => {
    const values = [];
    for await (const event of client.events) values.push(event.type);
    return values;
  })();
  await client.ready.catch(() => null);
  const diagnosticFailure = assert.rejects(client.stderr, { code: 'OUTPUT_LIMIT' });
  const completionFailure = assert.rejects(client.completion, { code: 'OUTPUT_LIMIT' });
  const processExit = await client.processCompletion;
  assert.equal(processExit.reason, 'output-limit');
  await diagnosticFailure;
  await completionFailure;
  const types = await eventTypes;
  assert.ok(types.includes('stderr-error'));
  assert.ok(types.includes('process-exit'));
  await assert.rejects(client.stop(), { code: 'OUTPUT_LIMIT' });
});

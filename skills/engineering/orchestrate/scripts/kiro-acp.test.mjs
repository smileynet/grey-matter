import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createKiroAcpProtocolFixture, KiroAcpError, startKiroAcp } from './kiro-acp.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const compiler = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const canCompileLocalFixture = process.platform === 'win32' && existsSync(compiler);
const sessionId = 'owned-session-fixture';
const stderrBytes = 2 * 1024 * 1024;
const csharpFixture = `using System;
class Fixture {
  static void Main(string[] args) {
    int remaining = Int32.Parse(Environment.GetEnvironmentVariable("FIXTURE_STDERR_BYTES") ?? "0");
    string block = new string('x', 8192);
    while (remaining > 0) { int count = Math.Min(remaining, block.Length); Console.Error.Write(block.Substring(0, count)); remaining -= count; }
    Console.Error.Flush();
    if (args.Length > 0 && args[0] == "acp") {
      string line = Console.ReadLine();
      if (line == null || !line.Contains("\\\"method\\\":\\\"initialize\\\"")) { Environment.ExitCode = 11; return; }
      Console.Out.WriteLine("{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"id\\\":1,\\\"result\\\":{\\\"protocolVersion\\\":1,\\\"agentCapabilities\\\":{}}}"); Console.Out.Flush();
      line = Console.ReadLine();
      if (line == null || !line.Contains("\\\"method\\\":\\\"session/new\\\"")) { Environment.ExitCode = 12; return; }
      Console.Out.WriteLine("{\\\"jsonrpc\\\":\\\"2.0\\\",\\\"id\\\":2,\\\"result\\\":{\\\"sessionId\\\":\\\"${sessionId}\\\"}}"); Console.Out.Flush();
      while (Console.ReadLine() != null) { }
      return;
    }
    string sid = null;
    for (int i = 0; i + 1 < args.Length; i++) if (args[i] == "--session-id") sid = args[i + 1];
    if (sid == null) { Environment.ExitCode = 13; return; }
    Console.Out.WriteLine("{\\\"type\\\":\\\"system\\\",\\\"subtype\\\":\\\"init\\\",\\\"uuid\\\":\\\"4c3d1e5f-6071-489a-bcde-f0123456789a\\\",\\\"session_id\\\":\\\"" + sid + "\\\",\\\"model\\\":\\\"synthetic\\\",\\\"claude_code_version\\\":\\\"fixture\\\",\\\"tools\\\":[],\\\"mcp_servers\\\":[],\\\"permissionMode\\\":\\\"dontAsk\\\"}"); Console.Out.Flush();
    while (Console.ReadLine() != null) { }
  }
}`;
let fixtureDirectory;
let executable;
let fixtureEnv;
let fixtureLimits;

async function hashFile(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

async function localFixture(t) {
  if (!canCompileLocalFixture) t.skip('local wrapper executable fixture requires the already-installed Windows Framework C# compiler');
  if (!executable) {
    fixtureDirectory = await mkdtemp(join(tmpdir(), 'grey-matter-kiro-stderr-'));
    const source = join(fixtureDirectory, 'Fixture.cs');
    const output = join(fixtureDirectory, 'Fixture.exe');
    await writeFile(source, csharpFixture, 'utf8');
    const compiled = spawnSync(compiler, ['/nologo', `/out:${output}`, source], { encoding: 'utf8' });
    assert.equal(compiled.status, 0, `${compiled.stdout}\n${compiled.stderr}`);
    const canonicalPath = await realpath(output);
    executable = { canonicalPath, sha256: await hashFile(canonicalPath), maxBytes: 1024 * 1024 };
    const cwd = await realpath(fixtureDirectory);
    fixtureEnv = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP']
      .filter(key => typeof process.env[key] === 'string').map(key => [key, process.env[key]]));
    fixtureLimits = {
      maxArgumentBytes: 64 * 1024, maxInputBytes: 1024 * 1024,
      maxStdoutBytes: 1024 * 1024, maxStderrBytes: 4 * 1024 * 1024,
      maxLineBytes: 128 * 1024, deadlineMs: 10_000,
      eofGraceMs: 250, terminateGraceMs: 250, forceGraceMs: 500,
    };
    return { cwd, executable, env: fixtureEnv, limits: fixtureLimits };
  }
  return { cwd: await realpath(fixtureDirectory), executable, env: fixtureEnv, limits: fixtureLimits };
}

test.after(async () => { if (fixtureDirectory) await rm(fixtureDirectory, { recursive: true, force: true }); });

test('protocol fixture binds exact IDs and surfaces a prompt result', async () => {
  const protocol = createKiroAcpProtocolFixture();
  const result = protocol.request('session/prompt', { sessionId: 'fixture-session', prompt: [{ type: 'text', text: 'synthetic' }] });
  await tick();
  assert.deepEqual(protocol.sent[0], {
    jsonrpc: '2.0', id: 1, method: 'session/prompt',
    params: { sessionId: 'fixture-session', prompt: [{ type: 'text', text: 'synthetic' }] },
  });
  protocol.receive({ jsonrpc: '2.0', id: 1, result: { stopReason: 'end_turn' } });
  assert.deepEqual(await result, { stopReason: 'end_turn' });
});

test('unsupported protocol versions are refused', () => {
  const protocol = createKiroAcpProtocolFixture();
  assert.throws(() => protocol.validateInitializeResult({ protocolVersion: 2 }), { code: 'UNSUPPORTED_PROTOCOL' });
  assert.throws(() => protocol.validateInitializeResult({}), { code: 'UNSUPPORTED_PROTOCOL' });
});

test('prompt metadata validates before text is sent', () => {
  const protocol = createKiroAcpProtocolFixture();
  assert.deepEqual(protocol.validatePrompt({ messageId: 'task.1', messageHash: 'A'.repeat(64), text: 'synthetic text' }), {
    messageId: 'task.1', messageHash: 'a'.repeat(64), text: 'synthetic text',
  });
  assert.throws(() => protocol.validatePrompt({ messageId: 'task.1', messageHash: 'bad', text: 'synthetic text' }), { code: 'INVALID_INPUT' });
  assert.throws(() => protocol.validatePrompt({ messageId: 'task.1', messageHash: 'a'.repeat(64), text: '' }), { code: 'INVALID_INPUT' });
  const source = { messageId: 'msg-safe', messageHash: 'a'.repeat(64), text: 'SAFE prompt' };
  let textReads = 0;
  const changing = new Proxy(source, {
    get(target, key, receiver) {
      if (key === 'text') {
        textReads += 1;
        return textReads === 1 ? 'SAFE prompt' : 'ALTERED prompt with same original identity';
      }
      return Reflect.get(target, key, receiver);
    },
  });
  assert.deepEqual(protocol.validatePrompt(changing), { ...source });
  assert.equal(textReads, 1);
});

test('malformed frames close the connection and reject pending requests', async () => {
  const protocol = createKiroAcpProtocolFixture();
  const result = protocol.request('initialize', { protocolVersion: 1 });
  await tick();
  protocol.receive({ jsonrpc: '1.0', id: 1, result: {} });
  await assert.rejects(result, { code: 'MALFORMED_FRAME' });
});

test('updates from a foreign or not-yet-bound session are rejected', async () => {
  const protocol = createKiroAcpProtocolFixture();
  protocol.bindSession('owned-session');
  protocol.receive({ jsonrpc: '2.0', method: 'session/update', params: { sessionId: 'foreign-session', update: {} } });
  await assert.rejects(protocol.updates.next(), { code: 'WRONG_SESSION' });
});

test('malformed session/update params and payloads close the connection without an event', async () => {
  for (const params of [undefined, { sessionId: 'owned-session' }, { sessionId: 'owned-session', update: {} }]) {
    const protocol = createKiroAcpProtocolFixture();
    protocol.bindSession('owned-session');
    protocol.receive({ jsonrpc: '2.0', method: 'session/update', ...(params === undefined ? {} : { params }) });
    await assert.rejects(protocol.updates.next(), { code: 'MALFORMED_UPDATE' });
  }
  const requestForm = createKiroAcpProtocolFixture();
  requestForm.bindSession('owned-session');
  requestForm.receive({ jsonrpc: '2.0', id: 17, method: 'session/update', params: { sessionId: 'owned-session', update: { sessionUpdate: 'agent_message_chunk' } } });
  await assert.rejects(requestForm.updates.next(), { code: 'MALFORMED_FRAME' });
});

test('agent-to-client requests without JSON-RPC IDs are malformed', async () => {
  const protocol = createKiroAcpProtocolFixture();
  protocol.bindSession('owned-session');
  protocol.receive({ jsonrpc: '2.0', method: 'session/request_permission', params: { sessionId: 'owned-session' } });
  await assert.rejects(protocol.updates.next(), { code: 'MALFORMED_FRAME' });
});

test('unknown and late duplicate responses are protocol errors', () => {
  const protocol = createKiroAcpProtocolFixture();
  const pending = protocol.request('initialize', {});
  return tick().then(async () => {
    protocol.receive({ jsonrpc: '2.0', id: 1, result: {} });
    await pending;
    protocol.receive({ jsonrpc: '2.0', id: 1, result: {} });
    await assert.rejects(protocol.request('session/new', {}), { code: 'UNKNOWN_RESPONSE' });
  });
});

test('only one protocol prompt may be in flight', async () => {
  const protocol = createKiroAcpProtocolFixture();
  const first = protocol.request('session/prompt', { sessionId: 'owned-session' });
  await tick();
  await assert.rejects(protocol.request('session/prompt', { sessionId: 'owned-session' }), { code: 'BUSY' });
  protocol.receive({ jsonrpc: '2.0', id: 1, result: { stopReason: 'end_turn' } });
  await first;
  const next = protocol.request('session/prompt', { sessionId: 'owned-session' });
  await tick();
  protocol.receive({ jsonrpc: '2.0', id: protocol.sent.at(-1).id, result: { stopReason: 'end_turn' } });
  await next;
});

test('permission requests are explicitly cancelled and file and terminal requests denied', async () => {
  const protocol = createKiroAcpProtocolFixture();
  protocol.bindSession('owned-session');
  protocol.receive({ jsonrpc: '2.0', id: 8, method: 'session/request_permission', params: { sessionId: 'owned-session' } });
  protocol.receive({ jsonrpc: '2.0', id: 9, method: 'fs/read_text_file', params: { path: 'synthetic' } });
  protocol.receive({ jsonrpc: '2.0', id: 10, method: 'terminal/create', params: {} });
  await tick();
  assert.deepEqual(protocol.sent, [
    { jsonrpc: '2.0', id: 8, result: { outcome: { outcome: 'cancelled' } } },
    { jsonrpc: '2.0', id: 9, error: { code: -32601, message: 'Unsupported client request: fs/read_text_file' } },
    { jsonrpc: '2.0', id: 10, error: { code: -32601, message: 'Unsupported client request: terminal/create' } },
  ]);
});

test('session cancellation error is distinct from transport disconnect', async () => {
  const protocol = createKiroAcpProtocolFixture();
  const result = protocol.request('session/prompt', { sessionId: 'owned-session' });
  await tick();
  protocol.receive({ jsonrpc: '2.0', id: 1, error: { code: -32800, message: 'cancelled' } });
  await assert.rejects(result, { code: 'CANCELLED' });

  const disconnected = createKiroAcpProtocolFixture();
  const pending = disconnected.request('session/prompt', { sessionId: 'owned-session' });
  await tick();
  disconnected.disconnect(new KiroAcpError('closed', 'DISCONNECTED'));
  await assert.rejects(pending, { code: 'DISCONNECTED' });
});

test('authentication and other remote errors retain separate boundary codes', async () => {
  const protocol = createKiroAcpProtocolFixture();
  const auth = protocol.request('session/new', { cwd: 'synthetic', mcpServers: [] });
  await tick();
  protocol.receive({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'login required' } });
  await assert.rejects(auth, { code: 'AUTH_REQUIRED', rpcCode: -32000 });

  const failed = createKiroAcpProtocolFixture();
  const task = failed.request('session/prompt', { sessionId: 'owned-session' });
  await tick();
  failed.receive({ jsonrpc: '2.0', id: 1, error: { code: -32603, message: 'synthetic failure' } });
  await assert.rejects(task, { code: 'RPC_ERROR', rpcCode: -32603 });
});

test('starts only after initialize then session/new while eagerly collecting bounded stderr', { skip: !canCompileLocalFixture && 'already-installed Windows Framework C# compiler unavailable' }, async t => {
  const fixture = await localFixture(t);
  const client = await startKiroAcp({
    ...fixture,
    env: { ...fixture.env, FIXTURE_STDERR_BYTES: String(stderrBytes) },
    agent: 'fixture-agent', model: 'fixture-model',
  });
  assert.equal(client.sessionId, sessionId);
  assert.equal(Number.isSafeInteger(client.pid), true);
  assert.ok(client.pid > 0);
  assert.match(client.generation, /^[0-9a-f-]{36}$/);
  assert.ok(Number.isFinite(Date.parse(client.requestedAt)));
  assert.equal(Object.isFrozen(client), true);
  const processExit = await client.close();
  const result = await client.completion;
  const diagnostics = await client.stderr;
  assert.equal(processExit.exitCode, 0);
  assert.equal(result.pid, client.pid);
  assert.equal(result.stderrBytes, stderrBytes);
  assert.ok(Buffer.isBuffer(diagnostics));
  assert.equal(diagnostics.length, stderrBytes);
  assert.equal(diagnostics[0], 'x'.charCodeAt(0));
});

test('stderr exceeding its owned byte limit is a visible startup and cleanup failure', { skip: !canCompileLocalFixture && 'already-installed Windows Framework C# compiler unavailable' }, async t => {
  const fixture = await localFixture(t);
  await assert.rejects(startKiroAcp({
    ...fixture,
    env: { ...fixture.env, FIXTURE_STDERR_BYTES: String(stderrBytes) },
    limits: { ...fixture.limits, maxStderrBytes: 128 * 1024 },
    agent: 'fixture-agent', model: 'fixture-model',
  }), error => {
    assert.equal(error.stderrError.code, 'OUTPUT_LIMIT');
    assert.equal(error.cleanup.outcome, 'observed');
    assert.equal(error.cleanup.process.reason, 'output-limit');
    return true;
  });
});

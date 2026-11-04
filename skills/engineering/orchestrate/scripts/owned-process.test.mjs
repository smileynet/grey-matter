import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, createReadStream, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { realpath } from 'node:fs/promises';
import { startOwnedProcess } from './owned-process.mjs';

const executablePath = await realpath(process.execPath);
const executableHash = await hashFile(executablePath);
const fixtureEnv = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP']
  .filter(key => typeof process.env[key] === 'string')
  .map(key => [key, process.env[key]]));
const limits = {
  maxArgumentBytes: 32 * 1024,
  maxInputBytes: 2 * 1024 * 1024,
  maxStdoutBytes: 2 * 1024 * 1024,
  maxStderrBytes: 64 * 1024,
  maxLineBytes: 128 * 1024,
  deadlineMs: 5_000,
  eofGraceMs: 150,
  terminateGraceMs: 150,
  forceGraceMs: 500,
};

async function hashFile(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function options(script, overrides = {}) {
  return {
    executable: { canonicalPath: executablePath, sha256: executableHash, maxBytes: 512 * 1024 * 1024 },
    argv: overrides.argv ?? ['-e', script],
    cwd: tmpdir(),
    env: fixtureEnv,
    limits: { ...limits, ...overrides.limits },
    stdoutMode: overrides.stdoutMode ?? 'jsonl',
  };
}

async function collect(stream) {
  const events = [];
  for await (const event of stream) events.push(event);
  return events;
}

test('decodes chunked UTF-8 JSON lines, including a split multibyte character', async () => {
  const proc = await startOwnedProcess(options(`
    const chunks = [Buffer.from('{"text":"caf'), Buffer.from([0xc3]), Buffer.from([0xa9]), Buffer.from(' 😀"}\\r'), Buffer.from('\\n{"done":true}\\n')];
    let i = 0;
    const next = () => { if (i < chunks.length) process.stdout.write(chunks[i++], next); };
    next();
  `));
  const events = await collect(proc.stdout);
  const exit = await proc.completion;
  assert.deepEqual(events, [
    { type: 'record', line: 1, value: { text: 'café 😀' } },
    { type: 'record', line: 2, value: { done: true } },
  ]);
  assert.equal(exit.reason, 'exit');
  assert.equal(exit.exitCode, 0);
  assert.equal(exit.pid, proc.pid);
  assert.ok(exit.generation);
  assert.ok(Date.parse(exit.startedAt) <= Date.parse(exit.exitedAt));
});

test('classifies malformed JSON, invalid UTF-8 and a final unterminated record', async () => {
  const proc = await startOwnedProcess(options(`
    const chunks = [Buffer.from('{"ok":true}\\n{bad}\\n'), Buffer.from([0xff, 0x0a]), Buffer.from('{"tail":true}')];
    for (const chunk of chunks) process.stdout.write(chunk);
  `));
  assert.deepEqual(await collect(proc.stdout), [
    { type: 'record', line: 1, value: { ok: true } },
    { type: 'malformed', line: 2 },
    { type: 'invalid-utf8', line: 3 },
    { type: 'truncated', line: 4, bytes: 13 },
  ]);
  assert.equal((await proc.completion).exitCode, 0);
});

test('classifies an oversized line and terminates the owned child on output overflow', async () => {
  const lineProc = await startOwnedProcess(options(`process.stdout.write('x'.repeat(80) + '\\n');`, {
    limits: { maxLineBytes: 32 },
  }));
  await assert.rejects(collect(lineProc.stdout), error => error.code === 'LINE_LIMIT'
    && error.line === 1 && error.limitBytes === 32);
  const lineExit = await lineProc.completion;
  assert.equal(lineExit.reason, 'output-limit');

  const outputProc = await startOwnedProcess(options(`setInterval(() => process.stdout.write('0123456789'), 1);`, {
    limits: { maxStdoutBytes: 32, maxLineBytes: 32 }, stdoutMode: 'raw',
  }));
  await assert.rejects(collect(outputProc.stdout), /stdout exceeds/);
  assert.equal((await outputProc.completion).reason, 'output-limit');

  const errorProc = await startOwnedProcess(options(`process.stderr.write('e'.repeat(80));`, {
    limits: { maxStderrBytes: 32 }, stdoutMode: 'raw',
  }));
  await assert.rejects(collect(errorProc.stderr), /stderr exceeds/);
  assert.equal((await errorProc.completion).reason, 'output-limit');
});

test('reports a spawn error without converting it into a successful process exit', async t => {
  const root = mkdtempSync(join(tmpdir(), 'owned-process-spawn-error-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const invalidExecutable = join(root, 'not-executable.bin');
  writeFileSync(invalidExecutable, 'not a program');
  if (process.platform !== 'win32') chmodSync(invalidExecutable, 0o600);
  try {
    const proc = await startOwnedProcess({
      ...options(''),
      executable: { canonicalPath: await realpath(invalidExecutable), sha256: await hashFile(invalidExecutable), maxBytes: 512 * 1024 * 1024 },
      argv: [],
    });
    const exit = await proc.completion;
    assert.equal(exit.reason, 'spawn-error');
    assert.ok(exit.error);
  } catch (error) {
    assert.equal(error.code, 'SPAWN_ERROR');
    assert.match(error.message, /spawn failed/);
  }
});

test('rejects executable hash mismatch before starting the child', async t => {
  const root = mkdtempSync(join(tmpdir(), 'owned-process-hash-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const marker = join(root, 'started.txt');
  await assert.rejects(startOwnedProcess({
    ...options(`require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started')`),
    executable: { canonicalPath: executablePath, sha256: '0'.repeat(64), maxBytes: 512 * 1024 * 1024 },
  }), /hash mismatch/);
  assert.equal(existsSync(marker), false);
});

test('rejects invalid argv before starting a child', async () => {
  await assert.rejects(startOwnedProcess(options('process.exit(0);', {
    argv: ['-e', 'bad\0argument'],
  })), /NUL-free/);
});

test('waits for stdin backpressure and observes normal EOF completion', async () => {
  const proc = await startOwnedProcess(options(`
    let bytes = 0;
    process.stdin.on('data', chunk => { bytes += chunk.length; });
    process.stdin.on('end', () => process.stdout.write(JSON.stringify({ bytes }) + '\\n'));
  `));
  const write = await proc.write('x'.repeat(1024 * 1024));
  assert.equal(write.backpressured, true);
  await proc.endInput();
  assert.deepEqual(await collect(proc.stdout), [{ type: 'record', line: 1, value: { bytes: 1024 * 1024 } }]);
  assert.equal((await proc.completion).reason, 'exit');
});

test('rejects cumulative input above the caller limit', async () => {
  const proc = await startOwnedProcess(options('setInterval(() => {}, 1000);', {
    limits: { maxInputBytes: 3 }, stdoutMode: 'raw',
  }));
  await assert.rejects(proc.write('four'), error => error.code === 'INPUT_LIMIT');
  assert.equal((await proc.stop()).reason, 'stopped');
});

test('snapshots and validates mutable caller options before asynchronous hashing', async () => {
  const originalScript = `process.stdin.resume();
process.stdin.on('end', () => process.stdout.write(JSON.stringify({
    env: process.env.OWNED_MUTATION,
    arg: process.argv[1],
  }) + '\\n'));`;
  const input = options(originalScript, {
    argv: ['-e', originalScript, 'original-argument'],
    limits: { maxInputBytes: 1 },
  });
  input.env = { ...fixtureEnv, OWNED_MUTATION: 'before' };

  const starting = startOwnedProcess(input);
  input.executable.canonicalPath = join(tmpdir(), 'replaced-after-start');
  input.executable.sha256 = '0'.repeat(64);
  input.executable.maxBytes = 1;
  input.argv[1] = `process.stdout.write('{"mutated":true}\\n')`;
  input.argv[2] = 'mutated-argument';
  input.cwd = join(tmpdir(), 'replaced-after-start');
  input.env.OWNED_MUTATION = 'after';
  input.limits.maxInputBytes = 100;
  input.stdoutMode = 'raw';

  const proc = await starting;
  const output = collect(proc.stdout);
  await assert.rejects(proc.write('xx'), error => error.code === 'INPUT_LIMIT');
  await proc.endInput();
  assert.deepEqual(await output, [
    { type: 'record', line: 1, value: { env: 'before', arg: 'original-argument' } },
  ]);
  assert.equal((await proc.completion).exitCode, 0);
});

test('stops only its exact child after EOF grace and leaves an unrelated sibling alive', async t => {
  const sibling = spawn(executablePath, ['-e', 'setInterval(() => {}, 1000)'], {
    cwd: tmpdir(), env: fixtureEnv, shell: false, windowsHide: true,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  t.after(() => { if (sibling.exitCode === null && sibling.signalCode === null) sibling.kill(); });
  const proc = await startOwnedProcess(options('setInterval(() => {}, 1000);', {
    limits: { eofGraceMs: 30, terminateGraceMs: 150, forceGraceMs: 500 },
    stdoutMode: 'raw',
  }));
  const started = Date.now();
  const stopped = await proc.stop();
  const elapsed = Date.now() - started;
  assert.equal(stopped.pid, proc.pid);
  assert.equal(stopped.reason, 'stopped');
  assert.ok(stopped.signal);
  assert.ok(elapsed < 2_000);
  assert.equal(sibling.exitCode, null);
  assert.equal(sibling.signalCode, null);
});

test('escalates to force signal when the owned child ignores termination', {
  skip: process.platform === 'win32' ? 'Windows terminates this fixture on SIGTERM and cannot exercise escalation.' : false,
}, async () => {
  const proc = await startOwnedProcess(options(`
    process.on('SIGTERM', () => {});
    setInterval(() => {}, 1000);
  `, { limits: { eofGraceMs: 30, terminateGraceMs: 30 }, stdoutMode: 'raw' }));
  const stopped = await proc.stop();
  assert.equal(stopped.signal, 'SIGKILL');
  assert.equal(stopped.reason, 'stopped');
});

test('applies the caller deadline to the owned child', async () => {
  const proc = await startOwnedProcess(options('setInterval(() => {}, 1000);', {
    limits: { deadlineMs: 100, eofGraceMs: 30, terminateGraceMs: 100 },
    stdoutMode: 'raw',
  }));
  const exit = await proc.completion;
  assert.equal(exit.reason, 'deadline');
  assert.ok(exit.signal || exit.exitCode !== null);
});

test('rejects writes after early child exit with an explicit outcome', async () => {
  const proc = await startOwnedProcess(options('process.exit(0);', { stdoutMode: 'raw' }));
  await proc.completion;
  await assert.rejects(proc.write('late'), /process is no longer writable/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';

const roots = [];
function runtime() { const root = mkdtempSync(join(tmpdir(), 'session-messages-')); roots.push(root); return root; }
function target(nativeId = 'session-a', generation = 1, host = 'host-a') {
  return { project: 'project-a', host, harness: 'codex', harnessVersion: 'not-reported', interface: 'desktop', nativeId, generation, role: 'worker', worktree: 'D:/work/project-a', branch: 'worker/one' };
}
function setup() {
  const root = runtime(); operate(root, 'init');
  const a = target(); const b = target('session-b');
  operate(root, 'register', { target: a }); operate(root, 'register', { target: b });
  return { root, a, b };
}
function send(root, from, to, id = 'm-1', body = 'hello') { return operate(root, 'send', { id, correlationId: 'c-1', from, to, body }); }
test.after(() => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });

test('init preserves unknown files and creates versioned private runtime structure', () => {
  const root = runtime(); const keep = join(root, 'keep.txt'); writeFileSync(keep, 'unowned');
  const result = operate(root, 'init');
  assert.equal(result.version, 1); assert.equal(readFileSync(keep, 'utf8'), 'unowned');
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')), { version: 1, sessions: [] });
});

test('requires exact registered target, and rejects stale generations before enqueue', () => {
  const { root, a, b } = setup();
  assert.throws(() => send(root, { ...a, nativeId: 'new-session' }, b), /not registered/);
  assert.throws(() => send(root, { ...a, harnessVersion: '1.2.3' }, b), /not registered/);
  assert.throws(() => operate(root, 'register', { target: { ...a, generation: 1 } }), /Generation must increase/);
  assert.throws(() => send(root, { ...a, generation: 2 }, b), /not registered/);
  const updated = { ...a, harnessVersion: '1.2.3', generation: 2 };
  operate(root, 'register', { target: updated });
  assert.throws(() => send(root, a, b), /not active/);
  assert.equal(send(root, updated, b).result, 'queued');
  assert.equal(operate(root, 'status').messages[0].from.generation, 2);
  assert.equal(operate(root, 'status').messages[0].from.harnessVersion, '1.2.3');
});

test('retirement is exact, preserves other sessions and message history, and blocks retired routes', () => {
  const { root, a, b } = setup(); const prior = send(root, a, b, 'before-retire').message;
  assert.throws(() => operate(root, 'retire', { target: { ...b, host: 'wrong-host' } }), /not registered/);
  assert.throws(() => operate(root, 'retire', { target: { ...b, generation: 2 } }), /not registered/);
  assert.equal(operate(root, 'retire', { target: b }).result, 'retired');
  assert.throws(() => operate(root, 'accept', { id: 'before-retire', target: b }), /not active/);
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const state = JSON.parse(execFileSync(process.execPath, [script, 'status', '--root', root], { encoding: 'utf8' }));
  assert.deepEqual(state.sessions.map(s => s.status), ['registered', 'retired']);
  assert.deepEqual(state.messages[0], prior);
  assert.throws(() => send(root, a, b), /not active/);
  assert.equal(operate(root, 'register', { target: { ...b, generation: 2 } }).result, 'registered');
  assert.equal(operate(root, 'status').sessions[1].status, 'retired');
});

test('stable duplicate is idempotent and changed content under same id conflicts', () => {
  const { root, a, b } = setup();
  assert.equal(send(root, a, b).result, 'queued');
  assert.equal(send(root, a, b).result, 'duplicate');
  assert.throws(() => send(root, a, b, 'm-1', 'changed'), /Message id conflict/);
  assert.equal(operate(root, 'status').messages.length, 1);
});

test('receipt lifecycle persists across a new CLI process and wrong target cannot advance it', () => {
  const { root, a, b } = setup(); send(root, a, b);
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const afterRestart = JSON.parse(execFileSync(process.execPath, [script, 'status', '--root', root], { encoding: 'utf8' }));
  assert.equal(afterRestart.messages[0].state, 'queued');
  assert.throws(() => operate(root, 'accept', { id: 'm-1', target: a }), /Wrong target/);
  assert.deepEqual(operate(root, 'poll', { target: b }).messages, []);
  operate(root, 'accept', { id: 'm-1', target: b });
  assert.deepEqual(operate(root, 'poll', { target: b }).messages.map(m => m.state), ['accepted']);
  operate(root, 'receive', { id: 'm-1', target: b });
  operate(root, 'handle', { id: 'm-1', target: b });
  assert.equal(operate(root, 'ack', { id: 'm-1', target: b }).message.state, 'acked');
  assert.equal(operate(root, 'status').messages[0].state, 'acked');
  assert.deepEqual(operate(root, 'poll', { target: b }).messages, []);
});

test('out-of-order transitions and acknowledgment loops are rejected; repeats are idempotent', () => {
  const { root, a, b } = setup(); send(root, a, b);
  assert.throws(() => operate(root, 'receive', { id: 'm-1', target: b }), /expected accepted/);
  operate(root, 'accept', { id: 'm-1', target: b });
  assert.equal(operate(root, 'accept', { id: 'm-1', target: b }).result, 'duplicate');
  assert.throws(() => operate(root, 'send', { id: 'ack-1', kind: 'ack', from: b, to: a, body: 'ack' }), /send only creates message records/);
  operate(root, 'receive', { id: 'm-1', target: b });
  operate(root, 'handle', { id: 'm-1', target: b });
  assert.equal(operate(root, 'ack', { id: 'm-1', target: b }).message.state, 'acked');
  assert.equal(operate(root, 'ack', { id: 'm-1', target: b }).result, 'duplicate');
});

test('replay returns the persisted envelope unchanged and does not retry delivery', () => {
  const { root, a, b } = setup(); const original = send(root, a, b).message;
  const replay = operate(root, 'replay', { id: original.id, target: b });
  assert.equal(replay.result, 'replay-unchanged'); assert.deepEqual(replay.message, original);
  assert.equal(operate(root, 'status').messages.length, 1);
});

test('reply and done records require the persisted parent route and share its correlation', () => {
  const { root, a, b } = setup(); send(root, a, b, 'parent', 'question');
  assert.throws(() => operate(root, 'reply', { id: 'r-1', replyTo: 'missing', from: b, to: a, body: 'answer' }), /Unknown replyTo/);
  assert.throws(() => operate(root, 'reply', { id: 'r-1', replyTo: 'parent', from: a, to: b, body: 'wrong route' }), /reverse the exact parent/);
  const reply = operate(root, 'reply', { id: 'r-1', replyTo: 'parent', from: b, to: a, body: 'answer' }).message;
  assert.equal(reply.correlationId, 'c-1'); assert.equal(reply.state, 'queued'); assert.equal(reply.kind, 'reply');
  const done = operate(root, 'done', { id: 'd-1', replyTo: 'parent', from: b, to: a, body: 'finished' }).message;
  assert.equal(done.correlationId, 'c-1'); assert.equal(done.kind, 'done');
});

test('ambiguous lock/timeout state fails closed without deleting or retrying', () => {
  const { root, a, b } = setup();
  const lock = join(root, '.lock'); writeFileSync(lock, JSON.stringify({ pid: 999999, started: 'unknown' }));
  assert.throws(() => send(root, a, b), /inspect owner\/process and recover manually/);
  assert.equal(existsSync(lock), true);
  assert.deepEqual(JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')).sessions.length, 2);
  assert.deepEqual(readdirSync(join(root, 'messages')), []);
});

test('native delivery commands are unavailable; only the spool protocol can be invoked', () => {
  const root = runtime(); operate(root, 'init');
  assert.throws(() => operate(root, 'notify-native'), /Unknown command/);
});

test('CLI requires an explicit root and emits a machine-readable init receipt', () => {
  const root = runtime();
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [script, 'init', '--root', root], { encoding: 'utf8' });
  assert.equal(JSON.parse(output).result, 'initialized');
  assert.throws(() => execFileSync(process.execPath, [script, 'status'], { stdio: 'ignore' }));
  assert.throws(() => execFileSync(process.execPath, [script, 'status', '--root', root, '--unexpected'], { stdio: 'ignore' }));
  assert.throws(() => execFileSync(process.execPath, [script, 'status', '--root', root, '--json', join(root, 'empty.json'), '--unexpected'], { stdio: 'ignore' }));
});

test('CLI and persisted data reject unknown input fields and filename identity drift', () => {
  const { root, a, b } = setup();
  assert.throws(() => operate(root, 'send', { id: 'm-x', from: a, to: b, body: 'hi', trusted: true }), /Unsupported input field/);
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const input = join(root, 'input.json'); writeFileSync(input, JSON.stringify({ id: 'm-x', from: a, to: b, body: 'hi', unexpected: 1 }));
  assert.throws(() => execFileSync(process.execPath, [script, 'send', '--root', root, '--json', input], { stdio: 'ignore' }));
  send(root, a, b, 'real-id');
  const original = join(root, 'messages', 'real-id.json'); const wrongName = join(root, 'messages', 'other-name.json');
  writeFileSync(wrongName, readFileSync(original));
  assert.throws(() => operate(root, 'status'), /does not match persisted filename/);
});

test('send rejects reply metadata and response kinds before persistence, leaving the spool readable', () => {
  const { root, a, b } = setup();
  for (const [id, extra] of [
    ['bad-number', { replyTo: 17 }], ['bad-object', { replyTo: { id: 'parent' } }],
    ['bad-array', { replyTo: ['parent'] }], ['bad-string', { replyTo: 'parent' }],
    ['bad-reply-kind', { kind: 'reply' }], ['bad-done-kind', { kind: 'done' }]
  ]) {
    assert.throws(() => operate(root, 'send', { id, from: a, to: b, body: 'invalid', ...extra }));
    assert.deepEqual(operate(root, 'status').messages, []);
  }
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const input = join(root, 'invalid-send.json');
  writeFileSync(input, JSON.stringify({ id: 'cli-bad-reply', from: a, to: b, body: 'invalid', replyTo: 17 }));
  assert.throws(() => execFileSync(process.execPath, [script, 'send', '--root', root, '--json', input], { stdio: 'ignore' }));
  assert.deepEqual(operate(root, 'status').messages, []);
  assert.equal(send(root, a, b, 'valid-after-rejections').result, 'queued');
  assert.equal(operate(root, 'status').messages.length, 1);
});

test('subprocess crashes around atomic message rename leave ambiguous locks and never auto-resend', () => {
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const fixture = `const fs = require('node:fs'); const { syncBuiltinESMExports } = require('node:module'); const rename = fs.renameSync; fs.renameSync = function(source, target) { if (String(target).endsWith('m-crash.json') && process.env.CRASH_AT === 'before') process.exit(81); const result = rename.call(this, source, target); if (String(target).endsWith('m-crash.json') && process.env.CRASH_AT === 'after') process.exit(82); return result; }; syncBuiltinESMExports();`;
  for (const phase of ['before', 'after']) {
    const { root, a, b } = setup();
    const keep = join(root, 'unowned.txt'); writeFileSync(keep, 'keep me');
    const input = join(root, 'crash-input.json'); writeFileSync(input, JSON.stringify({ id: 'm-crash', correlationId: 'corr-crash', from: a, to: b, body: `persist-${phase}` }));
    const preload = join(root, 'fault.cjs'); writeFileSync(preload, fixture);
    const child = execFileSync;
    let exitCode;
    try { child(process.execPath, ['--require', preload, script, 'send', '--root', root, '--json', input], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CRASH_AT: phase } }); }
    catch (error) { exitCode = error.status; }
    assert.equal(exitCode, phase === 'before' ? 81 : 82);
    const recordPath = join(root, 'messages', 'm-crash.json');
    assert.equal(existsSync(recordPath), phase === 'after');
    const messageFiles = readdirSync(join(root, 'messages'));
    if (phase === 'before') {
      const staged = messageFiles.find(name => name.endsWith('.tmp'));
      assert.ok(staged, 'pre-rename crash should leave its staged file for inspection');
      assert.equal(JSON.parse(readFileSync(join(root, 'messages', staged), 'utf8')).body, 'persist-before');
    }
    const lock = join(root, '.lock'); assert.equal(existsSync(lock), true);
    assert.throws(() => execFileSync(process.execPath, [script, 'status', '--root', root], { stdio: 'ignore' }));
    assert.equal(existsSync(lock), true, 'restart must leave the ambiguous lock untouched');
    if (phase === 'after') {
      const persisted = JSON.parse(readFileSync(recordPath, 'utf8'));
      assert.equal(persisted.id, 'm-crash'); assert.equal(persisted.correlationId, 'corr-crash'); assert.equal(persisted.state, 'queued');
    }
    // This fixture owns the runtime and performs the documented manual recovery step.
    rmSync(lock);
    if (phase === 'after') {
      const duplicate = operate(root, 'send', { id: 'm-crash', correlationId: 'corr-crash', from: a, to: b, body: 'persist-after' });
      assert.equal(duplicate.result, 'duplicate');
      assert.equal(operate(root, 'status').messages.length, 1);
    } else {
      assert.deepEqual(operate(root, 'status').messages, []);
      assert.equal(operate(root, 'send', { id: 'm-crash', correlationId: 'corr-crash', from: a, to: b, body: 'persist-before' }).result, 'queued');
    }
    assert.equal(readFileSync(keep, 'utf8'), 'keep me');
  }
});

test('runtime path permission failure is surfaced', () => {
  const { root, a, b } = setup();
  const messages = join(root, 'messages');
  if (process.platform === 'win32') {
    const account = `${process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\` : ''}${process.env.USERNAME}`;
    execFileSync('icacls.exe', [messages, '/deny', `${account}:(W)`], { stdio: 'ignore' });
    try { assert.throws(() => send(root, a, b), /EACCES|EPERM|permission|denied/i); }
    finally { execFileSync('icacls.exe', [messages, '/remove:d', account], { stdio: 'ignore' }); }
  } else {
    chmodSync(messages, 0o500);
    try { assert.throws(() => send(root, a, b), /EACCES|permission/i); }
    finally { chmodSync(messages, 0o700); }
  }
});

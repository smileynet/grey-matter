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
  return { project: 'project-a', host, harness: 'codex', interface: 'desktop', nativeId, generation, role: 'worker', worktree: 'D:/work/project-a', branch: 'worker/one' };
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
  assert.throws(() => operate(root, 'register', { target: { ...a, generation: 1 } }), /Generation must increase/);
  assert.throws(() => send(root, { ...a, generation: 2 }, b), /not registered/);
  operate(root, 'register', { target: { ...a, generation: 2 } });
  assert.throws(() => send(root, a, b), /not active/);
  assert.deepEqual(operate(root, 'status').messages, []);
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
  assert.throws(() => operate(root, 'send', { id: 'ack-1', kind: 'ack', from: b, to: a, body: 'ack' }), /kind must be/);
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

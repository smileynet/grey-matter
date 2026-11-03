import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';
import { capabilityMatrix, prepareNativeNotification } from './native-notification.mjs';

const from = { project: 'p', host: 'h', harness: 'codex', harnessVersion: 'observed', interface: 'desktop', nativeId: 'parent-agent', generation: 2, role: 'orchestrator', worktree: 'D:/repo', branch: 'main' };
const to = { ...from, nativeId: 'worker-existing', role: 'worker', worktree: 'D:/worker', branch: 'codex/task' };
function fixture(t, target = to) {
  const root = mkdtempSync(join(tmpdir(), 'notification-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  operate(root, 'init'); operate(root, 'register', { target: from }); operate(root, 'register', { target });
  operate(root, 'send', { id: 'msg-1', from, to: target, body: 'Complete bounded assignment.' });
  operate(root, 'accept', { id: 'msg-1', target });
  return root;
}
const args = (target = to) => ({ id: 'msg-1', target, expectedNativeId: target.nativeId, nativeApi: 'collaboration.followup_task', generation: target.generation });

test('prepares exact existing Codex collaboration action from accepted record and persists its binding', t => {
  const root = fixture(t);
  const result = prepareNativeNotification(root, args());
  assert.equal(result.result, 'prepared');
  assert.equal(result.toolAction.tool, 'collaboration.followup_task');
  assert.equal(result.toolAction.arguments.target, 'worker-existing');
  assert.match(result.toolAction.arguments.message, /Complete bounded assignment/);
  assert.match(result.toolAction.arguments.message, /messages[\\/]msg-1\.json/);
  const intent = JSON.parse(readFileSync(result.intent, 'utf8'));
  assert.equal(intent.target.nativeId, 'worker-existing');
  assert.equal(intent.contentHash, JSON.parse(readFileSync(join(root, 'messages', 'msg-1.json'), 'utf8')).contentHash);
  assert.equal(operate(root, 'replay', { id: 'msg-1', target: to }).result, 'replay-unchanged');
});

test('expected native ID is independent and must match target', t => {
  const root = fixture(t);
  assert.throws(() => prepareNativeNotification(root, { ...args(), expectedNativeId: 'copied-wrong' }), /differs/);
  assert.equal(prepareNativeNotification(root, args()).result, 'prepared');
});

test('duplicate preparation and leftover lock never yield another action', t => {
  const root = fixture(t);
  prepareNativeNotification(root, args());
  assert.throws(() => prepareNativeNotification(root, args()), /prior intent/);
  const another = fixture(t);
  writeFileSync(join(another, '.lock'), '{}');
  assert.throws(() => prepareNativeNotification(another, args()), /Ambiguous runtime lock/);
});

test('unsupported adapter, stale target, and wrong generation fail closed', t => {
  const root = fixture(t);
  assert.throws(() => prepareNativeNotification(root, { ...args(), nativeApi: 'codex-cli.queue' }), /Unsupported/);
  assert.throws(() => prepareNativeNotification(root, { ...args(), generation: 1 }), /generation/);
  const stale = { ...to, generation: 3 };
  assert.throws(() => prepareNativeNotification(root, args(stale)), /unregistered/);
  assert.deepEqual(capabilityMatrix()['kiro-cli'], 'unsupported/unqualified');
});

test('unaccepted or altered records and malformed input paths are rejected', t => {
  const root = fixture(t);
  const path = join(root, 'messages', 'msg-1.json');
  const msg = JSON.parse(readFileSync(path, 'utf8')); msg.body = 'tampered'; writeFileSync(path, JSON.stringify(msg));
  assert.throws(() => prepareNativeNotification(root, args()), /hash mismatch/);
  assert.throws(() => prepareNativeNotification(root, { ...args(), id: '../registry' }), /Invalid message id/);
  assert.throws(() => prepareNativeNotification(root, { ...args(), target: { ...to, extra: true } }), /exactly/);
});

test('unaccepted record cannot create intent', t => {
  const root = mkdtempSync(join(tmpdir(), 'notification-unaccepted-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  operate(root, 'init'); operate(root, 'register', { target: from }); operate(root, 'register', { target: to });
  operate(root, 'send', { id: 'msg-1', from, to, body: 'pending' });
  assert.throws(() => prepareNativeNotification(root, args()), /accepted/);
});

test('CLI rejects trailing arguments without creating a notification intent', t => {
  const root = fixture(t);
  const input = join(root, 'prepare.json');
  writeFileSync(input, JSON.stringify(args()));
  const script = fileURLToPath(new URL('./native-notification.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, 'prepare', '--root', root, '--json', input, '--dry-run'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
  assert.equal(existsSync(join(root, 'notification-intents')), false);
});

test('Codex collaboration interface is unsupported by the desktop-only preparer', t => {
  const target = { ...to, interface: 'collaboration' };
  const root = fixture(t, target);
  assert.throws(() => prepareNativeNotification(root, args(target)), /Unsupported or unqualified/);
});

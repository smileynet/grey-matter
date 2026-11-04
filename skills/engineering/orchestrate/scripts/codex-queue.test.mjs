import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';
import { startNativeNotificationAttempt, nativeTransportActionHash } from './native-notification.mjs';
import { codexQueueArgv, prepareCodexQueue } from './codex-queue.mjs';

const from = { project: 'p', host: 'h', harness: 'codex', harnessVersion: 'observed', interface: 'desktop', nativeId: 'parent-agent', generation: 2, role: 'orchestrator', worktree: 'D:/repo', branch: 'main' };
const target = { ...from, interface: 'cli', nativeId: '123e4567-e89b-12d3-a456-426614174000', role: 'worker', worktree: 'D:/worker', branch: 'codex/task' };
function fixture(t, context = undefined) {
  const root = mkdtempSync(join(tmpdir(), 'codex-queue-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  operate(root, 'init'); operate(root, 'register', { target: from }); operate(root, 'register', { target });
  operate(root, 'send', { id: 'msg-1', from, to: target, body: 'Complete bounded assignment.', ...(context === undefined ? {} : { context }) });
  operate(root, 'accept', { id: 'msg-1', target });
  return root;
}
function request(deadlineAt = new Date(Date.now() + 60_000).toISOString()) {
  return { id: 'msg-1', target, threadId: target.nativeId, deadlineAt };
}
function runtimeConfig(root) {
  const path = join(root, 'codex-cli-fixture.exe');
  const bytes = Buffer.from('test-only executable bytes; never invoked');
  writeFileSync(path, bytes);
  return {
    executable: { canonicalPath: realpathSync(path), sha256: createHash('sha256').update(bytes).digest('hex'), maxBytes: 1024 },
    remote: { endpoint: 'ws://127.0.0.1:4500', owner: { pid: process.pid, generation: randomUUID() } },
  };
}

test('prepares a fingerprinted Codex queue action and fixed public argv without invoking it', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  const prepared = await prepareCodexQueue(root, request(), config);
  const intent = JSON.parse(readFileSync(prepared.intent, 'utf8'));
  assert.equal(prepared.transportAction.route, 'codex-cli-queue');
  assert.deepEqual(prepared.transportAction.remote, config.remote);
  assert.deepEqual(prepared.transportAction.executable, config.executable);
  assert.equal(prepared.transportAction.threadId, target.nativeId);
  assert.equal(intent.actionHash, prepared.actionHash);
  assert.deepEqual(intent.transportAction, prepared.transportAction);
  assert.equal(prepared.binding.actionHash, prepared.actionHash);
  const argv = codexQueueArgv(prepared.transportAction, prepared.actionHash);
  assert.deepEqual(argv, ['queue', '--thread', target.nativeId, `--message=${prepared.transportAction.message}`, '--remote', config.remote.endpoint]);
  assert.equal(argv.includes('--resume'), false);
  const started = startNativeNotificationAttempt(root, prepared.binding);
  assert.deepEqual(started.transportAction, intent.transportAction);
  assert.equal(started.actionHash, intent.actionHash);
  assert.equal(JSON.parse(readFileSync(prepared.intent, 'utf8')).events[0].actionHash, intent.actionHash);
});

test('rejects target, executable, loopback endpoint and arbitrary command mismatches before writing an intent', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  await assert.rejects(prepareCodexQueue(root, { ...request(), threadId: '123e4567-e89b-12d3-a456-426614174001' }, config), /threadId|Expected native ID/);
  for (const wrongTarget of [{ ...target, host: 'other-host' }, { ...target, generation: target.generation + 1 }]) {
    await assert.rejects(prepareCodexQueue(root, { ...request(), target: wrongTarget }, config), /target|registered/i);
  }
  await assert.rejects(prepareCodexQueue(root, request(), { ...config, executable: { ...config.executable, sha256: '0'.repeat(64) } }), /bytes do not match/);
  await assert.rejects(prepareCodexQueue(root, request(), { ...config, executable: { ...config.executable, maxBytes: 1 } }), /exceeds its trusted-caller/);
  await assert.rejects(prepareCodexQueue(root, request(), { ...config, executable: { ...config.executable, maxBytes: 1_073_741_825 } }), /no greater/);
  for (const endpoint of ['ws://localhost:4500', 'wss://127.0.0.1:4500', 'ws://user@127.0.0.1:4500', 'ws://127.0.0.1:70000']) {
    await assert.rejects(prepareCodexQueue(root, request(), { ...config, remote: { ...config.remote, endpoint } }), /endpoint/);
  }
  await assert.rejects(prepareCodexQueue(root, { ...request(), argv: ['--dangerous'] }, config), /plain data object|exactly/);
  await assert.rejects(prepareCodexQueue(root, request(), { ...config, remote: { ...config.remote, argv: ['--dangerous'] } }), /plain data object|exactly/);
  assert.equal(existsSync(join(root, 'notification-intents')), false);
});

test('rejects a UUID that maps to more than one active Codex CLI registration', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  operate(root, 'register', { target: { ...target, host: 'other-host', worktree: 'D:/other-worker' } });
  await assert.rejects(prepareCodexQueue(root, request(), config), /ambiguous/);
  assert.equal(existsSync(join(root, 'notification-intents')), false);
});

test('attempt-start refuses a queue UUID that became ambiguous after preparation', async t => {
  const root = fixture(t);
  const prepared = await prepareCodexQueue(root, request(), runtimeConfig(root));
  operate(root, 'register', { target: { ...target, host: 'other-host', worktree: 'D:/other-worker' } });
  assert.throws(() => startNativeNotificationAttempt(root, prepared.binding), /ambiguous/);
  assert.equal(JSON.parse(readFileSync(prepared.intent, 'utf8')).events.length, 0);
});

test('keeps message text in one option value and rejects action drift at attempt-start', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  const prepared = await prepareCodexQueue(root, request(), config);
  const before = readFileSync(prepared.intent, 'utf8');
  const tampered = { ...prepared.transportAction, message: '--enable arbitrary-feature' };
  assert.throws(() => codexQueueArgv(tampered, prepared.actionHash), /hash mismatch/);
  assert.throws(() => startNativeNotificationAttempt(root, { ...prepared.binding, actionHash: 'a'.repeat(64) }), /action hash/);
  assert.equal(readFileSync(prepared.intent, 'utf8'), before);
  const argv = codexQueueArgv(tampered, nativeTransportActionHash(tampered));
  assert.equal(argv[3], `--message=${tampered.message}`);
  assert.equal(argv.length, 6);
});

test('derives argv only from the exact action snapshot that matched its fingerprint', async t => {
  const root = fixture(t);
  const prepared = await prepareCodexQueue(root, request(), runtimeConfig(root));
  const originalMessage = prepared.transportAction.message;
  let messageReads = 0;
  const changingAction = new Proxy(prepared.transportAction, {
    get(object, key, receiver) {
      if (key === 'message' && ++messageReads >= 5) return '--TAMPERED AFTER FINGERPRINT';
      return Reflect.get(object, key, receiver);
    },
  });
  const argv = codexQueueArgv(changingAction, prepared.actionHash);
  assert.equal(messageReads, 0);
  assert.equal(argv[3], `--message=${originalMessage}`);
  assert.equal(argv.includes('--message=--TAMPERED AFTER FINGERPRINT'), false);
});

test('binds optional context through the canonical envelope and action fingerprints', async t => {
  const contextA = { ticket: '235', candidate: { kind: 'not-produced' }, handoff: { path: 'handoffs/a.md', sha256: '1'.repeat(64) } };
  const contextB = { ...contextA, handoff: { path: 'handoffs/b.md', sha256: '2'.repeat(64) } };
  const rootA = fixture(t, contextA);
  const rootB = fixture(t, contextB);
  const actionA = await prepareCodexQueue(rootA, request(), runtimeConfig(rootA));
  const actionB = await prepareCodexQueue(rootB, request(), runtimeConfig(rootB));
  assert.notEqual(actionA.transportAction.contentHash, actionB.transportAction.contentHash);
  assert.notEqual(actionA.actionHash, actionB.actionHash);
  assert.match(actionA.transportAction.message, /Bound work context:.*"ticket":"235"/);
});

test('owner handle fields remain a caller assertion and are preserved verbatim', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  const prepared = await prepareCodexQueue(root, request(), config);
  assert.deepEqual(prepared.transportAction.remote.owner, config.remote.owner);
  assert.equal(prepared.claim.includes('not verified native delivery'), true);
});

test('snapshots every request and runtime identity before asynchronous executable hashing', async t => {
  const root = fixture(t);
  const config = runtimeConfig(root);
  const intent = request();
  const originalDeadline = intent.deadlineAt;
  const originalConfig = JSON.parse(JSON.stringify(config));
  const pending = prepareCodexQueue(root, intent, config);
  intent.id = 'changed-after-call';
  intent.target = { ...target, nativeId: '123e4567-e89b-12d3-a456-426614174001' };
  intent.threadId = intent.target.nativeId;
  intent.deadlineAt = new Date(Date.now() - 60_000).toISOString();
  config.executable.canonicalPath = 'Z:\\changed-after-call\\codex.exe';
  config.executable.sha256 = '0'.repeat(64);
  config.executable.maxBytes = 1;
  config.remote.endpoint = 'ws://127.0.0.1:4501';
  config.remote.owner.pid = process.pid + 1;
  config.remote.owner.generation = randomUUID();
  const prepared = await pending;
  assert.equal(prepared.binding.id, 'msg-1');
  assert.deepEqual(prepared.transportAction.target, target);
  assert.equal(prepared.transportAction.threadId, target.nativeId);
  assert.equal(prepared.transportAction.remote.endpoint, originalConfig.remote.endpoint);
  assert.deepEqual(prepared.transportAction.remote.owner, originalConfig.remote.owner);
  assert.deepEqual(prepared.transportAction.executable, originalConfig.executable);
  assert.equal(JSON.parse(readFileSync(prepared.intent, 'utf8')).deadlineAt, originalDeadline);
});

test('CLI reads separate data files and returns a plan without starting Codex', t => {
  const root = fixture(t);
  const requestFile = join(root, 'request.json');
  const configFile = join(root, 'trusted-runtime.json');
  writeFileSync(requestFile, JSON.stringify(request()));
  writeFileSync(configFile, JSON.stringify(runtimeConfig(root)));
  const script = fileURLToPath(new URL('./codex-queue.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, 'prepare', '--root', root, '--request', requestFile, '--runtime-config', configFile], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).transportAction.route, 'codex-cli-queue');
  assert.equal(JSON.parse(result.stdout).transportAction.threadId, target.nativeId);
});

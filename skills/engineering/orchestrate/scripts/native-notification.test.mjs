import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';
import { capabilityMatrix, expireNativeNotification, inspectNativeNotification, nativeTransportActionHash, ownedStreamInput, prepareNativeNotification, recordNativeNotificationOutcome, recordNativeNotificationReceipt, startNativeNotificationAttempt } from './native-notification.mjs';

const from = { project: 'p', host: 'h', harness: 'codex', harnessVersion: 'observed', interface: 'desktop', nativeId: 'parent-agent', generation: 2, role: 'orchestrator', worktree: 'D:/repo', branch: 'main' };
const to = { ...from, nativeId: 'worker-existing', role: 'worker', worktree: 'D:/worker', branch: 'codex/task' };
function fixture(t, target = to, context = undefined) {
  const root = mkdtempSync(join(tmpdir(), 'notification-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  operate(root, 'init'); operate(root, 'register', { target: from }); operate(root, 'register', { target });
  operate(root, 'send', { id: 'msg-1', from, to: target, body: 'Complete bounded assignment.', ...(context === undefined ? {} : { context }) });
  operate(root, 'accept', { id: 'msg-1', target });
  return root;
}
const args = (target = to) => ({ id: 'msg-1', target, expectedNativeId: target.nativeId, nativeApi: 'collaboration.followup_task', generation: target.generation, deadlineAt: new Date(Date.now() + 60_000).toISOString() });
const claudeSessionId = '123e4567-e89b-42d3-a456-426614174000';
const claudeProtocolUuid = '123e4567-e89b-42d3-a456-426614174001';
const owner = { pid: 4321, generation: '123e4567-e89b-42d3-a456-426614174002' };
function ownedArgs(route) {
  const claude = route === 'claude-owned-stream';
  const target = { ...to, harness: claude ? 'claude' : 'kiro-cli', interface: claude ? 'stream-json' : 'acp',
    nativeId: claude ? claudeSessionId : 'kiro-session-opaque/abc-1' };
  return {
    id: 'msg-1', target, expectedNativeId: target.nativeId, nativeApi: claude ? 'claude-stream.send' : 'kiro-acp.prompt',
    generation: target.generation, deadlineAt: new Date(Date.now() + 60_000).toISOString(),
    transport: { route, owner, ...(claude ? { protocolUuid: claudeProtocolUuid } : {}) },
  };
}

test('context-bearing handoffs use canonical core validation for preparation and receipts', t => {
  const root = fixture(t);
  const message = operate(root, 'send', { id: 'context-1', from, to, body: 'Inspect the bound handoff.',
    context: { ticket: '179', candidate: { kind: 'not-produced' }, handoff: { path: 'handoffs/179.md', sha256: '1'.repeat(64) } } }).message;
  operate(root, 'accept', { id: message.id, target: to });
  const prepared = prepareNativeNotification(root, { ...args(), id: message.id });
  assert.equal(prepared.binding.contentHash, message.contentHash);
  const started = startNativeNotificationAttempt(root, prepared.binding);
  operate(root, 'receive', { id: message.id, target: to });
  const recorded = recordNativeNotificationReceipt(root, { ...prepared.binding, revision: started.revision });
  assert.equal(recorded.lifecycle.status, 'receipt-confirmed');
  assert.equal(recorded.lifecycle.receipt.receipt.contentHash, message.contentHash);
});

test('prepares exact existing Codex collaboration action from accepted record and persists its binding', t => {
  const root = fixture(t);
  const input = args();
  const result = prepareNativeNotification(root, input);
  assert.equal(result.result, 'prepared');
  assert.equal(result.toolAction.tool, 'collaboration.followup_task');
  assert.equal(result.toolAction.arguments.target, 'worker-existing');
  assert.match(result.toolAction.arguments.message, /Complete bounded assignment/);
  assert.match(result.toolAction.arguments.message, /messages[\\/]msg-1\.json/);
  const intent = JSON.parse(readFileSync(result.intent, 'utf8'));
  assert.equal(intent.target.nativeId, 'worker-existing');
  assert.equal(intent.contentHash, JSON.parse(readFileSync(join(root, 'messages', 'msg-1.json'), 'utf8')).contentHash);
  assert.equal(intent.intentVersion, 3);
  assert.equal(intent.revision, 0);
  assert.equal(intent.deadlineAt, input.deadlineAt);
  assert.equal(intent.events.length, 0);
  assert.equal(intent.actionHash, result.actionHash);
  assert.deepEqual(intent.transportAction, result.transportAction);
  assert.equal(result.binding.actionHash, result.actionHash);
  assert.equal(operate(root, 'replay', { id: 'msg-1', target: to }).result, 'replay-unchanged');
});

test('prepares a self-contained Claude stream intent and converts only for the same owned client', t => {
  const root = fixture(t, ownedArgs('claude-owned-stream').target,
    { ticket: '242', candidate: { kind: 'not-produced' }, handoff: { path: 'handoffs/242.md', sha256: 'a'.repeat(64) } });
  const prepared = prepareNativeNotification(root, ownedArgs('claude-owned-stream'));
  const intent = JSON.parse(readFileSync(prepared.intent, 'utf8'));
  const action = intent.transportAction;
  assert.equal(action.route, 'claude-owned-stream');
  assert.equal(action.sessionId, claudeSessionId);
  assert.equal(action.target.nativeId, claudeSessionId);
  assert.equal(action.protocolUuid, claudeProtocolUuid);
  assert.equal(action.owner.pid, owner.pid);
  assert.match(action.text, /Complete bounded assignment/);
  assert.match(action.text, /"ticket":"242"/);
  assert.doesNotMatch(action.text, /messages[\\/]msg-1\.json/);
  assert.equal(prepared.actionHash, nativeTransportActionHash(action));
  const started = startNativeNotificationAttempt(root, prepared.binding);
  const converted = ownedStreamInput(started.transportAction, started.actionHash,
    { ...owner, sessionId: claudeSessionId });
  assert.equal(converted.route, 'claude-owned-stream');
  assert.deepEqual(converted.input, { messageId: 'msg-1', messageHash: prepared.binding.contentHash,
    protocolUuid: claudeProtocolUuid, sessionId: claudeSessionId, text: action.text });
  assert.equal(JSON.parse(readFileSync(prepared.intent, 'utf8')).events[0].actionHash, prepared.actionHash);
});

test('prepares a self-contained Kiro ACP intent with opaque negotiated session binding', t => {
  const input = ownedArgs('kiro-owned-acp');
  const root = fixture(t, input.target,
    { ticket: '242', candidate: { kind: 'not-produced' }, handoff: { path: 'handoffs/242.md', sha256: 'b'.repeat(64) } });
  const prepared = prepareNativeNotification(root, input);
  const action = JSON.parse(readFileSync(prepared.intent, 'utf8')).transportAction;
  assert.equal(action.route, 'kiro-owned-acp');
  assert.equal(action.sessionId, 'kiro-session-opaque/abc-1');
  assert.equal(action.target.nativeId, action.sessionId);
  assert.equal(Object.hasOwn(action, 'protocolUuid'), false);
  assert.match(action.text, /Complete bounded assignment/);
  assert.doesNotMatch(action.text, /messages[\\/]msg-1\.json/);
  const started = startNativeNotificationAttempt(root, prepared.binding);
  const converted = ownedStreamInput(started.transportAction, started.actionHash,
    { ...owner, sessionId: action.sessionId });
  assert.equal(converted.route, 'kiro-owned-acp');
  assert.deepEqual(converted.input, { messageId: 'msg-1', messageHash: prepared.binding.contentHash, text: action.text });
});

test('owned intent converter rejects route, identity, owner, hash and unknown-field mismatches', t => {
  for (const route of ['claude-owned-stream', 'kiro-owned-acp']) {
    const input = ownedArgs(route);
    const root = fixture(t, input.target);
    assert.throws(() => prepareNativeNotification(root, { ...input, expectedNativeId: 'different-target-session' }), /differs from the registered recipient/);
    const prepared = prepareNativeNotification(root, input);
    const started = startNativeNotificationAttempt(root, prepared.binding);
    const action = started.transportAction;
    const live = { ...owner, sessionId: input.target.nativeId };
    const wrongHash = `${started.actionHash.slice(0, -1)}${started.actionHash.endsWith('0') ? '1' : '0'}`;
    assert.throws(() => ownedStreamInput(action, wrongHash, live), /hash mismatch/);
    assert.throws(() => ownedStreamInput(action, started.actionHash, { ...live, pid: live.pid + 1 }), /exact live owned client/);
    assert.throws(() => ownedStreamInput(action, started.actionHash, { ...live, generation: claudeProtocolUuid }), /exact live owned client/);
    assert.throws(() => ownedStreamInput(action, started.actionHash, { ...live, sessionId: 'different-live-session' }), /exact live owned client/);
    assert.throws(() => ownedStreamInput(action, started.actionHash, { ...live, callback: 'send' }), /only its exact process and session identity/);
    const wrongSession = { ...action, sessionId: 'different-target-session' };
    assert.throws(() => ownedStreamInput(wrongSession, nativeTransportActionHash(wrongSession), live), /session identity/);
    const extra = { ...action, command: 'arbitrary' };
    assert.throws(() => ownedStreamInput(extra, nativeTransportActionHash(extra), live), /Malformed .* action/);
    for (const malformed of [
      { ...action, messageId: {} },
      { ...action, messageId: 'bad/id' },
      { ...action, contentHash: {} },
      { ...action, contentHash: 'A'.repeat(64) },
    ]) {
      assert.throws(() => ownedStreamInput(malformed, nativeTransportActionHash(malformed), live), /Malformed .* action/);
    }
    assert.throws(() => prepareNativeNotification(root, { ...input, callback: 'send' }), /unknown or missing fields/);
    assert.throws(() => prepareNativeNotification(root, { ...input, transport: { ...input.transport, command: 'arbitrary' } }), /transport configuration/);
  }
});

test('owned preparation snapshots plain data once and rejects getters without invoking them', t => {
  const root = fixture(t, ownedArgs('claude-owned-stream').target);
  const input = ownedArgs('claude-owned-stream');
  let getterCalls = 0;
  Object.defineProperty(input, 'nativeApi', { enumerable: true, get() { getterCalls++; return 'claude-stream.send'; } });
  assert.throws(() => prepareNativeNotification(root, input), /accessor/);
  assert.equal(getterCalls, 0);
  assert.equal(existsSync(join(root, 'notification-intents')), false);

  const transportGetterRoot = fixture(t, input.target);
  const transportGetter = ownedArgs('claude-owned-stream');
  let ownerGetterCalls = 0;
  Object.defineProperty(transportGetter.transport, 'owner', { enumerable: true, get() {
    ownerGetterCalls++;
    return owner;
  } });
  assert.throws(() => prepareNativeNotification(transportGetterRoot, transportGetter), /accessor/);
  assert.equal(ownerGetterCalls, 0);
  assert.equal(existsSync(join(transportGetterRoot, 'notification-intents')), false);

  const protocolIdRoot = fixture(t, input.target);
  assert.throws(() => prepareNativeNotification(protocolIdRoot, { ...input,
    transport: { ...input.transport, protocolUuid: input.target.nativeId } }), /distinct canonical session and protocol UUIDs/);
  assert.equal(existsSync(join(protocolIdRoot, 'notification-intents', 'msg-1.json')), false);

  const valid = prepareNativeNotification(root, ownedArgs('claude-owned-stream'));
  const started = startNativeNotificationAttempt(root, valid.binding);
  const action = started.transportAction;
  const hostileAction = new Proxy(action, { get(target, key, receiver) {
    return key === 'text' ? 'changed after fingerprint' : Reflect.get(target, key, receiver);
  } });
  const converted = ownedStreamInput(hostileAction, started.actionHash, { ...owner, sessionId: claudeSessionId });
  assert.equal(converted.input.text, action.text);
  assert.notEqual(converted.input.text, 'changed after fingerprint');
  const live = { ...owner, sessionId: claudeSessionId };
  const hostileLive = new Proxy(live, { get(target, key, receiver) {
    return key === 'sessionId' ? 'changed-live-session' : Reflect.get(target, key, receiver);
  } });
  assert.equal(ownedStreamInput(action, started.actionHash, hostileLive).input.sessionId, claudeSessionId);
});

test('owned preparation rejects stale registrations and preserves the old route matrix', t => {
  const input = ownedArgs('kiro-owned-acp');
  const root = fixture(t, input.target);
  operate(root, 'retire', { target: input.target });
  assert.throws(() => prepareNativeNotification(root, input), /unregistered|not registered|stale|not active/i);
  assert.equal(capabilityMatrix().claude.startsWith('fixed owned stream intent preparation only'), true);
  assert.equal(capabilityMatrix()['kiro-cli'].startsWith('fixed owned ACP intent preparation only'), true);
  assert.equal(capabilityMatrix()['codex:desktop'].startsWith('conditional preparation support only'), true);
  assert.equal(capabilityMatrix()['codex:cli'].startsWith('fixed codex queue plan preparation only'), true);
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
  assert.throws(() => prepareNativeNotification(another, args()), /Runtime is locked|Ambiguous runtime lock/);
});

test('unsupported adapter, stale target, and wrong generation fail closed', t => {
  const root = fixture(t);
  assert.throws(() => prepareNativeNotification(root, { ...args(), nativeApi: 'codex-cli.queue' }), /Unsupported/);
  assert.throws(() => prepareNativeNotification(root, { ...args(), generation: 1 }), /generation/);
  const stale = { ...to, generation: 3 };
  assert.throws(() => prepareNativeNotification(root, args(stale)), /unregistered|not registered/);
  assert.equal(capabilityMatrix()['kiro-cli'].startsWith('fixed owned ACP intent preparation only'), true);
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
  assert.throws(() => prepareNativeNotification(root, args(target)), /Unsupported.*target|unqualified/);
});

test('deadline is required, strictly UTC and future before any intent or action exists', t => {
  const root = fixture(t);
  const input = args();
  for (const deadlineAt of [undefined, new Date(Date.now() - 1000).toISOString(), '2099-01-01T00:00:00+00:00', 'not-a-date']) {
    assert.throws(() => prepareNativeNotification(root, { ...input, deadlineAt }), /deadlineAt/);
  }
  assert.equal(existsSync(join(root, 'notification-intents')), false);
});

test('attempt start is durable and fingerprint-bound before native invocation; attestations are not receipts', t => {
  const root = fixture(t);
  const prepared = prepareNativeNotification(root, args());
  const started = startNativeNotificationAttempt(root, prepared.binding);
  const persisted = JSON.parse(readFileSync(prepared.intent, 'utf8'));
  assert.equal(persisted.revision, 1);
  assert.equal(persisted.events[0].type, 'attempt-start');
  assert.equal(persisted.events[0].actionHash, prepared.actionHash);
  assert.equal(started.lifecycle.status, 'attempt-ambiguous');
  assert.equal(started.actionHash, prepared.actionHash);
  assert.deepEqual(started.transportAction, prepared.transportAction);
  const outcome = recordNativeNotificationOutcome(root, { ...prepared.binding, revision: started.revision }, 'accepted');
  assert.equal(outcome.lifecycle.status, 'outcome-accepted');
  assert.equal(outcome.lifecycle.receipt, null);
  assert.equal(outcome.lifecycle.outcome.evidence, 'parent-attestation');
  assert.throws(() => startNativeNotificationAttempt(root, { ...prepared.binding, revision: outcome.revision }), /already started/);
});

test('explicit expiry before an attempt is known not sent and blocks action preparation', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00.000Z') });
  const root = fixture(t);
  const deadlineAt = new Date(Date.now() + 30).toISOString();
  const prepared = prepareNativeNotification(root, { ...args(), deadlineAt });
  t.mock.timers.setTime(Date.parse(deadlineAt) + 1);
  const expired = expireNativeNotification(root, prepared.binding);
  assert.equal(expired.lifecycle.status, 'dead-letter-not-sent');
  assert.equal(expired.lifecycle.deadLetter.certainty, 'not-sent');
  assert.throws(() => prepareNativeNotification(root, args()), /prior intent/);
  assert.throws(() => startNativeNotificationAttempt(root, { ...prepared.binding, revision: expired.revision }), /dead-lettered/);
});

test('explicit expiry after a started attempt is ambiguous and inspect survives process restart', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00.000Z') });
  const root = fixture(t);
  const deadlineAt = new Date(Date.now() + 30).toISOString();
  const prepared = prepareNativeNotification(root, { ...args(), deadlineAt });
  const started = startNativeNotificationAttempt(root, prepared.binding);
  t.mock.timers.setTime(Date.parse(deadlineAt) + 1);
  const expired = expireNativeNotification(root, { ...prepared.binding, revision: started.revision });
  assert.equal(expired.lifecycle.status, 'dead-letter-ambiguous');
  const script = fileURLToPath(new URL('./native-notification.mjs', import.meta.url));
  const input = join(root, 'inspect.json');
  writeFileSync(input, JSON.stringify({ id: 'msg-1' }));
  const result = spawnSync(process.execPath, [script, 'inspect', '--root', root, '--json', input], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const inspection = JSON.parse(result.stdout);
  assert.equal(inspection.lifecycle.status, 'dead-letter-ambiguous');
  assert.equal(inspection.intent.events[0].type, 'attempt-start');
  assert.throws(() => expireNativeNotification(root, { ...prepared.binding, revision: expired.revision }), /already dead-lettered/);
});

test('expiry records a correlated receipt that reached the spool before its deadline', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00.000Z') });
  const root = fixture(t);
  const deadlineAt = new Date(Date.now() + 1500).toISOString();
  const prepared = prepareNativeNotification(root, { ...args(), deadlineAt });
  const received = operate(root, 'receive', { id: 'msg-1', target: to }).message;
  assert.ok(Date.parse(received.receivedAt) <= Date.parse(deadlineAt), 'fixture receipt must precede the deadline');
  assert.equal(inspectNativeNotification(root, 'msg-1').intent.events.length, 0, 'no separate receipt event was recorded');
  t.mock.timers.setTime(Date.parse(deadlineAt) + 1);
  const expired = expireNativeNotification(root, prepared.binding);
  assert.equal(expired.lifecycle.status, 'receipt-confirmed');
  assert.equal(expired.lifecycle.deadLetter, null);
  assert.deepEqual(JSON.parse(readFileSync(prepared.intent, 'utf8')).events.map(event => event.type), ['receipt']);
});

test('receipt already present when explicit expiry runs prevents a new dead letter even if received after deadline', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00.000Z') });
  const root = fixture(t);
  const deadlineAt = new Date(Date.now() + 30).toISOString();
  const prepared = prepareNativeNotification(root, { ...args(), deadlineAt });
  t.mock.timers.setTime(Date.parse(deadlineAt) + 1);
  const received = operate(root, 'receive', { id: 'msg-1', target: to }).message;
  assert.ok(Date.parse(received.receivedAt) > Date.parse(deadlineAt), 'fixture receipt must follow the deadline');
  const expired = expireNativeNotification(root, prepared.binding);
  assert.equal(expired.lifecycle.status, 'receipt-confirmed');
  assert.equal(expired.lifecycle.deadLetter, null);
  assert.deepEqual(JSON.parse(readFileSync(prepared.intent, 'utf8')).events.map(event => event.type), ['receipt']);
});

test('wrong bindings and stale revisions fail without changing persisted intent bytes', t => {
  const root = fixture(t);
  const prepared = prepareNativeNotification(root, args());
  const before = readFileSync(prepared.intent, 'utf8');
  assert.throws(() => startNativeNotificationAttempt(root, { ...prepared.binding, target: { ...to, generation: 3 } }), /binding|target|registered/i);
  assert.equal(readFileSync(prepared.intent, 'utf8'), before);
  const started = startNativeNotificationAttempt(root, prepared.binding);
  const after = readFileSync(prepared.intent, 'utf8');
  assert.throws(() => recordNativeNotificationOutcome(root, prepared.binding, 'accepted'), /Stale lifecycle revision/);
  assert.equal(readFileSync(prepared.intent, 'utf8'), after);
  assert.throws(() => recordNativeNotificationOutcome(root, { ...prepared.binding, revision: started.revision, contentHash: 'wrong' }, 'accepted'), /binding/);
  assert.equal(readFileSync(prepared.intent, 'utf8'), after);
});

test('validated correlated spool receipt is distinct and a late receipt retains dead-letter history', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00.000Z') });
  const root = fixture(t);
  const deadlineAt = new Date(Date.now() + 30).toISOString();
  const prepared = prepareNativeNotification(root, { ...args(), deadlineAt });
  const started = startNativeNotificationAttempt(root, prepared.binding);
  t.mock.timers.setTime(Date.parse(deadlineAt) + 1);
  const expired = expireNativeNotification(root, { ...prepared.binding, revision: started.revision });
  assert.throws(() => recordNativeNotificationReceipt(root, { ...prepared.binding, revision: expired.revision }), /receipt is not present/);
  operate(root, 'receive', { id: 'msg-1', target: to });
  const receipt = recordNativeNotificationReceipt(root, { ...prepared.binding, revision: expired.revision });
  assert.equal(receipt.lifecycle.status, 'receipt-confirmed');
  assert.equal(receipt.lifecycle.deadLetter.certainty, 'ambiguous');
  assert.equal(receipt.lifecycle.receipt.evidence, 'validated-core-spool');
  assert.deepEqual(JSON.parse(readFileSync(prepared.intent, 'utf8')).events.map(e => e.type), ['attempt-start', 'dead-letter', 'receipt']);
});

test('historical version-one intent remains inspectable as unknown and cannot be reopened', t => {
  const root = fixture(t);
  const prepared = prepareNativeNotification(root, args());
  const historical = { messageId: 'msg-1', contentHash: prepared.binding.contentHash, target: to, nativeApi: 'collaboration.followup_task',
    expectedNativeId: to.nativeId, envelopeVersion: 1, registryVersion: 1, intentVersion: 1, state: 'prepared', preparedAt: new Date().toISOString() };
  writeFileSync(prepared.intent, `${JSON.stringify(historical)}\n`);
  const inspected = inspectNativeNotification(root, 'msg-1');
  assert.equal(inspected.lifecycle.status, 'unknown-legacy');
  assert.equal(inspected.lifecycle.attemptStarted, null);
  assert.throws(() => startNativeNotificationAttempt(root, prepared.binding), /inspect-only/);
  assert.deepEqual(JSON.parse(readFileSync(prepared.intent, 'utf8')), historical);
});

test('version-two desktop intents retain their lifecycle binding contract', t => {
  const root = fixture(t);
  const prepared = prepareNativeNotification(root, args());
  const intent = JSON.parse(readFileSync(prepared.intent, 'utf8'));
  intent.intentVersion = 2;
  delete intent.transportAction;
  delete intent.actionHash;
  writeFileSync(prepared.intent, `${JSON.stringify(intent)}\n`);
  const { actionHash, ...legacyBinding } = prepared.binding;
  const started = startNativeNotificationAttempt(root, legacyBinding);
  assert.equal(started.lifecycle.status, 'attempt-ambiguous');
  assert.equal(Object.hasOwn(started, 'transportAction'), false);
  assert.equal(JSON.parse(readFileSync(prepared.intent, 'utf8')).events[0].actionHash, undefined);
});

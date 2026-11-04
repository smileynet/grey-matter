#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';

const TARGET_FIELDS = ['project', 'host', 'harness', 'harnessVersion', 'interface', 'nativeId', 'generation', 'role', 'worktree', 'branch'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTION_ROUTES = new Set(['desktop-followup', 'codex-cli-queue', 'claude-owned-stream', 'kiro-owned-acp']);
const OWNED_ROUTES = {
  'claude-owned-stream': { nativeApi: 'claude-stream.send', harness: 'claude', interface: 'stream-json' },
  'kiro-owned-acp': { nativeApi: 'kiro-acp.prompt', harness: 'kiro-cli', interface: 'acp' },
};
export const MAX_CODEX_EXECUTABLE_BYTES = 1_073_741_824;
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const canonical = value => JSON.stringify(stable(value));
const fingerprint = value => createHash('sha256').update(canonical(value)).digest('hex');
function demand(ok, message) { if (!ok) throw new Error(message); }
function snapshotPlainData(value, label = 'value') {
  demand(value && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value)), `${label} must be a plain data object`);
  demand(Reflect.ownKeys(value).every(key => typeof key === 'string'), `${label} cannot contain symbol fields`);
  const copy = Object.create(null);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    demand(descriptor && Object.hasOwn(descriptor, 'value'), `${label}.${key} cannot be an accessor`);
    const child = descriptor.value;
    if (child && typeof child === 'object') copy[key] = snapshotPlainData(child, `${label}.${key}`);
    else {
      demand(child === null || ['string', 'boolean', 'number'].includes(typeof child)
        && (typeof child !== 'number' || Number.isFinite(child)), `${label}.${key} must be JSON data`);
      copy[key] = child;
    }
  }
  return copy;
}
function regularJson(path) {
  const stat = lstatSync(path);
  demand(stat.isFile() && !stat.isSymbolicLink(), `Expected a regular non-symlink file: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}
function exactTarget(value) {
  demand(value && typeof value === 'object' && !Array.isArray(value), 'Full registered target is required');
  demand(Object.keys(value).length === TARGET_FIELDS.length && TARGET_FIELDS.every(k => Object.hasOwn(value, k)), 'Target must contain exactly the full versioned target fields');
  for (const key of TARGET_FIELDS.filter(k => k !== 'generation')) demand(typeof value[key] === 'string' && value[key].trim(), `Invalid target field ${key}`);
  demand(Number.isSafeInteger(value.generation) && value.generation > 0, 'Target generation must be positive');
  return Object.fromEntries(TARGET_FIELDS.map(k => [k, value[k]]));
}
function withLock(path, fn) {
  let fd;
  try { fd = openSync(path, 'wx', 0o600); }
  catch (e) { if (e.code === 'EEXIST') throw new Error(`Ambiguous runtime lock exists; inspect and recover manually: ${path}`); throw e; }
  try { writeFileSync(fd, JSON.stringify({ pid: process.pid, started: new Date().toISOString() })); fsyncSync(fd); return fn(); }
  finally { closeSync(fd); rmSync(path); }
}
function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  const fd = openSync(temp, 'wx', 0o600);
  try {
    try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temp, path);
  } catch (e) {
    rmSync(temp, { force: true });
    throw e;
  }
}
function intentPath(root, id) {
  demand(/^[A-Za-z0-9._-]{1,128}$/.test(id), 'Invalid message id');
  const directory = join(root, 'notification-intents');
  if (existsSync(directory)) demand(lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink(), 'Intent path must be a regular non-symlink directory');
  return join(root, 'notification-intents', `${id}.json`);
}
function deadlineTimestamp(value) {
  demand(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value), 'deadlineAt must be an explicit UTC ISO timestamp');
  const time = Date.parse(value);
  const canonicalValue = value.includes('.') ? value.replace(/\.(\d{1,3})Z$/, (_, ms) => `.${ms.padEnd(3, '0')}Z`) : value.replace(/Z$/, '.000Z');
  demand(Number.isFinite(time) && new Date(time).toISOString() === canonicalValue, 'Invalid UTC deadlineAt');
  return time;
}
function utcDeadline(value) {
  const time = deadlineTimestamp(value);
  demand(time > Date.now(), 'deadlineAt must be in the future');
  return new Date(time).toISOString();
}
function validateTransportAction(action, intent) {
  demand(action && typeof action === 'object' && !Array.isArray(action) && ACTION_ROUTES.has(action.route), 'Unsupported or malformed transport action route');
  if (action.route === 'desktop-followup') {
    demand(canonical(Object.keys(action).sort()) === canonical(['arguments', 'contentHash', 'messageId', 'route', 'target', 'tool'])
      && intent.nativeApi === 'collaboration.followup_task'
      && action.tool === 'collaboration.followup_task' && action.messageId === intent.messageId
      && action.contentHash === intent.contentHash && canonical(action.target) === canonical(intent.target)
      && action.arguments && canonical(Object.keys(action.arguments).sort()) === canonical(['message', 'target'])
      && action.arguments.target === intent.expectedNativeId && typeof action.arguments.message === 'string',
    'Malformed desktop-followup action');
  } else if (action.route === 'codex-cli-queue') {
    demand(canonical(Object.keys(action).sort()) === canonical(['contentHash', 'executable', 'message', 'messageId', 'remote', 'route', 'target', 'threadId'])
      && intent.nativeApi === 'codex-cli.queue' && intent.target.harness === 'codex' && intent.target.interface === 'cli'
      && action.messageId === intent.messageId && action.contentHash === intent.contentHash
      && canonical(action.target) === canonical(intent.target) && action.threadId === intent.expectedNativeId
      && UUID.test(action.threadId) && typeof action.message === 'string', 'Malformed Codex CLI queue action');
    const executable = action.executable;
    demand(executable && canonical(Object.keys(executable).sort()) === canonical(['canonicalPath', 'maxBytes', 'sha256'])
      && typeof executable.canonicalPath === 'string' && executable.canonicalPath.length > 0
      && /^[a-f0-9]{64}$/.test(executable.sha256) && Number.isSafeInteger(executable.maxBytes)
      && executable.maxBytes > 0 && executable.maxBytes <= MAX_CODEX_EXECUTABLE_BYTES, 'Malformed or out-of-policy executable identity');
    const remote = action.remote;
    const portText = typeof remote?.endpoint === 'string' ? remote.endpoint.slice(remote.endpoint.lastIndexOf(':') + 1) : '';
    const endpoint = typeof remote?.endpoint === 'string' && /^ws:\/\/127\.0\.0\.1:[1-9]\d{0,4}$/.test(remote.endpoint)
      ? new URL(remote.endpoint) : null;
    demand(remote && canonical(Object.keys(remote).sort()) === canonical(['endpoint', 'owner']) && endpoint
      && Number(portText) <= 65_535 && endpoint.port === portText && !endpoint.username && !endpoint.password
      && endpoint.pathname === '/' && !endpoint.search && !endpoint.hash
      && remote.owner && canonical(Object.keys(remote.owner).sort()) === canonical(['generation', 'pid'])
      && Number.isSafeInteger(remote.owner.pid) && remote.owner.pid > 0 && UUID.test(remote.owner.generation),
    'Malformed explicit loopback endpoint ownership binding');
  } else {
    const spec = OWNED_ROUTES[action.route];
    const claude = action.route === 'claude-owned-stream';
    const keys = claude
      ? ['contentHash', 'messageId', 'owner', 'protocolUuid', 'route', 'sessionId', 'target', 'text']
      : ['contentHash', 'messageId', 'owner', 'route', 'sessionId', 'target', 'text'];
    const target = exactTarget(action.target);
    const owner = action.owner;
    demand(canonical(Object.keys(action).sort()) === canonical(keys)
      && intent.nativeApi === spec.nativeApi && intent.target.harness === spec.harness && intent.target.interface === spec.interface
      && typeof action.messageId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(action.messageId)
      && typeof action.contentHash === 'string' && /^[a-f0-9]{64}$/.test(action.contentHash)
      && action.messageId === intent.messageId && action.contentHash === intent.contentHash
      && canonical(target) === canonical(intent.target) && action.sessionId === action.target.nativeId
      && action.sessionId === intent.expectedNativeId && typeof action.text === 'string' && action.text.length > 0 && !action.text.includes('\0'),
    `Malformed ${action.route} action or session identity`);
    demand(owner && canonical(Object.keys(owner).sort()) === canonical(['generation', 'pid'])
      && Number.isSafeInteger(owner.pid) && owner.pid > 0 && UUID.test(owner.generation),
    'Malformed exact owned-client process identity');
    if (claude) demand(UUID.test(action.sessionId) && UUID.test(action.protocolUuid) && action.protocolUuid !== action.sessionId,
      'Claude stream requires distinct canonical session and protocol UUIDs');
    else demand(typeof action.sessionId === 'string' && action.sessionId.length > 0,
      'Kiro ACP requires its exact negotiated opaque session ID');
  }
  return action;
}

/** Convert a stored owned-provider action only for the same already-held client. */
export function ownedStreamInput(rawAction, rawActionHash, rawLive) {
  const action = snapshotPlainData(rawAction, 'Owned provider action');
  const actionHash = rawActionHash;
  const live = snapshotPlainData(rawLive, 'Live owned client');
  demand(typeof actionHash === 'string' && /^[a-f0-9]{64}$/.test(actionHash)
    && fingerprint(action) === actionHash, 'Owned provider action hash mismatch');
  demand(canonical(Object.keys(live).sort()) === canonical(['generation', 'pid', 'sessionId'])
    && Number.isSafeInteger(live.pid) && live.pid > 0 && UUID.test(live.generation)
    && typeof live.sessionId === 'string' && live.sessionId.length > 0,
  'Live client projection must contain only its exact process and session identity');
  const spec = OWNED_ROUTES[action.route];
  demand(spec, 'Owned Claude or Kiro action is required');
  validateTransportAction(action, { nativeApi: spec.nativeApi, expectedNativeId: action.target?.nativeId,
    target: action.target, messageId: action.messageId, contentHash: action.contentHash });
  demand(action.owner.pid === live.pid && action.owner.generation === live.generation
    && action.sessionId === action.target.nativeId && action.sessionId === live.sessionId,
  'Action does not bind to the exact live owned client and target session');
  return action.route === 'claude-owned-stream'
    ? { route: action.route, input: { messageId: action.messageId, messageHash: action.contentHash,
      protocolUuid: action.protocolUuid, sessionId: action.sessionId, text: action.text } }
    : { route: action.route, input: { messageId: action.messageId, messageHash: action.contentHash, text: action.text } };
}

export function validateCodexQueueTransportAction(action, actionHash) {
  const snapshot = snapshotPlainData(action, 'Codex CLI queue action');
  demand(snapshot.route === 'codex-cli-queue', 'Codex CLI queue action is required');
  validateTransportAction(snapshot, { nativeApi: 'codex-cli.queue', expectedNativeId: snapshot.threadId,
    target: snapshot.target, messageId: snapshot.messageId, contentHash: snapshot.contentHash });
  demand(typeof actionHash === 'string' && actionHash === fingerprint(snapshot), 'Codex CLI queue action hash mismatch');
  return snapshot;
}
export const nativeTransportActionHash = value => fingerprint(snapshotPlainData(value, 'Transport action'));
export function validateNativeNotificationTarget(rawTarget, expectedNativeId, route) {
  demand(ACTION_ROUTES.has(route), `Unsupported or unqualified notification route: ${route}`);
  const target = exactTarget(snapshotPlainData(rawTarget, 'Notification target'));
  demand(typeof expectedNativeId === 'string' && expectedNativeId.length > 0 && target.nativeId === expectedNativeId,
    'Expected native ID differs from the registered recipient');
  if (route === 'desktop-followup') {
    demand(target.harness === 'codex' && target.interface === 'desktop', 'Unsupported desktop notification target');
  } else if (route === 'codex-cli-queue') {
    demand(target.harness === 'codex' && target.interface === 'cli' && UUID.test(expectedNativeId),
      'Codex queue target must have a full UUID native ID');
  } else {
    const spec = OWNED_ROUTES[route];
    demand(target.harness === spec.harness && target.interface === spec.interface,
      `Unsupported or unqualified ${route} notification target`);
    if (route === 'claude-owned-stream') demand(UUID.test(expectedNativeId), 'Claude stream target must use its exact session UUID');
  }
  return target;
}
export const validateNotificationDeadline = utcDeadline;

function validateLifecycleIntent(intent) {
  demand([2, 3].includes(intent.intentVersion) && Array.isArray(intent.events) && Number.isSafeInteger(intent.revision)
    && intent.revision >= 0 && intent.events.length === intent.revision, 'Malformed or unsupported version-2 intent');
  demand(typeof intent.messageId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(intent.messageId)
    && typeof intent.contentHash === 'string' && /^[a-f0-9]{64}$/.test(intent.contentHash), 'Malformed intent identity');
  exactTarget(intent.target);
  deadlineTimestamp(intent.deadlineAt);
  let attempt = false;
  let outcome = false;
  let deadLetter = false;
  let receipt = false;
  for (const [index, event] of intent.events.entries()) {
    demand(event && event.revision === index + 1 && Number.isFinite(Date.parse(event.at))
      && new Date(event.at).toISOString() === event.at, 'Malformed notification lifecycle event');
    if (event.type === 'attempt-start') {
      demand(!attempt && !deadLetter, 'Malformed duplicate or post-expiry attempt');
      if (intent.intentVersion === 3) demand(event.actionHash === intent.actionHash, 'Attempt-start does not bind its persisted transport action');
      attempt = true;
    } else if (event.type === 'outcome') {
      demand(attempt && !outcome && ['accepted', 'not-sent', 'ambiguous'].includes(event.value)
        && event.evidence === 'parent-attestation', 'Malformed native outcome attestation');
      outcome = true;
    } else if (event.type === 'dead-letter') {
      demand(!deadLetter && !receipt && event.certainty === (attempt ? 'ambiguous' : 'not-sent')
        && event.evidence === 'parent-expiration-attestation', 'Malformed dead-letter event');
      deadLetter = true;
    } else if (event.type === 'receipt') {
      demand(!receipt && event.evidence === 'validated-core-spool' && event.receipt
        && event.receipt.messageId === intent.messageId && event.receipt.contentHash === intent.contentHash
        && canonical(event.receipt.target) === canonical(intent.target)
        && ['received', 'handled', 'acked'].includes(event.receipt.state), 'Malformed correlated spool receipt');
      receipt = true;
    } else demand(false, 'Unknown notification lifecycle event');
  }
  if (intent.intentVersion === 2) {
    demand(!Object.hasOwn(intent, 'transportAction') && !Object.hasOwn(intent, 'actionHash'), 'Version-2 intent cannot contain a transport action');
  } else {
    validateTransportAction(intent.transportAction, intent);
    demand(typeof intent.actionHash === 'string' && /^[a-f0-9]{64}$/.test(intent.actionHash)
      && fingerprint(intent.transportAction) === intent.actionHash, 'Persisted transport action fingerprint mismatch');
  }
  return intent;
}
function loadBoundIntent(root, binding) {
  demand(binding && typeof binding === 'object' && !Array.isArray(binding), 'Lifecycle binding is required');
  const path = intentPath(root, binding.id);
  const intent = regularJson(path);
  if (![2, 3].includes(intent.intentVersion)) throw new Error('Historical or unsupported intent is inspect-only');
  validateLifecycleIntent(intent);
  const target = exactTarget(binding.target);
  demand(intent.messageId === binding.id && canonical(intent.target) === canonical(target)
    && intent.expectedNativeId === binding.expectedNativeId && intent.target.nativeId === binding.expectedNativeId
    && intent.target.generation === binding.generation && intent.contentHash === binding.contentHash,
  'Lifecycle binding differs from the persisted intent');
  const keys = intent.intentVersion === 3
    ? ['actionHash', 'contentHash', 'expectedNativeId', 'generation', 'id', 'revision', 'target']
    : ['contentHash', 'expectedNativeId', 'generation', 'id', 'revision', 'target'];
  demand(canonical(Object.keys(binding).sort()) === canonical(keys), 'Lifecycle binding fields do not match the intent version');
  demand(intent.intentVersion !== 3 || binding.actionHash === intent.actionHash, 'Lifecycle action hash differs from the persisted plan');
  demand(Number.isSafeInteger(binding.revision) && binding.revision === intent.revision, 'Stale lifecycle revision');
  return { path, intent };
}
function validateSpoolBinding(root, binding) {
  const snapshot = operate(root, 'replay', { id: binding.id, target: binding.target }).message;
  demand(snapshot.id === binding.id && snapshot.contentHash === binding.contentHash
    && canonical(snapshot.to) === canonical(exactTarget(binding.target)), 'Validated spool record differs from lifecycle binding');
  return snapshot;
}
function recheckUnderIntentLock(root, binding, snapshot) {
  const current = regularJson(join(root, 'messages', `${binding.id}.json`));
  demand(canonical(current) === canonical(snapshot), 'Spool record changed after validation; no lifecycle write was made');
  const registry = regularJson(join(root, 'registry.json'));
  demand(registry.version === 1 && Array.isArray(registry.sessions)
    && registry.sessions.filter(s => canonical(s.target) === canonical(exactTarget(binding.target)) && s.status === 'registered').length === 1,
  'Exact target is no longer the single active registration');
  const intent = regularJson(intentPath(root, binding.id));
  if (intent.intentVersion === 3 && intent.transportAction?.route === 'codex-cli-queue') {
    const matches = registry.sessions.filter(s => s.status === 'registered' && s.target.harness === 'codex'
      && s.target.interface === 'cli' && s.target.nativeId === binding.expectedNativeId);
    demand(matches.length === 1 && canonical(matches[0].target) === canonical(exactTarget(binding.target)),
      'Codex thread UUID is ambiguous across active registered targets');
  }
}
function append(intent, type, fields = {}) {
  const revision = intent.revision + 1;
  return { ...intent, revision, events: [...intent.events, { revision, type, at: new Date().toISOString(), ...fields }] };
}
function spoolReceipt(spool) {
  return { messageId: spool.id, contentHash: spool.contentHash, target: spool.to, state: spool.state,
    receivedAt: spool.receivedAt, handledAt: spool.handledAt, ackedAt: spool.ackedAt };
}
function mutateIntent(root, binding, transition) {
  const resolved = resolve(root);
  const snapshot = validateSpoolBinding(resolved, binding);
  const lock = join(resolved, '.lock');
  return withLock(lock, () => {
    recheckUnderIntentLock(resolved, binding, snapshot);
    const { path, intent } = loadBoundIntent(resolved, binding);
    const next = transition(intent, snapshot);
    atomicJson(path, next);
    return { result: 'recorded', revision: next.revision, lifecycle: notificationLifecycle(next) };
  });
}
function notificationLifecycle(intent) {
  const events = intent.events ?? [];
  const terminal = events.findLast(event => event.type === 'dead-letter');
  const receipt = events.findLast(event => event.type === 'receipt');
  const outcome = events.findLast(event => event.type === 'outcome');
  const started = events.some(event => event.type === 'attempt-start');
  return {
    status: receipt ? 'receipt-confirmed' : terminal ? `dead-letter-${terminal.certainty}` : outcome ? `outcome-${outcome.value}` : started ? 'attempt-ambiguous' : 'prepared',
    revision: intent.revision,
    deadlineAt: intent.deadlineAt,
    attemptStarted: started,
    deadLetter: terminal ?? null,
    receipt: receipt ?? null,
    outcome: outcome ?? null,
  };
}

/** Persist the attempt boundary before a caller invokes the returned native action. */
export function startNativeNotificationAttempt(root, binding) {
  let transportAction;
  const result = mutateIntent(root, binding, intent => {
    demand(!intent.events.some(event => ['attempt-start', 'dead-letter'].includes(event.type)), 'Attempt already started or intent dead-lettered; never issue another action');
    demand(Date.now() < Date.parse(intent.deadlineAt), 'Intent deadline passed; expire it instead of starting an attempt');
    transportAction = intent.intentVersion === 3 ? intent.transportAction : undefined;
    return append(intent, 'attempt-start', intent.intentVersion === 3 ? { actionHash: intent.actionHash } : {});
  });
  return transportAction ? { ...result, actionHash: fingerprint(transportAction), transportAction } : result;
}

/** Record what the parent observed from its native call; this is not delivery proof. */
export function recordNativeNotificationOutcome(root, binding, value) {
  demand(['accepted', 'not-sent', 'ambiguous'].includes(value), 'Outcome must be accepted, not-sent, or ambiguous');
  return mutateIntent(root, binding, intent => {
    demand(intent.events.some(event => event.type === 'attempt-start'), 'Outcome requires a persisted attempt-start');
    demand(!intent.events.some(event => event.type === 'outcome'), 'An outcome is already recorded');
    return append(intent, 'outcome', { value, evidence: 'parent-attestation' });
  });
}

/** Expiration is explicit. An attempt without a receipt becomes ambiguous. */
export function expireNativeNotification(root, binding) {
  return mutateIntent(root, binding, (intent, spool) => {
    demand(Date.now() >= Date.parse(intent.deadlineAt), 'Intent deadline has not passed');
    demand(!intent.events.some(event => event.type === 'dead-letter'), 'Intent is already dead-lettered');
    const started = intent.events.some(event => event.type === 'attempt-start');
    const receipt = intent.events.some(event => event.type === 'receipt');
    demand(!receipt, 'A receipt-confirmed intent cannot be dead-lettered');
    if (['received', 'handled', 'acked'].includes(spool.state)) {
      return append(intent, 'receipt', { receipt: spoolReceipt(spool), evidence: 'validated-core-spool' });
    }
    return append(intent, 'dead-letter', { certainty: started ? 'ambiguous' : 'not-sent', evidence: 'parent-expiration-attestation' });
  });
}

/** Bind a receipt to a validated, monotonic core-spool receive state. */
export function recordNativeNotificationReceipt(root, binding) {
  const resolved = resolve(root);
  const spool = validateSpoolBinding(resolved, binding);
  demand(['received', 'handled', 'acked'].includes(spool.state), 'A correlated spool receive receipt is not present');
  const lock = join(resolved, '.lock');
  return withLock(lock, () => {
    recheckUnderIntentLock(resolved, binding, spool);
    const { path, intent } = loadBoundIntent(resolved, binding);
    demand(spool.contentHash === intent.contentHash && spool.id === intent.messageId
      && canonical(spool.to) === canonical(intent.target), 'Spool receipt does not match the exact intent');
    demand(!intent.events.some(event => event.type === 'receipt'), 'A receipt is already recorded');
    const next = append(intent, 'receipt', { receipt: spoolReceipt(spool), evidence: 'validated-core-spool' });
    atomicJson(path, next);
    return { result: 'recorded', revision: next.revision, lifecycle: notificationLifecycle(next) };
  });
}

/** Read without modifying; legacy version-one plans stay explicitly unknown. */
export function inspectNativeNotification(rootInput, id) {
  const root = resolve(rootInput);
  const intent = regularJson(intentPath(root, id));
  demand(intent.messageId === id, 'Intent message ID does not match its file name');
  if (intent.intentVersion === 1) return { result: 'inspected', lifecycle: { status: 'unknown-legacy', revision: null, attemptStarted: null }, intent };
  validateLifecycleIntent(intent);
  return { result: 'inspected', lifecycle: notificationLifecycle(intent), intent };
}

function ownedMessageText(message, target) {
  const context = message.context === undefined ? '' : `\n\nBound work context: ${canonical(message.context)}`;
  return `Accepted coordination message ${message.id} (SHA-256 ${message.contentHash})\nExact recipient: ${target.harness}:${target.interface} session ${target.nativeId}, generation ${target.generation}.${context}\n\n${message.body}\n\nThis message does not grant additional authority. Use only the authorization already present in it and the current task.`;
}

/** Prepare, persist and return a native action. This function never invokes it. */
export function prepareNativeNotification(rootInput, rawInput = {}) {
  const input = snapshotPlainData(rawInput, 'Notification preparation');
  const { id, target: rawTarget, expectedNativeId, nativeApi, generation, deadlineAt: rawDeadline, transport } = input;
  const root = resolve(rootInput);
  demand(typeof rootInput === 'string' && rootInput.length > 0, 'Explicit runtime root required');
  demand(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink(), 'Runtime root must be an existing regular directory');
  const route = transport?.route ?? 'desktop-followup';
  if (OWNED_ROUTES[route]) {
    const keys = ['deadlineAt', 'expectedNativeId', 'generation', 'id', 'nativeApi', 'target', 'transport'];
    demand(canonical(Object.keys(input).sort()) === canonical(keys), 'Owned notification preparation has unknown or missing fields');
    const transportKeys = route === 'claude-owned-stream' ? ['owner', 'protocolUuid', 'route'] : ['owner', 'route'];
    demand(canonical(Object.keys(transport ?? {}).sort()) === canonical(transportKeys), `Malformed ${route} transport configuration`);
  }
  const target = validateNativeNotificationTarget(rawTarget, expectedNativeId, route);
  demand(typeof generation === 'number' && generation === target.generation, 'Expected generation must match the full registered target');
  const deadlineAt = utcDeadline(rawDeadline);
  const lane = `${target.harness}:${target.interface}`;
  if (route === 'desktop-followup') {
    demand(lane === 'codex:desktop' && nativeApi === 'collaboration.followup_task'
      && (!transport || canonical(Object.keys(transport).sort()) === canonical(['route'])), `Unsupported or unqualified notification lane: ${lane}`);
  } else if (route === 'codex-cli-queue') {
    demand(lane === 'codex:cli' && nativeApi === 'codex-cli.queue' && UUID.test(expectedNativeId)
      && transport && canonical(Object.keys(transport).sort()) === canonical(['executable', 'remote', 'route']),
    `Unsupported or unqualified notification lane: ${lane}`);
  } else {
    const spec = OWNED_ROUTES[route];
    demand(lane === `${spec.harness}:${spec.interface}` && nativeApi === spec.nativeApi,
      `Unsupported or unqualified notification lane: ${lane}`);
  }
  const msg = operate(root, 'replay', { id, target }).message;
  demand(msg.state === 'accepted', 'Message must be accepted before preparation');
  const file = join(root, 'messages', `${id}.json`);
  const lock = join(root, '.lock');
  return withLock(lock, () => {
    const registry = regularJson(join(root, 'registry.json'));
    demand(registry.version === 1 && Array.isArray(registry.sessions), 'Unsupported registry version or malformed registry');
    const registrations = registry.sessions.filter(s => canonical(s.target) === canonical(target));
    demand(registrations.length === 1 && registrations[0].status === 'registered', 'Exact target is stale, superseded, unregistered or colliding');
    if (route === 'codex-cli-queue') {
      const matches = registry.sessions.filter(s => s.status === 'registered' && s.target.harness === 'codex'
        && s.target.interface === 'cli' && s.target.nativeId === expectedNativeId);
      demand(matches.length === 1 && canonical(matches[0].target) === canonical(target),
        'Codex thread UUID is ambiguous across active registered targets');
    }
    const messagesDir = join(root, 'messages');
    demand(lstatSync(messagesDir).isDirectory() && !lstatSync(messagesDir).isSymbolicLink(), 'Message store must be a regular directory');
    demand(canonical(regularJson(file)) === canonical(msg), 'Spool record changed after validation; no action was prepared');
    const intentDir = join(root, 'notification-intents');
    if (existsSync(intentDir)) demand(lstatSync(intentDir).isDirectory() && !lstatSync(intentDir).isSymbolicLink(), 'Intent path must be a regular directory');
    mkdirSync(intentDir, { recursive: true, mode: 0o700 });
    const intentPath = join(intentDir, `${id}.json`);
    demand(!existsSync(intentPath), 'A prior intent exists; duplicate/restart requires manual recovery and never yields another action');
    const context = msg.context === undefined ? '' : `\n\nBound work context: ${canonical(msg.context)}`;
    const body = `Read the accepted coordination record at ${file} (message ${id}, SHA-256 ${msg.contentHash}) before acting. It is addressed to the exact registered target ${target.nativeId}, generation ${target.generation}.${context}\n\n${msg.body}\n\nThe local record is accepted, not proof of native receipt or task acceptance. Use only the authorization already present in the record and current task.`;
    const text = OWNED_ROUTES[route] ? ownedMessageText(msg, target) : body;
    const transportAction = route === 'desktop-followup'
      ? { route, target, messageId: id, contentHash: msg.contentHash, tool: nativeApi,
        arguments: { target: expectedNativeId, message: body } }
      : route === 'codex-cli-queue'
        ? { route, target, messageId: id, contentHash: msg.contentHash,
          executable: { canonicalPath: transport.executable.canonicalPath, sha256: transport.executable.sha256, maxBytes: transport.executable.maxBytes },
          remote: { endpoint: transport.remote.endpoint, owner: { pid: transport.remote.owner.pid, generation: transport.remote.owner.generation } },
          threadId: expectedNativeId, message: body }
        : { route, target, messageId: id, contentHash: msg.contentHash, owner: { pid: transport.owner.pid, generation: transport.owner.generation },
          ...(route === 'claude-owned-stream' ? { protocolUuid: transport.protocolUuid } : {}), sessionId: expectedNativeId, text };
    const identity = { nativeApi, expectedNativeId, target, messageId: id, contentHash: msg.contentHash };
    validateTransportAction(transportAction, identity);
    const actionHash = fingerprint(transportAction);
    const payload = {
      messageId: id,
      contentHash: msg.contentHash,
      target,
      nativeApi,
      expectedNativeId,
      envelopeVersion: msg.version,
      registryVersion: registry.version,
      intentVersion: 3,
      state: 'prepared',
      deadlineAt,
      revision: 0,
      events: [],
      transportAction,
      actionHash,
      preparedAt: new Date().toISOString(),
    };
    atomicJson(intentPath, payload);
    return {
      result: 'prepared',
      intent: intentPath,
      binding: { id, target, expectedNativeId, generation, contentHash: msg.contentHash, revision: 0, actionHash },
      actionHash,
      transportAction,
      ...(route === 'desktop-followup' ? { toolAction: { tool: nativeApi, arguments: { target: expectedNativeId, message: body } } } : {}),
      claim: route === 'desktop-followup'
        ? 'Prepared locally only. The caller must inspect the live native tool schema and invoke this exact action; preparation is not native acceptance or delivery.'
        : route === 'codex-cli-queue'
          ? 'Prepared a fixed Codex queue plan only. Caller-asserted executable and endpoint ownership are not verified native delivery; the trusted parent must re-check executable bytes, owned process handle, and loopback listener before execution.'
          : 'Prepared a fixed owned-provider input only. Caller-supplied process identity is an assertion; the trusted parent must use the pure ownedStreamInput converter with the exact already-held client after attempt-start.',
    };
  });
}

export function capabilityMatrix() {
  return {
    'codex:desktop': 'conditional preparation support only; caller must confirm the live collaboration.followup_task tool and independently verify the exact registered existing agent ID',
    'codex:cli': 'fixed codex queue plan preparation only; native busy/idle wakeup, receipt and completion behavior remain unqualified pending parent-owned canary',
    claude: 'fixed owned stream intent preparation only; caller must bind the exact live client; native delivery remains unqualified',
    'kiro-cli': 'fixed owned ACP intent preparation only; caller must bind the exact live client; native delivery remains unqualified',
    'kiro-crew': 'unsupported/unqualified',
    antigravity: 'unsupported and held',
  };
}

function cli(args) {
  demand(args.length === 5 && ['prepare', 'attempt-start', 'outcome', 'inspect', 'expire', 'receipt'].includes(args[0]) && args[1] === '--root' && args[3] === '--json', 'Usage: native-notification.mjs COMMAND --root PRIVATE_DIR --json INPUT.json');
  const input = regularJson(resolve(args[4]));
  const { outcome, ...binding } = input;
  const result = args[0] === 'prepare' ? prepareNativeNotification(args[2], input)
    : args[0] === 'attempt-start' ? startNativeNotificationAttempt(args[2], input)
      : args[0] === 'outcome' ? recordNativeNotificationOutcome(args[2], binding, outcome)
        : args[0] === 'inspect' ? inspectNativeNotification(args[2], input.id)
          : args[0] === 'expire' ? expireNativeNotification(args[2], input)
            : recordNativeNotificationReceipt(args[2], input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

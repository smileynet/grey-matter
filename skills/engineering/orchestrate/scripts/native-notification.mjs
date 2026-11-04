#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { operate } from './session-messages.mjs';

const TARGET_FIELDS = ['project', 'host', 'harness', 'harnessVersion', 'interface', 'nativeId', 'generation', 'role', 'worktree', 'branch'];
const SUPPORTED = new Set(['codex:desktop']);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const canonical = value => JSON.stringify(stable(value));
function demand(ok, message) { if (!ok) throw new Error(message); }
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
function validateVersion2(intent) {
  demand(intent.intentVersion === 2 && Array.isArray(intent.events) && Number.isSafeInteger(intent.revision)
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
  return intent;
}
function loadBoundIntent(root, binding) {
  demand(binding && typeof binding === 'object' && !Array.isArray(binding)
    && canonical(Object.keys(binding).sort()) === canonical(['contentHash', 'expectedNativeId', 'generation', 'id', 'revision', 'target']),
  'Lifecycle binding must contain exactly id, target, expectedNativeId, generation, contentHash, and revision');
  const path = intentPath(root, binding.id);
  const intent = regularJson(path);
  if (intent.intentVersion !== 2) throw new Error('Historical or unsupported intent is inspect-only');
  validateVersion2(intent);
  const target = exactTarget(binding.target);
  demand(intent.messageId === binding.id && canonical(intent.target) === canonical(target)
    && intent.expectedNativeId === binding.expectedNativeId && intent.target.nativeId === binding.expectedNativeId
    && intent.target.generation === binding.generation && intent.contentHash === binding.contentHash,
  'Lifecycle binding differs from the persisted intent');
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
  return mutateIntent(root, binding, intent => {
    demand(!intent.events.some(event => ['attempt-start', 'dead-letter'].includes(event.type)), 'Attempt already started or intent dead-lettered; never issue another action');
    demand(Date.now() < Date.parse(intent.deadlineAt), 'Intent deadline passed; expire it instead of starting an attempt');
    return append(intent, 'attempt-start');
  });
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
  validateVersion2(intent);
  return { result: 'inspected', lifecycle: notificationLifecycle(intent), intent };
}

/** Prepare, persist and return a native action. This function never invokes it. */
export function prepareNativeNotification(rootInput, { id, target: rawTarget, expectedNativeId, nativeApi, generation, deadlineAt: rawDeadline } = {}) {
  const root = resolve(rootInput);
  demand(typeof rootInput === 'string' && rootInput.length > 0, 'Explicit runtime root required');
  demand(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink(), 'Runtime root must be an existing regular directory');
  const target = exactTarget(rawTarget);
  demand(typeof expectedNativeId === 'string' && expectedNativeId.length > 0, 'Expected native ID must be supplied independently');
  demand(target.nativeId === expectedNativeId, 'Expected native ID differs from the registered recipient');
  demand(typeof generation === 'number' && generation === target.generation, 'Expected generation must match the full registered target');
  const deadlineAt = utcDeadline(rawDeadline);
  const lane = `${target.harness}:${target.interface}`;
  demand(SUPPORTED.has(lane) && nativeApi === 'collaboration.followup_task', `Unsupported or unqualified notification lane: ${lane}`);
  const msg = operate(root, 'replay', { id, target }).message;
  demand(msg.state === 'accepted', 'Message must be accepted before preparation');
  const file = join(root, 'messages', `${id}.json`);
  const lock = join(root, '.lock');
  return withLock(lock, () => {
    const registry = regularJson(join(root, 'registry.json'));
    demand(registry.version === 1 && Array.isArray(registry.sessions), 'Unsupported registry version or malformed registry');
    const registrations = registry.sessions.filter(s => canonical(s.target) === canonical(target));
    demand(registrations.length === 1 && registrations[0].status === 'registered', 'Exact target is stale, superseded, unregistered or colliding');
    const messagesDir = join(root, 'messages');
    demand(lstatSync(messagesDir).isDirectory() && !lstatSync(messagesDir).isSymbolicLink(), 'Message store must be a regular directory');
    demand(canonical(regularJson(file)) === canonical(msg), 'Spool record changed after validation; no action was prepared');
    const intentDir = join(root, 'notification-intents');
    if (existsSync(intentDir)) demand(lstatSync(intentDir).isDirectory() && !lstatSync(intentDir).isSymbolicLink(), 'Intent path must be a regular directory');
    mkdirSync(intentDir, { recursive: true, mode: 0o700 });
    const intentPath = join(intentDir, `${id}.json`);
    demand(!existsSync(intentPath), 'A prior intent exists; duplicate/restart requires manual recovery and never yields another action');
    const payload = {
      messageId: id,
      contentHash: msg.contentHash,
      target,
      nativeApi,
      expectedNativeId,
      envelopeVersion: msg.version,
      registryVersion: registry.version,
      intentVersion: 2,
      state: 'prepared',
      deadlineAt,
      revision: 0,
      events: [],
      preparedAt: new Date().toISOString(),
    };
    atomicJson(intentPath, payload);
    const body = `Read the accepted coordination record at ${file} (message ${id}, SHA-256 ${msg.contentHash}) before acting. It is addressed to the exact registered target ${target.nativeId}, generation ${target.generation}.\n\n${msg.body}\n\nThe local record is accepted, not proof of native receipt or task acceptance. Use only the authorization already present in the record and current task.`;
    return {
      result: 'prepared',
      intent: intentPath,
      binding: { id, target, expectedNativeId, generation, contentHash: msg.contentHash, revision: 0 },
      toolAction: { tool: nativeApi, arguments: { target: expectedNativeId, message: body } },
      claim: 'Prepared locally only. The caller must inspect the live native tool schema and invoke this exact action; preparation is not native acceptance or delivery.',
    };
  });
}

export function capabilityMatrix() {
  return {
    'codex:desktop': 'conditional preparation support only; caller must confirm the live collaboration.followup_task tool and independently verify the exact registered existing agent ID',
    'codex:cli': 'unsupported/unqualified',
    claude: 'unsupported/unqualified',
    'kiro-cli': 'unsupported/unqualified',
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

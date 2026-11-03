#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET_FIELDS = ['project', 'host', 'harness', 'harnessVersion', 'interface', 'nativeId', 'generation', 'role', 'worktree', 'branch'];
const SUPPORTED = new Set(['codex:desktop']);
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
const canonical = value => JSON.stringify(stable(value));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
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
function checkedMessage(root, id, target) {
  demand(/^[A-Za-z0-9._-]{1,128}$/.test(id), 'Invalid message id');
  const file = join(root, 'messages', `${id}.json`);
  const msg = regularJson(file);
  demand(msg.version === 1 && msg.id === id && msg.state === 'accepted', 'Message must be the exact persisted, accepted version 1 record');
  demand(canonical(msg.to) === canonical(target), 'Message recipient does not exactly match the supplied target');
  const immutable = Object.fromEntries(['version', 'id', 'correlationId', 'replyTo', 'kind', 'from', 'to', 'body'].map(k => [k, msg[k]]));
  demand(msg.contentHash === hash(immutable), 'Persisted message content hash mismatch');
  return { file, msg };
}

/** Prepare, persist and return a native action. This function never invokes it. */
export function prepareNativeNotification(rootInput, { id, target: rawTarget, expectedNativeId, nativeApi, generation } = {}) {
  const root = resolve(rootInput);
  demand(typeof rootInput === 'string' && rootInput.length > 0, 'Explicit runtime root required');
  demand(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink(), 'Runtime root must be an existing regular directory');
  const target = exactTarget(rawTarget);
  demand(typeof expectedNativeId === 'string' && expectedNativeId.length > 0, 'Expected native ID must be supplied independently');
  demand(target.nativeId === expectedNativeId, 'Expected native ID differs from the registered recipient');
  demand(typeof generation === 'number' && generation === target.generation, 'Expected generation must match the full registered target');
  const lane = `${target.harness}:${target.interface}`;
  demand(SUPPORTED.has(lane) && nativeApi === 'collaboration.followup_task', `Unsupported or unqualified notification lane: ${lane}`);
  const lock = join(root, '.lock');
  return withLock(lock, () => {
    const registry = regularJson(join(root, 'registry.json'));
    demand(registry.version === 1 && Array.isArray(registry.sessions), 'Unsupported registry version or malformed registry');
    const registrations = registry.sessions.filter(s => canonical(s.target) === canonical(target));
    demand(registrations.length === 1 && registrations[0].status === 'registered', 'Exact target is stale, superseded, unregistered or colliding');
    const messagesDir = join(root, 'messages');
    demand(lstatSync(messagesDir).isDirectory() && !lstatSync(messagesDir).isSymbolicLink(), 'Message store must be a regular directory');
    const { file, msg } = checkedMessage(root, id, target);
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
      intentVersion: 1,
      state: 'prepared',
      preparedAt: new Date().toISOString(),
    };
    atomicJson(intentPath, payload);
    const body = `Read the accepted coordination record at ${file} (message ${id}, SHA-256 ${msg.contentHash}) before acting. It is addressed to the exact registered target ${target.nativeId}, generation ${target.generation}.\n\n${msg.body}\n\nThe local record is accepted, not proof of native receipt or task acceptance. Use only the authorization already present in the record and current task.`;
    return {
      result: 'prepared',
      intent: intentPath,
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
  demand(args.length === 5 && args[0] === 'prepare' && args[1] === '--root' && args[3] === '--json', 'Usage: native-notification.mjs prepare --root PRIVATE_DIR --json INPUT.json');
  const input = regularJson(resolve(args[4]));
  process.stdout.write(`${JSON.stringify(prepareNativeNotification(args[2], input), null, 2)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

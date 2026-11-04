#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream, lstatSync, realpathSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_CODEX_EXECUTABLE_BYTES, prepareNativeNotification, validateCodexQueueTransportAction, validateNativeNotificationTarget, validateNotificationDeadline } from './native-notification.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function demand(ok, message) { if (!ok) throw new Error(message); }
function snapshotData(value, label) {
  demand(value && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value)), `${label} must be a plain data object`);
  demand(Reflect.ownKeys(value).every(key => typeof key === 'string'), `${label} cannot contain symbol fields`);
  const copy = Object.create(null);
  for (const key of Object.keys(value)) {
    const field = Object.getOwnPropertyDescriptor(value, key);
    demand(field && Object.hasOwn(field, 'value'), `${label}.${key} cannot be an accessor`);
    const child = field.value;
    if (child && typeof child === 'object') copy[key] = snapshotData(child, `${label}.${key}`);
    else {
      demand(child === null || ['string', 'boolean', 'number'].includes(typeof child)
        && (typeof child !== 'number' || Number.isFinite(child)), `${label}.${key} must be JSON data`);
      copy[key] = child;
    }
  }
  return copy;
}
function exactObject(value, keys, label) {
  demand(value && typeof value === 'object' && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label} must contain exactly ${keys.join(', ')}`);
}
function dataFile(path) {
  const stat = lstatSync(path);
  demand(stat.isFile() && !stat.isSymbolicLink(), `Expected a regular non-symlink JSON file: ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}
function loopbackEndpoint(value) {
  demand(typeof value === 'string' && /^ws:\/\/127\.0\.0\.1:[1-9]\d{0,4}$/.test(value), 'remote.endpoint must be an explicit ws://127.0.0.1:<port> URL');
  const portText = value.slice(value.lastIndexOf(':') + 1);
  const port = Number(portText);
  demand(port <= 65_535, 'remote.endpoint port must be between 1 and 65535');
  const parsed = new URL(value);
  demand(parsed.protocol === 'ws:' && parsed.hostname === '127.0.0.1' && parsed.port === portText && !parsed.username && !parsed.password
    && parsed.pathname === '/' && !parsed.search && !parsed.hash, 'remote.endpoint must be a credential-free loopback WebSocket address');
  return value;
}
async function sha256File(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}
async function checkedExecutable(value) {
  exactObject(value, ['canonicalPath', 'sha256', 'maxBytes'], 'executable');
  const executable = { canonicalPath: value.canonicalPath, sha256: value.sha256, maxBytes: value.maxBytes };
  demand(typeof executable.canonicalPath === 'string' && isAbsolute(executable.canonicalPath), 'executable.canonicalPath must be absolute');
  demand(typeof executable.sha256 === 'string' && /^[a-f0-9]{64}$/.test(executable.sha256), 'executable.sha256 must be lowercase hexadecimal SHA-256');
  demand(Number.isSafeInteger(executable.maxBytes) && executable.maxBytes > 0 && executable.maxBytes <= MAX_CODEX_EXECUTABLE_BYTES,
    `executable.maxBytes must be a positive integer no greater than ${MAX_CODEX_EXECUTABLE_BYTES}`);
  const stat = lstatSync(executable.canonicalPath);
  demand(stat.isFile() && !stat.isSymbolicLink(), 'executable must be a regular non-symlink file');
  demand(realpathSync(executable.canonicalPath) === executable.canonicalPath, 'executable.canonicalPath must already be canonical');
  demand(stat.size <= executable.maxBytes, 'executable exceeds its trusted-caller maxBytes ceiling');
  const sha256 = await sha256File(executable.canonicalPath);
  const after = lstatSync(executable.canonicalPath);
  demand(after.isFile() && !after.isSymbolicLink() && after.size === stat.size && after.mtimeMs === stat.mtimeMs
    && after.ctimeMs === stat.ctimeMs, 'Executable changed while its preparation-time hash was being read');
  demand(sha256 === executable.sha256, 'Executable bytes do not match the independently supplied SHA-256');
  return executable;
}
function checkedRemote(value) {
  exactObject(value, ['endpoint', 'owner'], 'remote');
  loopbackEndpoint(value.endpoint);
  exactObject(value.owner, ['pid', 'generation'], 'remote.owner');
  demand(Number.isSafeInteger(value.owner.pid) && value.owner.pid > 0 && UUID.test(value.owner.generation),
    'remote.owner must bind a positive process ID and UUID process generation from the owned-process handle');
  return { endpoint: value.endpoint, owner: { pid: value.owner.pid, generation: value.owner.generation } };
}

/** Prepare a data-only plan. This module never starts or connects to a process. */
export async function prepareCodexQueue(root, request, runtimeConfig) {
  const notification = snapshotData(request, 'notification request');
  const config = snapshotData(runtimeConfig, 'trusted runtime config');
  exactObject(notification, ['id', 'target', 'threadId', 'deadlineAt'], 'notification request');
  exactObject(config, ['executable', 'remote'], 'trusted runtime config');
  const target = validateNativeNotificationTarget(notification.target, notification.threadId, 'codex-cli-queue');
  const deadlineAt = validateNotificationDeadline(notification.deadlineAt);
  const remote = checkedRemote(config.remote);
  const executable = await checkedExecutable(config.executable);
  return prepareNativeNotification(root, {
    id: notification.id,
    target,
    expectedNativeId: notification.threadId,
    nativeApi: 'codex-cli.queue',
    generation: target.generation,
    deadlineAt,
    transport: { route: 'codex-cli-queue', executable, remote },
  });
}

/** Derive the public fixed argv from the persisted, fingerprint-checked action. */
export function codexQueueArgv(action, actionHash) {
  const snapshot = validateCodexQueueTransportAction(action, actionHash);
  return ['queue', '--thread', snapshot.threadId, `--message=${snapshot.message}`, '--remote', snapshot.remote.endpoint];
}

async function cli(args) {
  demand(args.length === 7 && args[0] === 'prepare' && args[1] === '--root' && args[3] === '--request'
    && args[5] === '--runtime-config', 'Usage: codex-queue.mjs prepare --root PRIVATE_DIR --request REQUEST.json --runtime-config TRUSTED_CONFIG.json');
  const request = dataFile(resolve(args[4]));
  const runtimeConfig = dataFile(resolve(args[6]));
  const result = await prepareCodexQueue(args[2], request, runtimeConfig);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await cli(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

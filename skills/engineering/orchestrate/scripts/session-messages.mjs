#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = 1;
const STATES = ['queued', 'accepted', 'received', 'handled', 'acked'];
const TARGET_FIELDS = ['project', 'host', 'harness', 'harnessVersion', 'interface', 'nativeId', 'generation', 'role', 'worktree', 'branch'];
const KIND = ['message', 'reply', 'done'];
const MAX_BODY = 16_384;

function demand(ok, message) { if (!ok) throw new Error(message); }
function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!record(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}
function canonical(value) { return JSON.stringify(stable(value)); }
function digest(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function immutableMessage(message) {
  return Object.fromEntries(['version', 'id', 'correlationId', 'replyTo', 'kind', 'from', 'to', 'body', 'context'].map(key => [key, message[key]]));
}
function parseContext(value) {
  demand(record(value) && Object.keys(value).length === 3
    && ['ticket', 'candidate', 'handoff'].every(key => Object.hasOwn(value, key)), 'Context requires exactly ticket, candidate and handoff');
  demand(typeof value.ticket === 'string' && value.ticket.trim() === value.ticket && value.ticket.length > 0
    && value.ticket.length <= 128 && !/[\u0000-\u001f]/.test(value.ticket), 'Invalid context ticket');
  const candidate = value.candidate;
  demand(record(candidate), 'Context candidate must be a tagged object');
  if (candidate.kind === 'not-produced') demand(Object.keys(candidate).length === 1, 'Unproduced candidate cannot name a commit');
  else demand(candidate.kind === 'commit' && Object.keys(candidate).length === 2
    && typeof candidate.sha === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(candidate.sha), 'Context commit requires an exact SHA');
  const handoff = value.handoff;
  demand(record(handoff) && Object.keys(handoff).length === 2
    && typeof handoff.path === 'string' && handoff.path.trim() === handoff.path && handoff.path.length > 0
    && handoff.path.length <= 4096 && !/[\u0000-\u001f]/.test(handoff.path)
    && typeof handoff.sha256 === 'string' && /^[0-9a-f]{64}$/i.test(handoff.sha256), 'Context handoff requires a path and SHA-256');
  return { ticket: value.ticket, candidate: candidate.kind === 'commit' ? { kind: 'commit', sha: candidate.sha } : { kind: 'not-produced' },
    handoff: { path: handoff.path, sha256: handoff.sha256 } };
}
function parseTarget(value) {
  demand(record(value) && Object.keys(value).length === TARGET_FIELDS.length
    && TARGET_FIELDS.filter(k => k !== 'generation').every(k => typeof value[k] === 'string' && value[k].trim()),
    `Target must contain exactly: ${TARGET_FIELDS.join(', ')}`);
  demand(Number.isSafeInteger(value.generation) && value.generation > 0, 'Target generation must be a positive integer');
  return Object.fromEntries(TARGET_FIELDS.map(k => [k, value[k]]));
}
function rootPaths(root) {
  demand(typeof root === 'string' && root.length > 0, 'Supply an explicit private runtime root');
  const base = resolve(root);
  return { base, registry: join(base, 'registry.json'), messages: join(base, 'messages'), lock: join(base, '.lock') };
}
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw new Error(`Cannot read valid JSON at ${path}: ${error.message}`); }
}
function validateRegistry(value) {
  demand(record(value) && value.version === VERSION && Array.isArray(value.sessions), 'Unsupported or malformed registry version');
  for (const session of value.sessions) {
    demand(record(session) && Object.keys(session).every(key => ['target', 'status', 'registeredAt'].includes(key))
      && session.target && ['registered', 'superseded', 'retired'].includes(session.status)
      && typeof session.registeredAt === 'string' && Number.isFinite(Date.parse(session.registeredAt)), 'Malformed session record');
    parseTarget(session.target);
  }
  return value;
}
function withLock(paths, fn) {
  let fd;
  try { fd = openSync(paths.lock, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Runtime is locked at ${paths.lock}; inspect owner/process and recover manually. Lock is never auto-removed.`);
    throw error;
  }
  try { writeFileSync(fd, JSON.stringify({ pid: process.pid, started: new Date().toISOString() })); return fn(); }
  finally { closeSync(fd); rmSync(paths.lock, { force: true }); }
}
function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  const fd = openSync(tmp, 'wx', 0o600);
  try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); }
  finally { closeSync(fd); }
  try { renameSync(tmp, path); }
  catch (error) { rmSync(tmp, { force: true }); throw error; }
}
function load(paths) { return validateRegistry(readJson(paths.registry) ?? { version: VERSION, sessions: [] }); }
function save(paths, registry) { atomicJson(paths.registry, registry); }
function sessionFor(registry, raw) {
  const target = parseTarget(raw);
  const entry = registry.sessions.find(s => canonical(s.target) === canonical(target));
  demand(entry, 'Exact existing session target/generation is not registered');
  demand(entry.status === 'registered', 'Target session is not active');
  return entry;
}
function messagePath(paths, id) { demand(/^[A-Za-z0-9._-]{1,128}$/.test(id), 'Invalid message id'); return join(paths.messages, `${id}.json`); }
function validateMessage(message) {
  demand(record(message) && message.version === VERSION && typeof message.id === 'string' && typeof message.correlationId === 'string', 'Malformed message envelope');
  demand(Object.keys(message).every(key => ['version', 'id', 'correlationId', 'replyTo', 'kind', 'from', 'to', 'body', 'context', 'state', 'createdAt', 'contentHash', 'acceptedAt', 'receivedAt', 'handledAt', 'ackedAt'].includes(key)), 'Message has unsupported fields');
  if (message.context !== undefined) parseContext(message.context);
  demand(KIND.includes(message.kind) && typeof message.body === 'string' && Buffer.byteLength(message.body) <= MAX_BODY, 'Invalid kind or body exceeds 16 KiB');
  demand(record(message.from) && record(message.to), 'Message requires exact from and to targets');
  parseTarget(message.from); parseTarget(message.to);
  demand(STATES.includes(message.state), 'Invalid message state');
  demand(/^[A-Za-z0-9._-]{1,128}$/.test(message.id) && message.correlationId.length > 0, 'Invalid message identity');
  demand(message.replyTo === null || typeof message.replyTo === 'string', 'Invalid replyTo');
  demand(typeof message.createdAt === 'string' && Number.isFinite(Date.parse(message.createdAt)), 'Invalid message creation timestamp');
  for (const state of STATES.slice(1, STATES.indexOf(message.state) + 1)) {
    demand(typeof message[`${state}At`] === 'string' && Number.isFinite(Date.parse(message[`${state}At`])), `Missing or invalid ${state} timestamp`);
  }
  demand(typeof message.contentHash === 'string' && message.contentHash === digest(immutableMessage(message)), 'Message content hash mismatch');
  return message;
}
function listMessages(paths) {
  if (!existsSync(paths.messages)) return [];
  return readdirSync(paths.messages).filter(n => n.endsWith('.json')).map(n => {
    const message = validateMessage(readJson(join(paths.messages, n)));
    demand(`${message.id}.json` === n, `Message id does not match persisted filename: ${n}`);
    return message;
  });
}
function normalizeMessage(input, registry) {
  demand(record(input) && typeof input.id === 'string' && typeof input.body === 'string', 'Input requires id and body');
  demand(input.kind === undefined || KIND.includes(input.kind), 'kind must be message, reply, or done');
  const from = sessionFor(registry, input.from).target;
  const to = sessionFor(registry, input.to).target;
  demand(input.id.length > 0 && input.id.length <= 128 && /^[A-Za-z0-9._-]+$/.test(input.id), 'Invalid stable message id');
  demand(Buffer.byteLength(input.body, 'utf8') <= MAX_BODY, 'Body exceeds 16 KiB');
  const message = { version: VERSION, id: input.id, correlationId: input.correlationId ?? input.id,
    replyTo: input.replyTo ?? null, kind: input.kind ?? 'message', from, to, body: input.body,
    state: 'queued', createdAt: new Date().toISOString(), contentHash: '' };
  if (input.context !== undefined) message.context = parseContext(input.context);
  demand(typeof message.correlationId === 'string' && message.correlationId.length > 0, 'correlationId must be a nonempty string');
  demand(message.kind !== 'ack', 'Acknowledgments are control state, not messages; ack loops are forbidden');
  message.contentHash = digest(immutableMessage(message));
  return message;
}

export function operate(root, command, input = {}) {
  const paths = rootPaths(root);
  demand(['init', 'register', 'retire', 'send', 'accept', 'poll', 'receive', 'handle', 'reply', 'done', 'ack', 'replay', 'status'].includes(command), 'Unknown command');
  demand(record(input), 'Input must be an object');
  const fields = {
    init: [], status: [], register: ['target'], retire: ['target'], poll: ['target'],
    send: ['id', 'correlationId', 'kind', 'from', 'to', 'body', 'context'],
    reply: ['id', 'correlationId', 'replyTo', 'from', 'to', 'body', 'context'], done: ['id', 'correlationId', 'replyTo', 'from', 'to', 'body', 'context'],
    accept: ['id', 'target'], receive: ['id', 'target'], handle: ['id', 'target'], ack: ['id', 'target'], replay: ['id', 'target']
  }[command];
  demand(Object.keys(input).every(key => fields.includes(key)), `Unsupported input field for ${command}`);
  if (command === 'init') {
    mkdirSync(paths.base, { recursive: true, mode: 0o700 });
    mkdirSync(paths.messages, { recursive: true, mode: 0o700 });
    return withLock(paths, () => {
      const registry = load(paths); if (!existsSync(paths.registry)) save(paths, registry);
      return { result: 'initialized', version: VERSION, sessions: registry.sessions.length };
    });
  }
  demand(existsSync(paths.registry), 'Runtime is not initialized; run init with this explicit root');
  return withLock(paths, () => {
    const registry = load(paths);
    if (command === 'register') {
      const target = parseTarget(input.target);
      const sameNativeIdentity = s => s.target.project === target.project && s.target.host === target.host && s.target.harness === target.harness
        && s.target.interface === target.interface && s.target.nativeId === target.nativeId;
      const prior = registry.sessions.filter(sameNativeIdentity);
      demand(prior.every(s => target.generation > s.target.generation), 'Generation must increase for a reused native session identity');
      for (const session of prior) if (session.status === 'registered') session.status = 'superseded';
      registry.sessions.push({ target, status: 'registered', registeredAt: new Date().toISOString() }); save(paths, registry);
      return { result: 'registered', target };
    }
    if (command === 'retire') {
      const entry = sessionFor(registry, input.target);
      entry.status = 'retired'; save(paths, registry);
      return { result: 'retired', target: entry.target };
    }
    if (command === 'send' || command === 'reply' || command === 'done') {
      let parent;
      if (command === 'send') demand(input.kind === undefined || input.kind === 'message', 'send only creates message records; use reply or done for correlated responses');
      if (command !== 'send') {
        demand(typeof input.replyTo === 'string' && input.replyTo.length > 0, `${command} requires replyTo`);
        parent = readJson(messagePath(paths, input.replyTo));
        demand(parent, `Unknown replyTo message id: ${input.replyTo}`);
        parent = validateMessage(parent);
      }
      const message = normalizeMessage({ ...input, context: input.context === undefined ? parent?.context : input.context, correlationId: input.correlationId ?? parent?.correlationId, kind: command === 'send' ? (input.kind ?? 'message') : command }, registry);
      if (command !== 'send') {
        demand(canonical(message.from) === canonical(parent.to) && canonical(message.to) === canonical(parent.from), 'Reply target must reverse the exact parent message route');
        demand(message.correlationId === parent.correlationId, 'Reply correlationId must match its parent');
        if (parent.context) demand(message.context?.ticket === parent.context.ticket, 'Reply context ticket must match its parent');
        message.replyTo = parent.id; message.contentHash = digest(immutableMessage(message));
      }
      validateMessage(message);
      const path = messagePath(paths, message.id); const existing = readJson(path);
      if (existing) {
        demand(existing.contentHash === message.contentHash, `Message id conflict: ${message.id} already has different content`);
        return { result: 'duplicate', message: existing };
      }
      atomicJson(path, message); return { result: 'queued', message };
    }
    if (command === 'poll') {
      const target = sessionFor(registry, input.target).target;
      return { result: 'polled', messages: listMessages(paths).filter(m => canonical(m.to) === canonical(target) && m.state !== 'queued' && m.state !== 'acked') };
    }
    if (command === 'status') return { result: 'status', sessions: registry.sessions, messages: listMessages(paths) };
    const path = messagePath(paths, input.id); const message = readJson(path);
    demand(message, `Unknown message id: ${input.id}`);
    validateMessage(message);
    demand(canonical(message.to) === canonical(sessionFor(registry, input.target).target), 'Wrong target: message belongs to a different exact session/generation');
    if (command === 'replay') return { result: 'replay-unchanged', message };
    const transitions = { accept: ['queued', 'accepted'], receive: ['accepted', 'received'], handle: ['received', 'handled'], ack: ['handled', 'acked'] };
    const [from, to] = transitions[command] ?? [];
    demand(from, 'Invalid transition command');
    demand(message.kind !== 'ack', 'Cannot acknowledge an acknowledgment');
    if (message.state === to || STATES.indexOf(message.state) > STATES.indexOf(to)) return { result: 'duplicate', message };
    demand(message.state === from, `Cannot ${command} message in ${message.state} state; expected ${from}`);
    message.state = to; message[`${to}At`] = new Date().toISOString(); atomicJson(path, message);
    return { result: to, message };
  });
}

function cli(argv) {
  const [command, ...rest] = argv;
  demand(typeof command === 'string' && rest[0] === '--root' && typeof rest[1] === 'string', 'Usage: session-messages.mjs COMMAND --root PRIVATE_DIR [--json FILE]');
  const root = rest[1]; let input = {};
  if (rest.length === 2) input = {};
  else if (rest.length === 4 && rest[2] === '--json' && rest[3]) input = JSON.parse(readFileSync(resolve(rest[3]), 'utf8'));
  else demand(false, 'Unexpected arguments; use exactly --root PRIVATE_DIR and optional --json FILE');
  demand(record(input), 'JSON input must be an object');
  const output = operate(root, command, input);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

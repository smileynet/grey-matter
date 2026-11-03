#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HASH = /^[0-9a-f]{64}$/i;
const SHA = /^[0-9a-f]{40,64}$/i;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_EVIDENCE_BYTES = 32 * 1024 * 1024;

function demand(ok, message) { if (!ok) throw new Error(message); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function fields(value, allowed, label) {
  demand(object(value) && Object.keys(value).every(key => allowed.includes(key)), `${label} has unsupported fields`);
}
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function readRegular(path, label, maxBytes) {
  const stat = lstatSync(path);
  demand(stat.isFile() && !stat.isSymbolicLink(), `${label} must be a regular file`);
  demand(stat.size <= maxBytes, `${label} exceeds ${maxBytes} bytes`);
  return readFileSync(path);
}
function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function regular(root, path, label) {
  demand(typeof path === 'string' && path.length > 0 && !isAbsolute(path) && !path.includes('\\')
    && !/[\u0000-\u001f]/.test(path), `${label} must be a safe relative path`);
  const parts = path.split('/');
  demand(parts.every(part => part && part !== '.' && part !== '..'), `${label} has an unsafe path component`);
  const full = resolve(root, ...parts);
  const rel = relative(root, full);
  demand(rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel), `${label} escapes repository root`);
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = resolve(cursor, part);
    const stat = lstatSync(cursor);
    demand(!stat.isSymbolicLink(), `${label} cannot traverse symlinks`);
  }
  demand(lstatSync(full).isFile(), `${label} must be a regular file`);
  return { full, path: rel.split(sep).join('/') };
}

function validateExpected(expected) {
  fields(expected, ['version', 'root', 'candidateCommit', 'traceSha256', 'maxAgentSlots', 'criticReserve'], 'Expected identity');
  demand(expected.version === 1, 'Expected identity version must be 1');
  demand(typeof expected.root === 'string' && expected.root.length > 0, 'Expected identity needs repository root');
  demand(typeof expected.candidateCommit === 'string' && SHA.test(expected.candidateCommit), 'Expected identity needs candidate commit SHA');
  demand(typeof expected.traceSha256 === 'string' && HASH.test(expected.traceSha256), 'Expected identity needs trace SHA-256');
  demand(Number.isSafeInteger(expected.maxAgentSlots) && expected.maxAgentSlots > 0, 'Expected identity needs an agent-slot cap including the parent');
  demand(Number.isSafeInteger(expected.criticReserve) && expected.criticReserve >= 0 && expected.criticReserve < expected.maxAgentSlots,
    'Expected identity needs a valid critic reserve');
}

function validateEvent(event) {
  demand(object(event) && typeof event.type === 'string', 'Trace event needs a type');
  const schemas = {
    contract: ['type', 'revision', 'scope', 'evidence'],
    'batch-complete': ['type', 'batch', 'evidence'],
    frontier: ['type', 'items', 'evidence'],
    'scope-revised': ['type', 'revision', 'included', 'evidence'],
    'scope-cancelled': ['type', 'ticket', 'revision', 'evidence'],
    dispatch: ['type', 'ticket', 'revision', 'workers', 'critics', 'criticsReserved', 'evidence'],
    review: ['type', 'candidateCommit', 'revision', 'verdict', 'evidence'],
    accept: ['type', 'candidateCommit', 'revision', 'evidence'],
    integrate: ['type', 'candidateCommit', 'revision', 'evidence'],
    'completion-replay': ['type', 'id', 'result', 'contentHash', 'recordsBefore', 'recordsAfter', 'evidence'],
    monitor: ['type', 'confirmed', 'state', 'action', 'evidence'],
    'usage-limit': ['type', 'limit', 'reset', 'fallback', 'evidence'],
    checkpoint: ['type', 'candidateCommit', 'evidence'],
    stop: ['type', 'reason', 'evidence'],
    publication: ['type', 'candidateCommit', 'result', 'evidence'],
    outcome: ['type', 'work', 'verification', 'cleanup', 'delivery', 'evidence'],
  };
  demand(schemas[event.type], `Unsupported trace event type: ${event.type}`);
  fields(event, schemas[event.type], `Event ${event.type}`);
  demand(Array.isArray(event.evidence) && event.evidence.length > 0
    && event.evidence.every(path => typeof path === 'string' && path.length > 0), `Event ${event.type} needs evidence paths`);
}

function validateTrace(trace, expected, root) {
  fields(trace, ['version', 'candidateCommit', 'evidence', 'events'], 'Trace');
  demand(trace.version === 1 && trace.candidateCommit === expected.candidateCommit, 'Trace candidate/version does not match expected identity');
  demand(Array.isArray(trace.evidence) && Array.isArray(trace.events) && trace.events.length > 0, 'Trace needs evidence and events');
  const evidence = trace.evidence.map(row => {
    fields(row, ['path', 'sha256'], 'Evidence');
    demand(typeof row.sha256 === 'string' && HASH.test(row.sha256), 'Evidence needs a SHA-256');
    const file = regular(root, row.path, 'Evidence path');
    demand(lstatSync(file.full).size <= MAX_EVIDENCE_BYTES, `Evidence exceeds ${MAX_EVIDENCE_BYTES} bytes: ${file.path}`);
    const bytes = readFileSync(file.full);
    const actual = hash(bytes);
    demand(actual === row.sha256.toLowerCase(), `Evidence hash mismatch: ${file.path}`);
    return { path: file.path, bytes: bytes.length, sha256: actual };
  });
  demand(new Set(evidence.map(row => row.path)).size === evidence.length, 'Evidence paths must be unique');
  trace.events.forEach(validateEvent);
  const boundEvidence = new Set(evidence.map(row => row.path));
  for (const event of trace.events) {
    for (const path of event.evidence) demand(boundEvidence.has(path), `Event evidence is not hash-bound: ${path}`);
  }
  return evidence;
}

function auditEvents(events, expected) {
  let revision;
  let scope;
  let frontier;
  let frontierNeedsRefresh = false;
  let stopReason;
  let checkpointed = false;
  let monitor = 'unknown';
  let publication = 'not-attempted';
  let accepted = new Set();
  let integrated = new Set();
  let reviews = new Map();

  for (const [index, event] of events.entries()) {
    if (index === 0) demand(event.type === 'contract', 'Trace must begin with its outcome contract');
    if (index > 0) demand(event.type !== 'contract', 'Trace may contain only one initial contract');
    if (event.type === 'contract') {
      demand(Number.isSafeInteger(event.revision) && event.revision > 0, 'Contract revision must be positive');
      demand(Array.isArray(event.scope) && event.scope.every(id => typeof id === 'string' && id.trim())
        && new Set(event.scope).size === event.scope.length, 'Contract scope must contain unique ticket IDs');
      revision = event.revision;
      scope = new Set(event.scope);
    } else if (event.type === 'batch-complete') {
      demand(typeof event.batch === 'string' && event.batch.trim(), 'Batch completion needs an identity');
      frontierNeedsRefresh = true;
    } else if (event.type === 'frontier') {
      demand(Array.isArray(event.items), 'Frontier must be an item list');
      const seen = new Set();
      for (const item of event.items) {
        fields(item, ['ticket', 'state', 'inScope'], 'Frontier item');
        demand(typeof item.ticket === 'string' && item.ticket.trim() && ['open', 'blocked', 'deferred', 'done', 'cancelled'].includes(item.state)
          && typeof item.inScope === 'boolean', 'Frontier item has invalid ticket, state or scope');
        demand(!seen.has(item.ticket), `Frontier contains duplicate ticket: ${item.ticket}`);
        seen.add(item.ticket);
        demand(item.inScope === scope.has(item.ticket), `Frontier scope flag disagrees with current scope: ${item.ticket}`);
      }
      for (const ticket of scope) demand(seen.has(ticket), `Frontier omits current-scope ticket: ${ticket}`);
      frontier = event.items;
      frontierNeedsRefresh = false;
    } else if (event.type === 'scope-revised') {
      demand(Number.isSafeInteger(event.revision) && event.revision > revision, 'Scope revision must increase');
      demand(Array.isArray(event.included) && event.included.every(id => typeof id === 'string' && id.trim())
        && new Set(event.included).size === event.included.length, 'Revised scope must list unique included ticket IDs');
      revision = event.revision;
      scope = new Set(event.included);
      frontier = undefined;
      reviews.clear();
      accepted.clear();
      integrated.clear();
    } else if (event.type === 'scope-cancelled') {
      demand(typeof event.ticket === 'string' && event.ticket.length > 0, 'Cancellation needs a ticket ID');
      demand(scope.has(event.ticket), 'Cancelled ticket is not in the current scope');
      demand(Number.isSafeInteger(event.revision) && event.revision > revision, 'Cancellation must advance the scope revision');
      revision = event.revision;
      scope.delete(event.ticket);
      frontier = undefined;
      reviews.clear();
      accepted.clear();
      integrated.clear();
    } else if (event.type === 'dispatch') {
      demand(!frontierNeedsRefresh && frontier, 'Reconcile the frontier before dispatch');
      demand(event.revision === revision && scope.has(event.ticket), 'Dispatch must bind the current scope and revision');
      demand(frontier.some(item => item.ticket === event.ticket && item.inScope && item.state === 'open'), 'Dispatch ticket is not open in the current frontier');
      demand(Number.isSafeInteger(event.workers) && event.workers >= 1 && Number.isSafeInteger(event.critics) && event.critics >= 0,
        'Dispatch needs observed worker and critic counts');
      demand(Number.isSafeInteger(event.criticsReserved) && event.criticsReserved >= 0, 'Dispatch needs a nonnegative reserved critic count');
      demand(event.critics <= event.criticsReserved, 'Active critics exceed reserved critic capacity');
      demand(1 + event.workers + event.criticsReserved <= expected.maxAgentSlots,
        'Dispatch exceeds expected agent-slot cap including parent and reserved critics');
      demand(event.criticsReserved >= expected.criticReserve,
        'Dispatch did not reserve required critic capacity');
      demand(!stopReason, 'Dispatch follows a stop boundary');
    } else if (event.type === 'review') {
      demand(typeof event.candidateCommit === 'string' && SHA.test(event.candidateCommit)
        && event.revision === revision && ['PASS', 'BLOCK'].includes(event.verdict), 'Review needs current scope revision, candidate and verdict');
      const key = `${event.candidateCommit}:${event.revision}`;
      reviews.set(key, event.verdict);
      accepted.delete(key);
      integrated.delete(key);
    } else if (event.type === 'accept') {
      demand(event.revision === revision && reviews.get(`${event.candidateCommit}:${event.revision}`) === 'PASS',
        'Acceptance requires a PASS for the exact candidate and scope revision');
      accepted.add(`${event.candidateCommit}:${event.revision}`);
    } else if (event.type === 'integrate') {
      demand(event.revision === revision && accepted.has(`${event.candidateCommit}:${event.revision}`),
        'Integration requires the accepted candidate and current scope revision');
      integrated.add(`${event.candidateCommit}:${event.revision}`);
    } else if (event.type === 'completion-replay') {
      demand(typeof event.id === 'string' && event.id.length > 0 && HASH.test(event.contentHash), 'Replay needs message ID and content hash');
      demand(event.result === 'replay-unchanged' && Number.isSafeInteger(event.recordsBefore) && event.recordsBefore >= 0
        && event.recordsAfter === event.recordsBefore, 'Replay must return the same record without retry or duplicate');
    } else if (event.type === 'monitor') {
      demand(typeof event.confirmed === 'boolean' && ['active', 'missing', 'unknown'].includes(event.state)
        && ['none', 'recreate'].includes(event.action), 'Monitor observation is malformed');
      demand(!event.confirmed || event.state !== 'unknown', 'Confirmed monitor observation needs an observed state');
      demand(event.action !== 'recreate', 'Auditor cannot authorize monitor recreation');
      monitor = event.confirmed ? event.state : 'unknown';
    } else if (event.type === 'usage-limit') {
      demand(typeof event.limit === 'string' && event.limit.trim() && typeof event.reset === 'string' && event.reset.trim(),
        'Usage limit needs the exact observed limit and reset');
      demand(event.fallback === 'off', 'Usage-limit trace must record provider fallback off');
      stopReason = 'usage-limit';
    } else if (event.type === 'checkpoint') {
      demand(event.candidateCommit === expected.candidateCommit, 'Checkpoint candidate differs from expected identity');
      checkpointed = true;
    } else if (event.type === 'stop') {
      demand(typeof event.reason === 'string' && event.reason.trim(), 'Stop needs a reason');
      demand(checkpointed, 'Stop requires a recovery checkpoint');
      demand(!stopReason || event.reason === stopReason, 'Stop reason differs from observed stop boundary');
      stopReason ??= event.reason;
    } else if (event.type === 'publication') {
      demand(event.candidateCommit === expected.candidateCommit && ['failed', 'published', 'not-attempted'].includes(event.result),
        'Publication result must bind the expected candidate');
      if (publication === 'failed') demand(event.result === 'failed', 'Failed publication cannot be erased or later claimed delivered in the same trace');
      publication = event.result;
    } else if (event.type === 'outcome') {
      demand(['proposed', 'running', 'candidate-ready', 'accepted', 'integrated', 'delivered', 'intentionally-stopped'].includes(event.work), 'Invalid work state');
      demand(['pass', 'assertion-failure', 'skip', 'infrastructure-error', 'timeout', 'survivor', 'unavailable'].includes(event.verification), 'Invalid verification state');
      demand(['observed-settled', 'unresolved', 'unobserved'].includes(event.cleanup), 'Invalid cleanup state');
      demand(['local', 'pushed', 'published', 'publication-failed'].includes(event.delivery), 'Invalid delivery state');
      if (event.work === 'delivered') {
        demand(integrated.has(`${expected.candidateCommit}:${revision}`), 'Delivered outcome requires integrated candidate under current scope revision');
        demand(event.verification === 'pass', 'Delivered outcome requires passing verification');
        demand(event.delivery === 'published' || event.delivery === 'pushed', 'Delivered work needs observed delivery');
        demand(frontier, 'Delivered outcome requires a current reconciled frontier');
        demand(frontier.every(item => !item.inScope || item.state === 'done'), 'Delivered outcome hides unfinished in-scope frontier work');
      }
      if (publication === 'failed') demand(event.delivery === 'publication-failed' && event.work !== 'delivered',
        'Failed publication cannot be reported delivered');
      if (event.work === 'delivered') demand(!frontierNeedsRefresh, 'Delivered outcome requires current frontier reconciliation');
    }
  }
  demand(!frontierNeedsRefresh, 'Final batch requires a frontier reconciliation');
  if (stopReason === 'usage-limit') {
    demand(checkpointed && events.at(-1)?.type === 'stop', 'Usage limit requires checkpoint and terminal stop');
    demand(!events.slice(events.findIndex(event => event.type === 'usage-limit') + 1).some(event => event.type === 'dispatch'),
      'Usage-limit stop cannot dispatch more work');
  }
  return { revision, frontierItems: frontier?.length ?? null, stopReason: stopReason ?? null, monitor, publication };
}

export function auditOutcomeTrace(expectedPath, tracePath, { cwd = process.cwd() } = {}) {
  const expected = JSON.parse(readRegular(expectedPath, 'Expected identity', MAX_JSON_BYTES).toString('utf8'));
  const traceBytes = readRegular(tracePath, 'Outcome trace', MAX_JSON_BYTES);
  const trace = JSON.parse(traceBytes.toString('utf8'));
  validateExpected(expected);
  demand(hash(traceBytes) === expected.traceSha256.toLowerCase(), 'Trace does not match parent-owned expected identity');
  demand(trace.candidateCommit === expected.candidateCommit, 'Trace candidate/version does not match expected identity');
  const root = realpathSync(git(cwd, ['rev-parse', '--show-toplevel']));
  demand(root === realpathSync(expected.root), 'Expected identity root does not match current checkout');
  const registered = git(root, ['worktree', 'list', '--porcelain']).split(/\r?\n\r?\n/).some(entry => {
    const path = entry.split(/\r?\n/).find(line => line.startsWith('worktree '))?.slice(9);
    return path && realpathSync(path) === root;
  });
  demand(registered, 'Current checkout is not a registered Git worktree');
  demand(git(root, ['rev-parse', 'HEAD']) === expected.candidateCommit, 'Current HEAD differs from expected candidate');
  const evidence = validateTrace(trace, expected, root);
  const observations = auditEvents(trace.events, expected);
  return { status: 'pass', root, candidateCommit: expected.candidateCommit, events: trace.events.length, evidence, observations,
    claimsAreAttestations: true };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    demand(process.argv.length === 4, 'Usage: node audit-outcome-trace.mjs PARENT-EXPECTED-IDENTITY.json TRACE.json');
    console.log(JSON.stringify(auditOutcomeTrace(process.argv[2], process.argv[3]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

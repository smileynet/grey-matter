import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditOutcomeTrace } from './audit-outcome-trace.mjs';
import { operate } from './session-messages.mjs';

const roots = [];
const sidecars = [];
const auditor = fileURLToPath(new URL('./audit-outcome-trace.mjs', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function git(root, ...args) { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }

function fixture(events = []) {
  const root = mkdtempSync(join(tmpdir(), 'orchestrate-scenario-207-'));
  roots.push(root);
  mkdirSync(join(root, 'evidence'));
  writeFileSync(join(root, 'evidence/dispatch.json'), '{"status":"pass"}\n');
  git(root, 'init', '-b', 'scenario');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'scenario source and evidence');
  const candidateCommit = git(root, 'rev-parse', 'HEAD');
  const evidence = readFileSync(join(root, 'evidence/dispatch.json'));
  const trace = {
    version: 1,
    candidateCommit,
    evidence: [{ path: 'evidence/dispatch.json', sha256: hash(evidence) }],
    events: [
      { type: 'contract', revision: 1, scope: ['A', 'B'] },
      ...(events.length ? [{ type: 'frontier', items: [{ ticket: 'A', state: 'open', inScope: true }, { ticket: 'B', state: 'open', inScope: true }] }] : []),
      ...events,
    ].map(event => ({ ...event, evidence: ['evidence/dispatch.json'] })),
  };
  const tracePath = `${root}-trace.json`;
  const expectedPath = `${root}-expected.json`;
  sidecars.push(tracePath, expectedPath);
  const expected = { version: 1, root, candidateCommit, traceSha256: '', maxAgentSlots: 3, criticReserve: 1 };
  const save = () => {
    trace.events = trace.events.map(event => ({ ...event, evidence: event.evidence ?? ['evidence/dispatch.json'] }));
    const bytes = Buffer.from(JSON.stringify(trace));
    writeFileSync(tracePath, bytes);
    expected.traceSha256 = hash(bytes);
    writeFileSync(expectedPath, JSON.stringify(expected));
  };
  save();
  return { root, candidateCommit, trace, expected, tracePath, expectedPath, save };
}

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  for (const path of sidecars) rmSync(path, { force: true });
});

test('continues after a batch when the reconciled scoped frontier is open; blocked work cannot be called complete', () => {
  const f = fixture([
    { type: 'batch-complete', batch: 'batch-1' },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'open', inScope: true }] },
    { type: 'dispatch', ticket: 'B', revision: 1, workers: 1, critics: 1, criticsReserved: 1 },
  ]);
  assert.equal(auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }).observations.frontierItems, 2);

  const blocked = fixture([
    { type: 'batch-complete', batch: 'batch-1' },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'blocked', inScope: true }] },
    { type: 'outcome', work: 'delivered', verification: 'pass', cleanup: 'observed-settled', delivery: 'pushed' },
  ]);
  blocked.trace.events.splice(3, 0, { type: 'review', candidateCommit: blocked.candidateCommit, revision: 1, verdict: 'PASS' },
    { type: 'accept', candidateCommit: blocked.candidateCommit, revision: 1 }, { type: 'integrate', candidateCommit: blocked.candidateCommit, revision: 1 });
  blocked.save();
  assert.throws(() => auditOutcomeTrace(blocked.expectedPath, blocked.tracePath, { cwd: blocked.root }), /unfinished in-scope frontier/);
});

test('frontier cannot hide scoped work, lie about scope membership or duplicate ticket rows', () => {
  const missing = fixture([{ type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }] }]);
  assert.throws(() => auditOutcomeTrace(missing.expectedPath, missing.tracePath, { cwd: missing.root }), /omits current-scope ticket: B/);
  const misflagged = fixture([{ type: 'frontier', items: [
    { ticket: 'A', state: 'done', inScope: false }, { ticket: 'B', state: 'done', inScope: true },
  ] }]);
  assert.throws(() => auditOutcomeTrace(misflagged.expectedPath, misflagged.tracePath, { cwd: misflagged.root }), /scope flag disagrees/);
  const duplicate = fixture([{ type: 'frontier', items: [
    { ticket: 'A', state: 'done', inScope: true }, { ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true },
  ] }]);
  assert.throws(() => auditOutcomeTrace(duplicate.expectedPath, duplicate.tracePath, { cwd: duplicate.root }), /duplicate ticket: A/);
});

test('CLI emits a bounded result for parent-bound evidence and rejects unknown event fields', () => {
  const f = fixture([{ type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true }] }]);
  const result = spawnSync(process.execPath, [auditor, f.expectedPath, f.tracePath], { cwd: f.root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.claimsAreAttestations, true);
  assert.equal(output.candidateCommit, f.candidateCommit);
  f.trace.events[2].commands = ['publish'];
  f.save();
  const rejected = spawnSync(process.execPath, [auditor, f.expectedPath, f.tracePath], { cwd: f.root, encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /unsupported fields/);
});

test('clarified scope supersedes old admissions and cancelled work cannot be dispatched', () => {
  const clarified = fixture([
    { type: 'scope-revised', revision: 2, included: ['B'] },
    { type: 'frontier', items: [{ ticket: 'B', state: 'open', inScope: true }] },
    { type: 'dispatch', ticket: 'A', revision: 1, workers: 1, critics: 1, criticsReserved: 1 },
  ]);
  assert.throws(() => auditOutcomeTrace(clarified.expectedPath, clarified.tracePath, { cwd: clarified.root }), /current scope and revision/);
  const cancelled = fixture([
    { type: 'scope-cancelled', ticket: 'A', revision: 2 },
    { type: 'frontier', items: [{ ticket: 'A', state: 'cancelled', inScope: false }, { ticket: 'B', state: 'open', inScope: true }] },
    { type: 'dispatch', ticket: 'A', revision: 1, workers: 1, critics: 1, criticsReserved: 1 },
  ]);
  assert.throws(() => auditOutcomeTrace(cancelled.expectedPath, cancelled.tracePath, { cwd: cancelled.root }), /current scope and revision/);
});

test('critic reservation counts against the externally supplied live slot cap', () => {
  const over = fixture([{ type: 'dispatch', ticket: 'A', revision: 1, workers: 3, critics: 1, criticsReserved: 1 }]);
  assert.throws(() => auditOutcomeTrace(over.expectedPath, over.tracePath, { cwd: over.root }), /exceeds expected agent-slot cap/);
  const unreserved = fixture([{ type: 'dispatch', ticket: 'A', revision: 1, workers: 1, critics: 0, criticsReserved: 0 }]);
  assert.throws(() => auditOutcomeTrace(unreserved.expectedPath, unreserved.tracePath, { cwd: unreserved.root }), /did not reserve required critic capacity/);
});

test('a review of another candidate cannot authorize acceptance of this candidate', () => {
  const f = fixture([
    { type: 'review', candidateCommit: 'a'.repeat(40), revision: 1, verdict: 'PASS' },
    { type: 'accept', candidateCommit: '', revision: 1 },
  ]);
  f.trace.events[3].candidateCommit = f.candidateCommit;
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /PASS for the exact candidate/);
});

test('scope clarification invalidates an earlier candidate acceptance', () => {
  const f = fixture([
    { type: 'review', candidateCommit: '', revision: 1, verdict: 'PASS' },
    { type: 'scope-revised', revision: 2, included: ['A'] },
    { type: 'accept', candidateCommit: '', revision: 1 },
  ]);
  f.trace.events[2].candidateCommit = f.candidateCommit;
  f.trace.events[4].candidateCommit = f.candidateCommit;
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /candidate and scope revision/);
});

test('scope cancellation advances revision and prevents delivery under the old acceptance', () => {
  const f = fixture();
  const evidence = ['evidence/dispatch.json'];
  f.trace.events = [
    { type: 'contract', revision: 1, scope: ['A', 'B'], evidence },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true }], evidence },
    { type: 'review', candidateCommit: f.candidateCommit, revision: 1, verdict: 'PASS', evidence },
    { type: 'accept', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'integrate', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'scope-cancelled', ticket: 'B', revision: 2, evidence },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'cancelled', inScope: false }], evidence },
    { type: 'outcome', work: 'delivered', verification: 'pass', cleanup: 'observed-settled', delivery: 'pushed', evidence },
  ];
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /integrated candidate under current scope revision/);
});

test('a later blocking review invalidates prior acceptance and integration', () => {
  const f = fixture();
  const evidence = ['evidence/dispatch.json'];
  f.trace.events = [
    { type: 'contract', revision: 1, scope: ['A', 'B'], evidence },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true }], evidence },
    { type: 'review', candidateCommit: f.candidateCommit, revision: 1, verdict: 'PASS', evidence },
    { type: 'accept', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'integrate', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'review', candidateCommit: f.candidateCommit, revision: 1, verdict: 'BLOCK', evidence },
    { type: 'outcome', work: 'delivered', verification: 'pass', cleanup: 'observed-settled', delivery: 'pushed', evidence },
  ];
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /integrated candidate under current scope revision/);
});

test('nonpassing or unavailable verification cannot accompany a delivered outcome', () => {
  const f = fixture();
  const evidence = ['evidence/dispatch.json'];
  f.trace.events = [
    { type: 'contract', revision: 1, scope: ['A', 'B'], evidence },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true }], evidence },
    { type: 'review', candidateCommit: f.candidateCommit, revision: 1, verdict: 'PASS', evidence },
    { type: 'accept', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'integrate', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'outcome', work: 'delivered', verification: 'unavailable', cleanup: 'observed-settled', delivery: 'pushed', evidence },
  ];
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /requires passing verification/);
});

test('unconfirmed monitor state stays unknown; usage limit requires checkpoint and terminal stop', () => {
  const monitor = fixture([{ type: 'monitor', confirmed: false, state: 'missing', action: 'none' }]);
  assert.equal(auditOutcomeTrace(monitor.expectedPath, monitor.tracePath, { cwd: monitor.root }).observations.monitor, 'unknown');
  monitor.trace.events[2].action = 'recreate';
  monitor.save();
  assert.throws(() => auditOutcomeTrace(monitor.expectedPath, monitor.tracePath, { cwd: monitor.root }), /cannot authorize monitor recreation/);

  const stopped = fixture([
    { type: 'usage-limit', limit: 'observed cap exhausted', reset: 'provider reset time not reported', fallback: 'off' },
    { type: 'checkpoint', candidateCommit: '' },
  ]);
  stopped.trace.events[3].candidateCommit = stopped.candidateCommit;
  stopped.trace.events.push({ type: 'stop', reason: 'usage-limit' });
  stopped.save();
  assert.equal(auditOutcomeTrace(stopped.expectedPath, stopped.tracePath, { cwd: stopped.root }).observations.stopReason, 'usage-limit');
  stopped.trace.events.splice(3, 0, { type: 'dispatch', ticket: 'A', revision: 1, workers: 1, critics: 1, criticsReserved: 1 });
  stopped.save();
  assert.throws(() => auditOutcomeTrace(stopped.expectedPath, stopped.tracePath, { cwd: stopped.root }), /follows a stop boundary/);
});

test('lost completion replay uses the persisted 208 spool record unchanged across a new CLI process', () => {
  const f = fixture();
  const runtime = mkdtempSync(join(tmpdir(), 'orchestrate-session-207-'));
  roots.push(runtime);
  const parent = { project: 'fixture', host: 'local', harness: 'codex', harnessVersion: 'not-reported', interface: 'desktop', nativeId: 'parent', generation: 1, role: 'orchestrator', worktree: 'D:/fixture', branch: 'main' };
  const worker = { ...parent, nativeId: 'worker', role: 'worker', branch: 'worker/task' };
  operate(runtime, 'init');
  operate(runtime, 'register', { target: parent });
  operate(runtime, 'register', { target: worker });
  operate(runtime, 'send', { id: 'task-message', correlationId: 'task-1', from: parent, to: worker, body: 'complete assigned task' });
  const completion = operate(runtime, 'done', { id: 'completion-1', replyTo: 'task-message', from: worker, to: parent, body: 'DONE candidate' }).message;
  const script = fileURLToPath(new URL('./session-messages.mjs', import.meta.url));
  const status = JSON.parse(execFileSync(process.execPath, [script, 'status', '--root', runtime], { encoding: 'utf8' }));
  assert.equal(status.messages.length, 2);
  const replay = operate(runtime, 'replay', { id: 'completion-1', target: parent });
  assert.equal(replay.result, 'replay-unchanged');
  assert.deepEqual(replay.message, completion);
  assert.equal(operate(runtime, 'status').messages.length, 2);

  f.trace.events.push({ type: 'completion-replay', id: completion.id, result: replay.result,
    contentHash: completion.contentHash, recordsBefore: status.messages.length, recordsAfter: operate(runtime, 'status').messages.length });
  f.save();
  assert.equal(auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }).status, 'pass');
  f.trace.events.at(-1).recordsAfter += 1;
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /same record without retry or duplicate/);
});

test('failed publication cannot be reported as delivered', () => {
  const f = fixture();
  const evidence = ['evidence/dispatch.json'];
  f.trace.events = [
    { type: 'contract', revision: 1, scope: ['A', 'B'], evidence },
    { type: 'frontier', items: [{ ticket: 'A', state: 'done', inScope: true }, { ticket: 'B', state: 'done', inScope: true }], evidence },
    { type: 'review', candidateCommit: f.candidateCommit, revision: 1, verdict: 'PASS', evidence },
    { type: 'accept', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'integrate', candidateCommit: f.candidateCommit, revision: 1, evidence },
    { type: 'publication', candidateCommit: f.candidateCommit, result: 'failed', evidence },
    { type: 'outcome', work: 'delivered', verification: 'pass', cleanup: 'observed-settled', delivery: 'pushed', evidence },
  ];
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /Failed publication cannot be reported delivered/);
  f.trace.events.splice(6, 0, { type: 'publication', candidateCommit: f.candidateCommit, result: 'not-attempted', evidence });
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /cannot be erased/);
});

test('expected identity binds the exact trace, candidate, root and evidence bytes', () => {
  const f = fixture();
  f.expected.candidateCommit = '0'.repeat(40);
  writeFileSync(f.expectedPath, JSON.stringify(f.expected));
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /Trace candidate\/version/);
  f.expected.candidateCommit = f.candidateCommit;
  f.expected.root = tmpdir();
  f.save();
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /root does not match/);
  f.expected.root = f.root;
  f.save();
  writeFileSync(join(f.root, 'evidence/dispatch.json'), 'changed\n');
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /Evidence hash mismatch/);
  writeFileSync(join(f.root, 'evidence/dispatch.json'), '{"status":"pass"}\n');
  writeFileSync(f.tracePath, `${readFileSync(f.tracePath, 'utf8')} `);
  assert.throws(() => auditOutcomeTrace(f.expectedPath, f.tracePath, { cwd: f.root }), /Trace does not match parent-owned/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { preflight } from './preflight-dispatch.mjs';

const roots = [];
const packets = [];
function run(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'orchestrate-204-'));
  roots.push(root);
  mkdirSync(join(root, 'src'));
  mkdirSync(join(root, 'evidence'));
  run(root, 'init', '-b', 'worker/topic');
  run(root, 'config', 'user.name', 'Fixture');
  run(root, 'config', 'user.email', 'fixture@example.invalid');
  writeFileSync(join(root, 'src/change.txt'), 'before\n');
  writeFileSync(join(root, 'evidence/review.txt'), 'reviewed candidate details\n');
  run(root, 'add', '.');
  run(root, 'commit', '-m', 'fixture base');
  const earlier = run(root, 'rev-parse', 'HEAD');
  writeFileSync(join(root, 'src/assigned.txt'), 'dispatch base marker\n');
  run(root, 'add', 'src/assigned.txt');
  run(root, 'commit', '-m', 'recorded dispatch base');
  const base = run(root, 'rev-parse', 'HEAD');
  writeFileSync(join(root, 'src/change.txt'), 'after\n');
  run(root, 'add', 'src/change.txt');
  run(root, 'commit', '-m', 'fixture candidate');
  const head = run(root, 'rev-parse', 'HEAD');
  const evidenceBytes = readFileSync(join(root, 'evidence/review.txt'));
  const packet = {
    version: 1,
    root,
    branch: 'worker/topic',
    base,
    candidate: { kind: 'commit', sha: head },
    owner: 'worker-17',
    scope: ['src/'],
    evidence: [{ path: 'evidence/review.txt', sha256: createHash('sha256').update(evidenceBytes).digest('hex') }],
  };
  const packetPath = `${root}-packet.json`;
  packets.push(packetPath);
  const save = () => writeFileSync(packetPath, JSON.stringify(packet));
  save();
  return { root, earlier, base, head, packet, packetPath, save };
}

test('accepts a registered clean worktree with a scoped commit and exact evidence hash', () => {
  const f = fixture();
  const result = preflight(f.packetPath, { cwd: f.root, expectedBase: f.base });
  assert.equal(result.status, 'pass');
  assert.equal(result.root, realpathSync(f.root));
  assert.equal(result.candidate, f.head);
  assert.deepEqual(result.changed, ['src/change.txt']);
  assert.equal(result.evidence[0].sha256, f.packet.evidence[0].sha256);
});

test('accepts the explicit scoped branch-diff candidate form', () => {
  const f = fixture();
  f.packet.candidate = { kind: 'branch-diff', head: f.head };
  f.save();
  assert.equal(preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }).candidate, f.head);
});

test('rejects a packet for a different checkout root', () => {
  const f = fixture();
  f.packet.root = tmpdir();
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /root does not match/);
});

test('requires the trusted dispatch base as a separate input', () => {
  const f = fixture();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root }), /Supply the recorded expected base/);
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.earlier }), /recorded dispatch base/);
});

test('rejects stale base, candidate, branch, owner and evidence bindings', () => {
  const f = fixture();
  const original = structuredClone(f.packet);
  f.packet.base = f.earlier;
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /recorded dispatch base/);
  Object.assign(f.packet, original, { candidate: { kind: 'commit', sha: f.base } });
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /Candidate SHA does not match/);
  Object.assign(f.packet, original, { branch: 'worker/stale' });
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /Branch mismatch/);
  Object.assign(f.packet, original, { owner: '  ' });
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /needs an owner/);
  Object.assign(f.packet, original, { evidence: [] });
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /evidence bindings/);
  Object.assign(f.packet, original, { evidence: [{ ...original.evidence[0], sha256: '0'.repeat(64) }] });
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /Evidence hash mismatch/);
});

test('rejects changed paths outside the declared scope and dirty checkouts', () => {
  const f = fixture();
  f.packet.scope = ['other/'];
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /outside declared scope/);
  f.packet.scope = ['src/'];
  f.save();
  writeFileSync(join(f.root, 'extra.txt'), 'untracked\n');
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /uncommitted or untracked/);
});

test('rejects directories as evidence before reading bytes', () => {
  const f = fixture();
  f.packet.evidence = [{ path: 'evidence', sha256: '0'.repeat(64) }];
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /regular file/);
});

test('rejects arbitrary command fields in the packet', () => {
  const f = fixture();
  f.packet.commands = ['Remove-Item -Recurse'];
  f.save();
  assert.throws(() => preflight(f.packetPath, { cwd: f.root, expectedBase: f.base }), /unsupported fields/);
});

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  for (const packet of packets) rmSync(packet, { force: true });
});

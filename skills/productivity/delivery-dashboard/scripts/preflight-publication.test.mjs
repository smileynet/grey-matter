import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acceptReceipt, createReceipt } from './review-receipt.mjs';
import { preflightPublication } from './preflight-publication.mjs';

const roots = [];
const sidecars = [];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const helper = fileURLToPath(new URL('./preflight-publication.mjs', import.meta.url));

function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'dashboard-publish-205-'));
  roots.push(root);
  for (const dir of ['site', 'docs', 'evidence', '.scratch']) mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, '.gitignore'), '.scratch/\n');
  writeFileSync(join(root, 'site/index.html'), '<main>Committed site source</main>\n');
  writeFileSync(join(root, 'docs/status.html'), '<main>Reviewed dashboard render input</main>\n');
  writeFileSync(join(root, 'evidence/capture.bin'), Buffer.from([1, 2, 3, 4]));
  const manifest = {
    version: 1,
    subject: 'Dashboard publication fixture',
    sources: ['site', 'docs/status.html'],
    captures: [{ path: 'evidence/capture.bin', viewport: { width: 1000, height: 700 } }],
  };
  writeFileSync(join(root, 'review-manifest.json'), JSON.stringify(manifest));
  git(root, 'init', '-b', 'publication-fixture');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'candidate source and render inputs');

  const receipt = createReceipt(root, 'review-manifest.json', 'review-receipt.json');
  acceptReceipt(root, 'review-manifest.json', 'review-receipt.json', {
    expectedId: receipt.id,
    reviewer: 'independent-fixture-critic',
    note: 'Inspected committed source and synthetic capture bytes',
  });
  git(root, 'add', 'review-receipt.json');
  git(root, 'commit', '-m', 'record accepted review receipt');
  const candidateCommit = git(root, 'rev-parse', 'HEAD');

  const packageDir = join(root, '.scratch/package');
  mkdirSync(packageDir);
  writeFileSync(join(packageDir, 'index.html'), readFileSync(join(root, 'site/index.html')));
  const checkOutputPath = '.scratch/check-output.json';
  const checkOutput = Buffer.from('{"ok":true}\n');
  writeFileSync(join(root, checkOutputPath), checkOutput);
  const checksPath = '.scratch/check-attestation.json';
  const checks = {
    version: 1,
    candidateCommit,
    results: [{
      id: 'dashboard-contract',
      outcome: 'pass',
      candidateCommit,
      output: { path: checkOutputPath, sha256: hash(checkOutput) },
    }],
  };
  writeFileSync(join(root, checksPath), JSON.stringify(checks));

  const packet = {
    version: 1,
    root,
    candidateCommit,
    dashboard: { manifest: 'review-manifest.json', receipt: 'review-receipt.json' },
    package: { directory: '.scratch/package', files: [{ source: 'site/index.html', packaged: 'index.html' }] },
    checks: { attestation: checksPath },
  };
  const packetPath = `${root}-packet.json`;
  const expectedPath = `${root}-expected.json`;
  sidecars.push(packetPath, expectedPath);
  const savePacket = () => writeFileSync(packetPath, JSON.stringify(packet));
  const expected = {
    version: 1,
    root,
    candidateCommit,
    packetSha256: '',
    receiptId: receipt.id,
    checkAttestationSha256: hash(Buffer.from(JSON.stringify(checks))),
    requiredChecks: ['dashboard-contract'],
  };
  const saveExpected = () => {
    const packetBytes = readFileSync(packetPath);
    expected.packetSha256 = hash(packetBytes);
    writeFileSync(expectedPath, JSON.stringify(expected));
  };
  savePacket();
  saveExpected();
  return { root, receipt, candidateCommit, packet, packetPath, expected, expectedPath, savePacket, saveExpected, packageDir, checks, checksPath };
}

test('accepts the expected candidate, current receipt, passing check attestation and source-matched package', () => {
  const f = fixture();
  const result = preflightPublication(f.packetPath, f.expectedPath);
  assert.equal(result.status, 'pass');
  assert.equal(result.candidateCommit, f.candidateCommit);
  assert.equal(result.receiptId, f.receipt.id);
  assert.equal(result.package.files[0].sha256, hash(readFileSync(join(f.root, 'site/index.html'))));
  assert.equal(result.checksAreAttestations, true);
});

test('rejects a stale receipt when a reviewed rendering input changes', () => {
  const f = fixture();
  writeFileSync(join(f.root, 'docs/status.html'), '<main>Changed after review</main>\n');
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /source or captures changed/);
});

test('rejects a failed required check bound to the same candidate and output bytes', () => {
  const f = fixture();
  f.checks.results[0].outcome = 'failed';
  writeFileSync(join(f.root, f.checksPath), JSON.stringify(f.checks));
  f.expected.checkAttestationSha256 = hash(readFileSync(join(f.root, f.checksPath)));
  f.saveExpected();
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /outcome is failed/);
});

test('rejects packaged assets whose bytes differ from the committed site source', () => {
  const f = fixture();
  writeFileSync(join(f.packageDir, 'index.html'), '<main>Different package payload</main>\n');
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /differs from committed source/);
});

test('rejects unexpected files in the packaged asset directory', () => {
  const f = fixture();
  writeFileSync(join(f.packageDir, 'extra.js'), 'unexpected\n');
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /inventory does not match/);
});

test('rejects a packet or expected identity changed after parent binding', () => {
  const f = fixture();
  f.packet.package.files[0].source = 'docs/status.html';
  f.savePacket();
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /Packet does not match parent-owned expected identity/);
  f.saveExpected();
  f.expected.candidateCommit = '0'.repeat(40);
  f.saveExpected();
  assert.throws(() => preflightPublication(f.packetPath, f.expectedPath), /Current HEAD does not match/);
});

test('CLI emits a bounded result for the exact parent identity and rejects command fields', () => {
  const f = fixture();
  const packetHash = spawnSync(process.execPath, [helper, '--hash-file', f.packetPath], { encoding: 'utf8' });
  assert.equal(packetHash.status, 0, packetHash.stderr);
  assert.equal(JSON.parse(packetHash.stdout).sha256, hash(readFileSync(f.packetPath)));
  const result = spawnSync(process.execPath, [helper, f.expectedPath, f.packetPath], { cwd: f.root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).candidateCommit, f.candidateCommit);
  f.packet.commands = ['publish --audience public'];
  f.savePacket();
  f.saveExpected();
  const rejected = spawnSync(process.execPath, [helper, f.expectedPath, f.packetPath], { cwd: f.root, encoding: 'utf8' });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /Unsupported publication packet fields/);
});

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  for (const path of sidecars) rmSync(path, { force: true });
});

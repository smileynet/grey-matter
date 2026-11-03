#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkReceipt } from './review-receipt.mjs';

const MAX_FILES = 1000;
const MAX_FILE_BYTES = 32 * 1024 * 1024;
const MAX_PACKAGE_BYTES = 128 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

function demand(ok, message) {
  if (!ok) throw new Error(message);
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function git(root, args, binary = false) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: binary ? null : 'utf8',
    maxBuffer: MAX_FILE_BYTES + 1,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function keys(value, allowed, label) {
  demand(object(value) && Object.keys(value).every(key => allowed.includes(key)), `Unsupported ${label} fields`);
}

function readRegularBytes(path, label, maxBytes) {
  const stat = lstatSync(path);
  demand(stat.isFile() && !stat.isSymbolicLink(), `${label} must be a regular file`);
  demand(stat.size <= maxBytes, `${label} exceeds ${maxBytes} bytes`);
  return readFileSync(path);
}

function readJson(path, label) {
  const bytes = readRegularBytes(path, label, MAX_JSON_BYTES);
  return { bytes, value: JSON.parse(bytes.toString('utf8')) };
}

function safePath(root, value, label) {
  demand(typeof value === 'string' && value.length > 0 && !isAbsolute(value)
    && !value.includes('\\') && !/[\u0000-\u001f]/.test(value),
  `${label} must be a safe relative path using forward slashes`);
  const parts = value.split('/');
  demand(parts.every(part => part && part !== '.' && part !== '..'), `${label} has an invalid path component`);
  const full = resolve(root, ...parts);
  const name = relative(root, full);
  demand(name !== '..' && !name.startsWith(`..${sep}`) && !isAbsolute(name), `${label} escapes root`);
  let cursor = root;
  for (const part of name.split(sep)) {
    cursor = resolve(cursor, part);
    try {
      demand(!lstatSync(cursor).isSymbolicLink(), `${label} cannot traverse symlinks`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      break;
    }
  }
  return { full, name: name.split(sep).join('/') };
}

function validatePacket(packet) {
  keys(packet, ['version', 'root', 'candidateCommit', 'dashboard', 'package', 'checks'], 'publication packet');
  demand(packet.version === 1, 'Expected publication packet version 1');
  demand(typeof packet.root === 'string' && packet.root.length > 0, 'Packet needs repository root');
  demand(typeof packet.candidateCommit === 'string' && /^[0-9a-f]{40,64}$/i.test(packet.candidateCommit), 'Packet needs a full candidate commit SHA');
  keys(packet.dashboard, ['manifest', 'receipt'], 'dashboard');
  demand(typeof packet.dashboard.manifest === 'string' && typeof packet.dashboard.receipt === 'string', 'Dashboard packet needs manifest and receipt paths');
  keys(packet.package, ['directory', 'files'], 'package');
  demand(typeof packet.package.directory === 'string' && Array.isArray(packet.package.files) && packet.package.files.length > 0, 'Package needs a directory and source-to-package file map');
  for (const row of packet.package.files) {
    keys(row, ['source', 'packaged'], 'package file');
    demand(typeof row.source === 'string' && typeof row.packaged === 'string', 'Package files need source and packaged paths');
  }
  keys(packet.checks, ['attestation'], 'checks');
  demand(typeof packet.checks.attestation === 'string', 'Packet needs a check attestation path');
}

function validateExpected(expected) {
  keys(expected, ['version', 'root', 'candidateCommit', 'packetSha256', 'receiptId', 'checkAttestationSha256', 'requiredChecks'], 'expected identity');
  demand(expected.version === 1, 'Expected identity version must be 1');
  demand(typeof expected.root === 'string' && typeof expected.candidateCommit === 'string', 'Expected identity needs root and candidate commit');
  demand(/^[0-9a-f]{40,64}$/i.test(expected.candidateCommit), 'Expected candidate must be a full commit SHA');
  for (const field of ['packetSha256', 'receiptId', 'checkAttestationSha256']) {
    demand(typeof expected[field] === 'string' && /^[0-9a-f]{64}$/i.test(expected[field]), `Expected identity needs ${field}`);
  }
  demand(Array.isArray(expected.requiredChecks) && expected.requiredChecks.length > 0
    && expected.requiredChecks.every(id => typeof id === 'string' && id.trim()), 'Expected identity needs required check IDs');
  demand(new Set(expected.requiredChecks).size === expected.requiredChecks.length, 'Required check IDs must be unique');
}

function collectPackageFiles(root) {
  const files = [];
  let totalBytes = 0;
  function visit(dir, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const file = resolve(dir, entry.name);
      const stat = lstatSync(file);
      demand(!stat.isSymbolicLink(), `Package cannot contain symlinks: ${path}`);
      if (stat.isDirectory()) visit(file, path);
      else {
        demand(stat.isFile(), `Package entry must be a regular file: ${path}`);
        demand(stat.size <= MAX_FILE_BYTES, `Package file exceeds ${MAX_FILE_BYTES} bytes: ${path}`);
        totalBytes += stat.size;
        demand(totalBytes <= MAX_PACKAGE_BYTES, `Package exceeds ${MAX_PACKAGE_BYTES} bytes`);
        files.push({ path, full: file, bytes: stat.size });
        demand(files.length <= MAX_FILES, `Package exceeds ${MAX_FILES} files`);
      }
    }
  }
  visit(root);
  return files;
}

function checkPackage(root, commit, packageSpec, receipt) {
  const packageDir = safePath(root, packageSpec.directory, 'Package directory');
  demand(lstatSync(packageDir.full).isDirectory(), 'Package path must be a directory');
  const actual = collectPackageFiles(packageDir.full);
  const mapped = packageSpec.files.map(row => {
    const source = safePath(root, row.source, 'Package source');
    const packaged = safePath(packageDir.full, row.packaged, 'Packaged asset');
    return { source: source.name, packaged: packaged.name, full: packaged.full };
  });
  demand(new Set(mapped.map(row => row.source)).size === mapped.length, 'Package source paths must be unique');
  demand(new Set(mapped.map(row => row.packaged)).size === mapped.length, 'Packaged paths must be unique');
  demand(actual.length === mapped.length, 'Package inventory does not match the declared source map');

  const sourcePaths = new Set(receipt.source.filter(row => row.projection === null).map(row => row.path));
  const rows = mapped.map(row => {
    demand(sourcePaths.has(row.source), `Review receipt does not bind package source: ${row.source}`);
    const asset = actual.find(file => file.path === row.packaged);
    demand(asset, `Packaged asset is missing: ${row.packaged}`);
    const sourceBytes = git(root, ['show', `${commit}:${row.source}`], true);
    demand(sourceBytes.length <= MAX_FILE_BYTES, `Committed source exceeds ${MAX_FILE_BYTES} bytes: ${row.source}`);
    const packageBytes = readFileSync(asset.full);
    const sourceHash = digest(sourceBytes);
    const packageHash = digest(packageBytes);
    demand(sourceHash === packageHash && sourceBytes.equals(packageBytes), `Packaged asset differs from committed source: ${row.packaged}`);
    return { source: row.source, path: row.packaged, bytes: packageBytes.length, sha256: packageHash };
  }).sort((a, b) => a.path.localeCompare(b.path));
  return { files: rows, digest: digest(Buffer.from(JSON.stringify(rows))) };
}

function checkAttestations(root, checksPath, expected, commit) {
  const checksFile = safePath(root, checksPath, 'Check attestation');
  demand(lstatSync(checksFile.full).isFile(), 'Check attestation must be a regular file');
  const { bytes, value } = readJson(checksFile.full, 'Check attestation');
  demand(digest(bytes) === expected.checkAttestationSha256.toLowerCase(), 'Check attestation hash does not match expected identity');
  keys(value, ['version', 'candidateCommit', 'results'], 'check attestation');
  demand(value.version === 1 && value.candidateCommit === commit, 'Check attestation candidate does not match expected commit');
  demand(Array.isArray(value.results), 'Check attestation needs results');
  const seen = new Set();
  const results = value.results.map(row => {
    keys(row, ['id', 'outcome', 'candidateCommit', 'output'], 'check result');
    demand(typeof row.id === 'string' && !seen.has(row.id), 'Check IDs must be unique');
    seen.add(row.id);
    demand(row.candidateCommit === commit, `Check ${row.id} is bound to a different candidate`);
    demand(row.outcome === 'pass', `Required check ${row.id} outcome is ${row.outcome}; expected pass`);
    keys(row.output, ['path', 'sha256'], 'check output');
    demand(typeof row.output.path === 'string' && /^[0-9a-f]{64}$/i.test(row.output.sha256 ?? ''), `Check ${row.id} needs output path and SHA-256`);
    const output = safePath(root, row.output.path, `Check ${row.id} output`);
    demand(lstatSync(output.full).isFile(), `Check output must be a regular file: ${row.output.path}`);
    const outputBytes = readRegularBytes(output.full, `Check ${row.id} output`, MAX_FILE_BYTES);
    const outputSha256 = digest(outputBytes);
    demand(outputSha256 === row.output.sha256.toLowerCase(), `Check output hash mismatch: ${row.output.path}`);
    return { id: row.id, outcome: row.outcome, candidateCommit: row.candidateCommit, output: { path: output.name, sha256: outputSha256, bytes: outputBytes.length } };
  });
  for (const id of expected.requiredChecks) demand(seen.has(id), `Required check is missing: ${id}`);
  return results;
}

export function preflightPublication(packetPath, expectedPath) {
  const packetFile = readRegularBytes(packetPath, 'Publication packet', MAX_JSON_BYTES);
  const expectedFile = readJson(expectedPath, 'Expected identity');
  const packet = JSON.parse(packetFile.toString('utf8'));
  const expected = expectedFile.value;
  validatePacket(packet);
  validateExpected(expected);
  demand(digest(packetFile) === expected.packetSha256.toLowerCase(), 'Packet does not match parent-owned expected identity');

  const root = realpathSync(packet.root);
  demand(root === realpathSync(expected.root), 'Packet root does not match expected repository root');
  demand(realpathSync(git(root, ['rev-parse', '--show-toplevel']).trim()) === root, 'Packet root is not the Git repository root');
  const commit = git(root, ['rev-parse', 'HEAD']).trim();
  demand(commit === packet.candidateCommit && commit === expected.candidateCommit, 'Current HEAD does not match the expected candidate commit');

  const receipt = checkReceipt(root, packet.dashboard.manifest, packet.dashboard.receipt);
  demand(receipt.id === expected.receiptId, 'Current accepted receipt does not match expected receipt ID');
  const packageResult = checkPackage(root, commit, packet.package, receipt);
  const checks = checkAttestations(root, packet.checks.attestation, expected, commit);

  const trackedChanges = spawnSync('git', ['-C', root, 'diff', '--quiet', 'HEAD', '--'], { stdio: 'ignore' });
  demand(trackedChanges.status === 0, 'Tracked working-tree or index files differ from candidate commit');
  return {
    status: 'pass',
    root,
    candidateCommit: commit,
    receiptId: receipt.id,
    package: packageResult,
    checks: checks.map(({ id, outcome, output }) => ({ id, outcome, output })),
    checksAreAttestations: true,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv[2] === '--hash-file') {
      demand(process.argv.length === 4, 'Usage: node preflight-publication.mjs --hash-file FILE');
      const bytes = readRegularBytes(process.argv[3], 'Hash input', MAX_JSON_BYTES);
      console.log(JSON.stringify({ path: resolve(process.argv[3]), bytes: bytes.length, sha256: digest(bytes) }));
    } else {
      demand(process.argv.length === 4, 'Usage: node preflight-publication.mjs EXPECTED-IDENTITY.json PACKET.json');
      console.log(JSON.stringify(preflightPublication(process.argv[3], process.argv[2]), null, 2));
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

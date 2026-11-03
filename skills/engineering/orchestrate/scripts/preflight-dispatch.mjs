#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function demand(ok, message) {
  if (!ok) throw new Error(message);
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeRelative(root, value, label) {
  demand(typeof value === 'string' && value.length > 0 && !isAbsolute(value),
    `${label} must be a nonempty relative path`);
  const full = resolve(root, value);
  const name = relative(root, full);
  demand(name !== '..' && !name.startsWith(`..${sep}`) && !isAbsolute(name),
    `${label} escapes repository root`);
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
  const keys = ['version', 'root', 'branch', 'base', 'candidate', 'owner', 'scope', 'evidence'];
  demand(object(packet) && Object.keys(packet).every(key => keys.includes(key)), 'Packet has unsupported fields');
  demand(packet.version === 1, 'Expected packet version 1');
  demand(typeof packet.root === 'string' && packet.root.length > 0, 'Packet needs root');
  demand(typeof packet.branch === 'string' && packet.branch.length > 0, 'Packet needs branch');
  demand(typeof packet.base === 'string' && /^[0-9a-f]{40,64}$/i.test(packet.base),
    'Packet needs a full base commit SHA');
  demand(typeof packet.owner === 'string' && packet.owner.trim().length > 0, 'Packet needs an owner');
  demand(Array.isArray(packet.scope) && packet.scope.length > 0
    && packet.scope.every(path => typeof path === 'string' && path.length > 0),
  'Packet needs scoped relative paths');
  demand(Array.isArray(packet.evidence) && packet.evidence.length > 0, 'Packet needs evidence bindings');
  demand(object(packet.candidate) && ['commit', 'branch-diff'].includes(packet.candidate.kind), 'Candidate kind must be commit or branch-diff');
  const candidateKeys = packet.candidate.kind === 'commit' ? ['kind', 'sha'] : ['kind', 'head'];
  demand(Object.keys(packet.candidate).every(key => candidateKeys.includes(key)), 'Candidate has unsupported fields');
  const candidateSha = packet.candidate.sha ?? packet.candidate.head;
  demand(typeof candidateSha === 'string' && /^[0-9a-f]{40,64}$/i.test(candidateSha),
    'Candidate needs a full commit SHA');
  for (const row of packet.evidence) {
    demand(object(row) && Object.keys(row).every(key => ['path', 'sha256'].includes(key)), 'Evidence entry has unsupported fields');
    demand(typeof row.path === 'string' && /^[0-9a-f]{64}$/i.test(row.sha256 ?? ''), 'Evidence needs a relative path and SHA-256');
  }
  return candidateSha;
}

export function preflight(packetPath, cwd = process.cwd()) {
  const root = realpathSync(git(cwd, ['rev-parse', '--show-toplevel']));
  const packetFile = realpathSync(packetPath);
  const packet = JSON.parse(readFileSync(packetFile, 'utf8'));
  const candidateSha = validatePacket(packet);
  demand(realpathSync(packet.root) === root, 'Packet root does not match current checkout root');

  const worktrees = git(root, ['worktree', 'list', '--porcelain']).split(/\r?\n\r?\n/);
  const registered = worktrees.some(entry => {
    const path = entry.split(/\r?\n/).find(line => line.startsWith('worktree '))?.slice(9);
    return path && realpathSync(path) === root;
  });
  demand(registered, 'Current checkout is not a registered Git worktree');

  const branch = git(root, ['branch', '--show-current']);
  demand(branch === packet.branch, `Branch mismatch: expected ${packet.branch}, found ${branch || '(detached)'}`);
  const head = git(root, ['rev-parse', 'HEAD']);
  demand(candidateSha === head, 'Candidate SHA does not match current HEAD');
  const base = git(root, ['rev-parse', '--verify', `${packet.base}^{commit}`]);
  demand(base === packet.base, 'Base SHA did not resolve to the expected commit');
  const ancestry = spawnSync('git', ['-C', root, 'merge-base', '--is-ancestor', base, head], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  demand(ancestry.status === 0, 'Base is not an ancestor of candidate');

  const status = git(root, ['status', '--porcelain=v1', '--untracked-files=all']);
  demand(status.length === 0, 'Checkout has uncommitted or untracked files');

  const scope = packet.scope.map(path => safeRelative(root, path, 'Scope path').name);
  demand(scope.every(path => path.length > 0), 'Scope cannot include the repository root');
  demand(new Set(scope).size === scope.length, 'Scope paths must be unique');
  const changed = git(root, ['diff', '--name-only', '--no-renames', `${base}..${head}`]).split(/\r?\n/).filter(Boolean);
  demand(changed.length > 0, 'Candidate has no committed changes from base');
  for (const path of changed) {
    demand(scope.some(owned => path === owned || path.startsWith(`${owned.replace(/\/$/, '')}/`)),
      `Changed path is outside declared scope: ${path}`);
  }

  const evidence = packet.evidence.map(({ path, sha256 }) => {
    const file = safeRelative(root, path, 'Evidence path');
    const bytes = readFileSync(file.full);
    const actual = createHash('sha256').update(bytes).digest('hex');
    demand(actual === sha256.toLowerCase(), `Evidence hash mismatch: ${file.name}`);
    return { path: file.name, sha256: actual, bytes: bytes.length };
  });
  return { status: 'pass', root, branch, base, candidate: head, owner: packet.owner, changed, evidence };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    demand(process.argv.length === 3, 'Usage: node preflight-dispatch.mjs PACKET.json');
    console.log(JSON.stringify(preflight(process.argv[2]), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

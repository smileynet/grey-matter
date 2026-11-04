#!/usr/bin/env node
// Read-only inventory of local/cached refs against an explicit integration base.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function git(repo, args, input) {
  const result = spawnSync('git', ['--no-lazy-fetch', '--no-optional-locks', '-C', repo, ...args], {
    input, encoding: null, maxBuffer: 32 * 1024 * 1024, timeout: 30000,
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || `git ${args[0]} failed`);
  return result.stdout;
}

function text(repo, args) { return git(repo, args).toString('utf8').trim(); }

function attributesFor(repo, ref, paths) {
  if (!paths.length) return [];
  const attributes = git(repo, ['check-attr', '-z', `--source=${ref}`, 'filter', '--stdin'],
    Buffer.from(paths.join(String.fromCharCode(0)) + String.fromCharCode(0))).toString('utf8').split(String.fromCharCode(0));
  const byPath = new Map();
  for (let i = 0; i + 2 < attributes.length; i += 3) {
    const [path, , filter] = attributes.slice(i, i + 3);
    if (path) byPath.set(path, filter);
  }
  return byPath;
}

function lfsFindings(repo, base, ref, paths) {
  const targetAttributes = attributesFor(repo, base, paths);
  const candidateAttributes = attributesFor(repo, ref, paths);
  const findings = [];
  for (const path of paths) {
    const targetFilter = targetAttributes.get(path);
    const candidateFilter = candidateAttributes.get(path);
    if (targetFilter !== 'lfs' && candidateFilter !== 'lfs') continue;
    if (targetFilter === 'lfs' && candidateFilter !== 'lfs') {
      findings.push({ path, reason: 'candidate-removes-target-lfs-rule' });
      continue;
    }
    const object = text(repo, ['rev-parse', '--verify', `${ref}:${path}`]);
    const bytes = git(repo, ['cat-file', 'blob', object]);
    const lines = bytes.toString('utf8').split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
    const oidIndex = lines.findIndex(line => line.startsWith('oid sha256:'));
    const sizeIndex = oidIndex + 1;
    if (lines[0] !== 'version https://git-lfs.github.com/spec/v1' || oidIndex < 1 || !/^oid sha256:[a-f0-9]{64}$/.test(lines[oidIndex]) || !/^size \d+$/.test(lines[sizeIndex]) || sizeIndex !== lines.length - 1 || lines.slice(1, oidIndex).some(line => !/^ext-[^\s]+ .+$/.test(line))) {
      findings.push({ path, reason: candidateFilter === 'lfs' ? 'lfs-rule-without-pointer' : 'new-lfs-rule-without-pointer' });
    }
  }
  return findings;
}

export function planWorktreeTakeover({ repo, base, supersededBy = {} }) {
  const root = text(repo, ['rev-parse', '--show-toplevel']);
  const baseSha = text(repo, ['rev-parse', '--verify', `${base}^{commit}`]);
  const newline = String.fromCharCode(10);
  const worktrees = text(repo, ['worktree', 'list', '--porcelain']).split(newline + newline).filter(Boolean).map(block => {
    const values = Object.fromEntries(block.split(newline).map(line => {
      const index = line.indexOf(' ');
      return index < 0 ? [line, true] : [line.slice(0, index), line.slice(index + 1)];
    }));
    return { path: values.worktree, head: values.HEAD, branch: values.branch ?? null, detached: Boolean(values.detached), locked: Boolean(values.locked), prunable: Boolean(values.prunable) };
  });
  const refs = text(repo, ['for-each-ref', '--format=%(refname)%00%(objectname)', 'refs/heads', 'refs/remotes'])
    .split(newline).filter(Boolean).map(line => {
      const [name, sha] = line.split(String.fromCharCode(0));
      return { name, sha };
    });
  const branches = refs.map(({ name, sha }) => {
    const based = spawnSync('git', ['--no-lazy-fetch', '--no-optional-locks', '-C', repo,
      'merge-base', '--is-ancestor', baseSha, name], { timeout: 30000, env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0' } });
    if (based.error) throw based.error;
    if (based.status > 1) throw new Error(`Could not verify base ancestry for ${name}: ${based.stderr?.toString().trim() || baseSha}`);
    const baseIsAncestor = based.status === 0;
    const cherry = text(repo, ['cherry', '-v', baseSha, name]);
    const uniqueCommits = cherry.split(newline).filter(line => line.startsWith('+ ')).map(line => line.slice(2, 42));
    const equivalentCommits = cherry.split(newline).filter(line => line.startsWith('- ')).map(line => line.slice(2, 42));
    const changedPaths = git(repo, ['diff', '--diff-filter=ACMRT', '--name-only', '-z', `${baseSha}..${name}`]).toString('utf8').split(String.fromCharCode(0)).filter(Boolean);
    if (changedPaths.some(path => path === '.gitattributes' || path.endsWith('/.gitattributes'))) {
      const treePaths = git(repo, ['ls-tree', '-r', '--name-only', '-z', name]).toString('utf8').split(String.fromCharCode(0)).filter(Boolean);
      changedPaths.push(...treePaths);
    }
    const lfsPaths = [...new Set(changedPaths)];
    const lfsBreaking = lfsFindings(repo, baseSha, name, lfsPaths);
    const mergeCommits = text(repo, ['rev-list', '--min-parents=2', `${baseSha}..${name}`]).split(newline).filter(Boolean);
    const replacement = supersededBy[name];
    let superseded = false;
    if (replacement) {
      const ancestor = spawnSync('git', ['--no-lazy-fetch', '--no-optional-locks', '-C', repo,
        'merge-base', '--is-ancestor', name, replacement], { timeout: 30000, env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0' } });
      if (ancestor.error) throw ancestor.error;
      if (ancestor.status > 1) throw new Error(`Could not verify supersession: ${ancestor.stderr?.toString().trim() || replacement}`);
      superseded = ancestor.status === 0;
    }
    return {
      ref: name, sha,
      classification: superseded ? 'superseded' : mergeCommits.length ? 'unknown-merge-history' : uniqueCommits.length && !baseIsAncestor ? 'unknown-divergent-base' : uniqueCommits.length ? (lfsBreaking.length ? 'unique-lfs-breaking' : 'unique') : 'landed',
      replacement: superseded ? replacement : null,
      supersessionEvidence: superseded ? 'replacement-contains-source-commit' : replacement ? 'unverified' : null,
      baseIsAncestor, uniqueCommits, patchEquivalentCommits: equivalentCommits,
      mergeCommits,
      lfsBreakingPaths: lfsBreaking,
      checkoutBindings: worktrees.filter(worktree => worktree.branch === name).map(({ path, head, locked, prunable }) => ({ path, head, locked, prunable }))
    };
  });
  return { version: 1, mode: 'read-only', repository: root, base: { ref: base, sha: baseSha }, refCoverage: 'local and cached remote refs; no fetch performed', worktrees, branches };
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i + 1];
    if (!['--repo', '--base', '--superseded'].includes(key) || !value || options[key]) throw new Error(`Invalid or repeated option: ${key}`);
    options[key] = value;
  }
  if (!options['--repo'] || !options['--base']) throw new Error('Usage: plan-worktree-takeover.mjs --repo PATH --base REF [--superseded JSON]');
  const supersededBy = options['--superseded'] ? JSON.parse(readFileSync(options['--superseded'], 'utf8')) : {};
  if (!supersededBy || typeof supersededBy !== 'object' || Array.isArray(supersededBy)) throw new Error('--superseded must be a JSON object mapping full candidate refs to replacement refs');
  return { repo: resolve(options['--repo']), base: options['--base'], supersededBy };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.stdout.write(`${JSON.stringify(planWorktreeTakeover(parseArgs(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
}

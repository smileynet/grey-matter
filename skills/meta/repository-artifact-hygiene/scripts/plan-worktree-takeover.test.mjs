import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import '../../../../scripts/test-git-env.mjs';
import { planWorktreeTakeover } from './plan-worktree-takeover.mjs';

test('classifies landed, unique, superseded, LFS-breaking and uncertain merge refs without changing refs', () => {
const root = mkdtempSync(join(resolve('.scratch/t148'), 'fixture-'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env: {
  ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid'
} }).trim();
const write = (path, content) => {
  const full = join(root, path);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
};
const commit = message => { git('add', '-A'); git('commit', '-m', message); };

  git('init', '-b', 'main');
  write('.gitattributes', '*.png filter=lfs diff=lfs merge=lfs -text' + String.fromCharCode(10));
  commit('base');
  write('images/source.png', `version https://git-lfs.github.com/spec/v1${String.fromCharCode(10)}oid sha256:${'a'.repeat(64)}${String.fromCharCode(10)}size 5${String.fromCharCode(10)}`);
  commit('base lfs pointer');
  const base = git('rev-parse', 'HEAD');
  write('landed.txt', 'same patch');
  commit('landed on main');
  git('checkout', '--orphan', 'landed-copy');
  git('reset', '--hard', base);
  write('landed.txt', 'same patch');
  commit('patch-equivalent');
  git('switch', '-c', 'divergent');
  write('divergent.txt', 'unique on unrelated history');
  commit('divergent unique');
  git('checkout', 'main');
  git('switch', '-c', 'unique');
  write('unfinished.txt', 'needed source');
  commit('unique source');
  const uniqueSha = git('rev-parse', 'HEAD');
  git('switch', '-c', 'replacement');
  write('replacement.txt', 'newer work');
  commit('replacement');
  git('checkout', 'main');
  git('switch', '-c', 'lfs-raw');
  write('images/source.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01]));
  commit('raw image under lfs rule');
  git('switch', '-c', 'lfs-delete');
  git('rm', 'images/source.png');
  commit('delete image');
  git('checkout', 'main');
  git('switch', '-c', 'lfs-pointer');
  write('images/source.png', `version https://git-lfs.github.com/spec/v1${String.fromCharCode(10)}ext-1-fixture value${String.fromCharCode(10)}oid sha256:${'b'.repeat(64)}${String.fromCharCode(10)}size 6${String.fromCharCode(10)}`);
  commit('valid lfs pointer');
  git('checkout', 'main');
  git('switch', '-c', 'lfs-rule-removed');
  write('.gitattributes', '');
  commit('remove target lfs rule');
  git('checkout', 'main');
  git('switch', '-c', 'merge-source');
  write('merge-source.txt', 'unique merge source');
  commit('merge source');
  git('checkout', 'main');
  git('switch', '-c', 'merge-only');
  git('merge', '--no-ff', 'merge-source', '-m', 'merge only');
  const refsBefore = git('for-each-ref', '--format=%(refname) %(objectname)');
  const plan = planWorktreeTakeover({
    repo: root, base: 'main', supersededBy: {
      'refs/heads/unique': 'refs/heads/replacement',
      'refs/heads/replacement': 'refs/heads/main'
    }
  });
  const refsAfter = git('for-each-ref', '--format=%(refname) %(objectname)');
  const byName = name => plan.branches.find(item => item.ref === `refs/heads/${name}`);
  assert.equal(byName('landed-copy').classification, 'landed');
  assert.equal(byName('divergent').classification, 'unknown-divergent-base');
  assert.equal(byName('unique').classification, 'superseded');
  assert.equal(byName('unique').replacement, 'refs/heads/replacement');
  assert.equal(byName('replacement').classification, 'unique');
  assert.equal(byName('replacement').supersessionEvidence, 'unverified');
  assert.equal(byName('lfs-raw').classification, 'unique-lfs-breaking');
  assert.deepEqual(byName('lfs-raw').lfsBreakingPaths, [{ path: 'images/source.png', reason: 'lfs-rule-without-pointer' }]);
  assert.deepEqual(byName('lfs-rule-removed').lfsBreakingPaths, [{ path: 'images/source.png', reason: 'candidate-removes-target-lfs-rule' }]);
  assert.equal(byName('lfs-delete').lfsBreakingPaths.length, 0);
  assert.equal(byName('lfs-pointer').lfsBreakingPaths.length, 0);
  assert.equal(byName('merge-only').classification, 'unknown-merge-history');
  assert.equal(byName('main').classification, 'landed');
  assert.equal(byName('unique').sha, uniqueSha);
  assert.equal(plan.mode, 'read-only');
  assert.match(plan.refCoverage, /no fetch/);
  assert.equal(refsAfter, refsBefore, 'planning must leave Git refs unchanged');
  process.stdout.write('PASS: patch-equivalent, unique, evidenced superseded, LFS-breaking, and read-only classifications\n');
});

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { classifyCheckoutConcurrency } from './classify-checkout-concurrency.mjs';

function git(cwd, ...args) {
  const globalConfig = join(cwd, '.fixture-gitconfig');
  if (!existsSync(globalConfig)) writeFileSync(globalConfig, '');
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: globalConfig } }).trim();
}

test('classifies real local dirt as unknown liveness and a bound active writer as shared checkout', () => {
  const root = mkdtempSync(join(tmpdir(), 'orient-concurrency-'));
  try {
    git(root, 'init', '-b', 'main');
    git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'base');
    writeFileSync(join(root, 'work.md'), 'local edit');
    const dirty = git(root, 'status', '--short');
    const unknown = classifyCheckoutConcurrency({ checkout: root, branch: 'main', status: dirty });
    assert.equal(unknown.classification, 'liveness-unknown');
    const writer = classifyCheckoutConcurrency({ checkout: root, branch: 'main', status: dirty,
      binding: { active: true, writing: true, checkout: process.platform === 'win32' ? root.toLowerCase() : root, branch: 'main' } });
    assert.equal(writer.classification, 'shared-checkout-writer');
    assert.deepEqual(writer.responses, ['isolate-overlapping-local-edits']);
    const both = classifyCheckoutConcurrency({ checkout: root, branch: 'main', status: dirty, upstream: '## main...origin/main [ahead 1, behind 2]',
      binding: { active: true, writing: true, checkout: root, branch: 'main' } });
    assert.equal(both.classification, 'shared-checkout-writer+remote-advanced');
    assert.deepEqual(both.responses, ['isolate-overlapping-local-edits', 'reconcile-upstream']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('classifies an observed tracking ref behind its remote as remote advanced', () => {
  const root = mkdtempSync(join(tmpdir(), 'orient-remote-'));
  const bare = join(root, 'remote.git');
  const local = join(root, 'local');
  const peer = join(root, 'peer');
  try {
    git(root, 'init', '--bare', '--initial-branch=main', bare);
    git(root, 'clone', '-q', bare, local);
    git(local, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'base');
    git(local, 'push', '-u', 'origin', 'HEAD:main');
    git(local, 'branch', '-M', 'main');
    git(local, 'push', '-u', 'origin', 'main');
    git(root, 'clone', '-q', '--branch', 'main', bare, peer);
    git(peer, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'remote advance');
    git(peer, 'push', 'origin', 'main');
    git(local, 'fetch', 'origin');
    const upstream = git(local, 'status', '-sb');
    const result = classifyCheckoutConcurrency({ checkout: local, branch: 'main', upstream });
    assert.equal(result.classification, 'remote-advanced');
    assert.deepEqual(result.responses, ['reconcile-upstream']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('rejects malformed identity evidence', () => {
  assert.throws(() => classifyCheckoutConcurrency({ checkout: '', branch: 'main' }), /required/);
  assert.throws(() => classifyCheckoutConcurrency({ checkout: 'x', branch: 'main', status: {} }), /text/);
  assert.throws(() => classifyCheckoutConcurrency({ checkout: 'x', branch: 'main', binding: {} }), /binding/);
  assert.equal(classifyCheckoutConcurrency({ checkout: 'x', branch: 'main', upstream: '## main\n?? note[behind 2].txt' }).classification, 'liveness-unknown');
});

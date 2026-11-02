import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("fixtures can commit and annotate tags despite hostile global signing, hooks and editor", () => {
  const root = mkdtempSync(join(tmpdir(), "git-isolation-"));
  const config = join(root, "hostile.gitconfig");
  const module = new URL("./test-git-env.mjs", import.meta.url).href;
  const program = `
    import assert from 'node:assert/strict';
    import { execFileSync, spawnSync } from 'node:child_process';
    const git = (...args) => execFileSync('git', args, { stdio: 'pipe', timeout: 5000 });
    git('init', '-q');
    git('commit', '--allow-empty', '-qm', 'fixture');
    git('tag', '-a', 'v1', '-m', 'fixture');
    assert.match(git('var', 'GIT_AUTHOR_IDENT').toString(), /^Fixture <fixture@example.invalid>/);
    for (const key of ['core.hooksPath', 'core.editor']) {
      assert.equal(spawnSync('git', ['config', '--get', key]).status, 1);
    }
  `;
  try {
    writeFileSync(config, '[commit]\n gpgSign = true\n[tag]\n gpgSign = true\n forceSignAnnotated = true\n[gpg]\n format = ssh\n[gpg "ssh"]\n program = missing-fixture-signer\n[user]\n name = Control\n email = control@example.invalid\n signingKey = missing-fixture-key\n[core]\n hooksPath = missing-fixture-hooks\n editor = missing-fixture-editor\n');
    const run = (name, source) => {
      const cwd = join(root, name); mkdirSync(cwd);
      return spawnSync(process.execPath, ["--input-type=module", "-e", source], {
        cwd, encoding: "utf8", timeout: 15000,
        env: { ...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: "1" },
      });
    };
    const control = run("control", program);
    assert.notEqual(control.status, 0, "the hostile signing control must fail");
    assert.match(control.stderr, /missing-fixture-signer|missing-fixture-key/);
    const isolated = run("isolated", `import ${JSON.stringify(module)};\n${program}`);
    assert.equal(isolated.status, 0, isolated.stderr);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

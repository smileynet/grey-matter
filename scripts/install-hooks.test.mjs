import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const source = dirname(dirname(fileURLToPath(import.meta.url)));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "gm-hooks-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, "repo");
  mkdirSync(join(repo, "scripts/hooks"), { recursive: true });
  mkdirSync(join(repo, ".githooks"));
  for (const file of ["scripts/install-hooks.mjs", "scripts/hooks/pre-commit", ".githooks/pre-push"])
    copyFileSync(join(source, file), join(repo, file));
  const git = (...args) => spawnSync("git", ["-C", repo, ...args], { encoding: "utf8" });
  const ok = (r) => { assert.equal(r.status, 0, r.stdout + r.stderr); return r.stdout.trim(); };
  ok(git("init", "-q"));
  ok(git("config", "user.name", "fixture"));
  ok(git("config", "user.email", "fixture@example.test"));
  ok(git("config", "core.hooksPath", ".git/hooks"));
  const install = (...args) => spawnSync(process.execPath, [join(repo, "scripts/install-hooks.mjs"), ...args], { encoding: "utf8" });
  return { root, repo, git, ok, install };
}

test("pre-push installer is opt-in, idempotent and refuses foreign hooks", (t) => {
  const { repo, install, ok } = fixture(t);
  const target = join(repo, ".git/hooks/pre-push");
  assert.equal(existsSync(target), false);
  ok(install("--hook", "pre-push"));
  const body = readFileSync(target, "utf8");
  ok(install("--hook", "pre-push"));
  assert.equal(readFileSync(target, "utf8"), body);
  assert.match(ok(install("list", "--hook", "pre-push")), /installed/);
  ok(install("uninstall", "--hook", "pre-push"));
  writeFileSync(target, "#!/bin/sh\nexit 0\n");
  assert.equal(install("--hook", "pre-push").status, 1);
  assert.equal(install("uninstall", "--hook", "pre-push").status, 1);
  assert.equal(readFileSync(target, "utf8"), "#!/bin/sh\nexit 0\n");
});

test("installer respects custom hooksPath and preserves tracked hook source", (t) => {
  const { repo, git, ok, install } = fixture(t);
  ok(git("config", "core.hooksPath", "custom-hooks"));
  ok(install("--hook", "pre-push"));
  assert.ok(existsSync(join(repo, "custom-hooks/pre-push")));
  ok(install("uninstall", "--hook", "pre-push"));
  ok(git("config", "core.hooksPath", ".githooks"));
  ok(install("--hook", "pre-push"));
  assert.equal(install("uninstall", "--hook", "pre-push").status, 1);
  assert.ok(existsSync(join(repo, ".githooks/pre-push")));
});

test("pre-commit remains the default", (t) => {
  const { repo, ok, install } = fixture(t);
  ok(install());
  assert.ok(existsSync(join(repo, ".git/hooks/pre-commit")));
  assert.equal(existsSync(join(repo, ".git/hooks/pre-push")), false);
  ok(install("uninstall"));
});

test("installer resolves the effective hooks directory from a linked worktree", (t) => {
  const { root, git, ok } = fixture(t);
  ok(git("add", "."));
  ok(git("commit", "-qm", "fixture"));
  ok(git("config", "core.hooksPath", "../shared-hooks"));
  const linked = join(root, "linked");
  ok(git("worktree", "add", "-qb", "linked", linked));
  ok(spawnSync(process.execPath, [join(linked, "scripts/install-hooks.mjs"), "--hook", "pre-push"], { encoding: "utf8" }));
  assert.ok(existsSync(join(root, "shared-hooks/pre-push")));
});

test("installed pre-push permits green push and blocks a real YAML invariant failure", (t) => {
  const { root, repo, git, ok, install } = fixture(t);
  const remote = join(root, "remote.git");
  ok(spawnSync("git", ["init", "--bare", "-q", remote], { encoding: "utf8" }));
  ok(git("remote", "add", "origin", remote));
  mkdirSync(join(repo, "skills/example"), { recursive: true });
  const skill = join(repo, "skills/example/SKILL.md");
  const valid = "---\nname: example\ndescription: Valid skill.\n---\nBody.\n";
  writeFileSync(skill, valid);
  const checker = pathToFileURL(join(source, "scripts/check-skill-syntax.mjs")).href;
  writeFileSync(join(repo, "scripts/check-repo.mjs"), `import { checkPack } from ${JSON.stringify(checker)};\nif (process.env.GIT_DIR || process.env.GIT_WORK_TREE) throw new Error('Git context leaked into checks');\nconst r = checkPack(process.cwd()); console.log(JSON.stringify(r)); process.exitCode = r.status === 'pass' ? 0 : 1;\n`);
  ok(install("--hook", "pre-push"));
  const commit = (message) => { ok(git("add", ".")); ok(git("commit", "-qm", message)); };
  commit("green");
  ok(spawnSync("git", ["-C", repo, "push", "origin", "HEAD:refs/heads/main"], { encoding: "utf8", env: { ...process.env, GIT_DIR: join(repo, ".git"), GIT_WORK_TREE: repo } }));
  const before = ok(git("ls-remote", "origin", "refs/heads/main"));
  writeFileSync(skill, "---\nname: [broken\n---\n");
  commit("seed malformed YAML");
  const red = git("push", "origin", "HEAD:refs/heads/main");
  assert.notEqual(red.status, 0, red.stdout + red.stderr);
  assert.match(red.stdout + red.stderr, /expected|flow sequence|YAML/i);
  assert.equal(ok(git("ls-remote", "origin", "refs/heads/main")), before);
  writeFileSync(skill, valid);
  commit("restore green");
  ok(git("push", "origin", "HEAD:refs/heads/main"));
  assert.notEqual(ok(git("ls-remote", "origin", "refs/heads/main")), before);
});

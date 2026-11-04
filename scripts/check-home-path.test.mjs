// Privacy regressions use disposable committed histories, never the owner's tree.
import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { audit, scan } from "./check-home-path.mjs";

const HOME = "C:\\Users\\alice";
const CHECKER = fileURLToPath(new URL("./check-home-path.mjs", import.meta.url));
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), "home-path-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const put = (file, text) => { mkdirSync(dirname(join(repo, file)), { recursive: true }); writeFileSync(join(repo, file), text); };
  const commit = (file, text) => { put(file, text); git("add", "-A"); git("commit", "-qm", "fixture"); return git("rev-parse", "HEAD"); };
  git("init", "-q", "-b", "main");
  git("config", "maintenance.auto", "false");
  git("config", "gc.auto", "0");
  const base = commit("README.md", "clean\n");
  const check = (options = {}) => audit({ repo, base, home: HOME, ...options });
  return { repo, git, put, commit, base, check };
}

test("recognizes path forms while ignoring generic and other-user paths", () => {
  const lines = ["C:\\Users\\alice\\x", "C:/Users/alice/x", '{"p":"C:\\\\Users\\\\alice\\\\x"}',
    "/c/Users/alice/x", "c:\\users\\ALICE\\x", "~/.codex $HOME %USERPROFILE% C:\\Users\\bob"];
  assert.deepEqual(scan(["a"], () => lines.join("\n"), HOME).map(x => x.line), [1, 2, 3, 4, 5]);
  assert.deepEqual(scan(["binary"], () => null, HOME), []);
});

test("unrelated edits and edits beside historical paths pass without rewriting evidence", (t) => {
  const f = fixture(t);
  const baseline = f.commit("evidence.md", HOME + "\nold note\n");
  f.git("update-ref", "refs/remotes/origin/main", baseline);
  f.commit("unrelated.txt", "new work\n");
  f.commit("evidence.md", HOME + "\nupdated note\n");
  const result = f.check({ base: baseline });
  assert.equal(result.status, "pass");
  assert.equal(f.check({ base: baseline, all: true }).status, "fail", "full inventory remains opt-in");
  assert.equal(readFileSync(join(f.repo, "evidence.md"), "utf8"), HOME + "\nupdated note\n");
});

test("new paths are caught in ordinary, quoted and formerly exempt filenames", (t) => {
  const f = fixture(t);
  const files = ["space ü.txt", 'quote" and\nnewline.txt', "docs/agents/research/evidence/windows-native-validation-20261024.json"];
  for (const file of files) f.commit(file, "safe\n" + HOME + "\n");
  const result = f.check();
  assert.equal(result.status, "fail");
  assert.deepEqual(result.leaks.map(x => x.file).sort(), files.sort());
  assert.ok(result.leaks.every(x => x.line === 2));
});

test("an introduced leak still blocks after a later commit removes it", (t) => {
  const f = fixture(t);
  const leaked = f.commit("new.md", HOME + "\n");
  f.commit("new.md", "scrubbed at tip\n");
  const result = f.check();
  assert.equal(result.status, "fail");
  assert.equal(result.leaks[0].commit, leaked);
});

test("renaming historical evidence passes but adding another leak to it fails", (t) => {
  const f = fixture(t);
  const base = f.commit("old.md", HOME + "\n");
  f.git("mv", "old.md", "renamed.md"); f.git("commit", "-qm", "rename evidence");
  assert.equal(f.check({ base }).status, "pass");
  f.commit("renamed.md", HOME + "\n" + HOME + "/new\n");
  assert.equal(f.check({ base }).leaks.length, 1);
});

test("new refs exclude remote history and deletions add no leak findings", (t) => {
  const f = fixture(t);
  const baseline = f.commit("historical.md", HOME + "\n");
  f.git("update-ref", "refs/remotes/origin/main", baseline);
  const tip = f.commit("new.md", "clean\n");
  assert.equal(f.check({ ranges: [[tip, "--not", "--remotes=origin"]] }).status, "pass");
  f.git("rm", "historical.md"); f.git("commit", "-qm", "remove historical file");
  assert.equal(f.check({ base: baseline }).status, "pass");
});

test("merging already-published historical paths does not create a new leak", (t) => {
  const f = fixture(t);
  f.git("update-ref", "refs/remotes/origin/main", f.base);
  f.git("checkout", "-qb", "side");
  const published = f.commit("historical.md", HOME + "\n");
  f.git("update-ref", "refs/remotes/origin/side", published);
  f.git("checkout", "main"); f.commit("work.md", "clean\n");
  f.git("merge", "--no-ff", "-qm", "merge published history", "side");
  assert.equal(f.check({ ranges: [[f.git("rev-parse", "HEAD"), "--not", "--remotes=origin"]] }).status, "pass");
});

test("novel merge-resolution text is checked against every parent", (t) => {
  const f = fixture(t);
  f.git("checkout", "-qb", "side"); f.commit("README.md", "right\n");
  f.git("checkout", "main"); f.commit("README.md", "left\n");
  const merge = spawnSync("git", ["merge", "--no-ff", "side"], { cwd: f.repo, encoding: "utf8" });
  assert.equal(merge.status, 1);
  const tip = f.commit("README.md", HOME + "\n");
  const result = f.check();
  assert.equal(result.status, "fail");
  assert.deepEqual(result.leaks, [{ commit: tip, file: "README.md", line: 1 }]);
});

test("missing baselines and malformed runner scopes are execution errors", (t) => {
  const f = fixture(t);
  assert.throws(() => f.check({ base: "missing-ref" }), /failed/);
  assert.throws(() => f.check({ ranges: null }), /unknown gate revision scope/);
  mkdirSync(join(f.repo, "scripts"));
  copyFileSync(CHECKER, join(f.repo, "scripts/check-home-path.mjs"));
  const run = spawnSync(process.execPath, [join(f.repo, "scripts/check-home-path.mjs"), "--json"], {
    encoding: "utf8", env: { ...process.env, GM_GATE_RANGES: "null" },
  });
  assert.equal(run.status, 2);
  assert.equal(JSON.parse(run.stdout).status, "error");
});

test("first publication checks root history; dirty files never change committed scope", (t) => {
  const f = fixture(t);
  const tip = f.commit("root-history.md", HOME + "\n");
  assert.equal(f.check({ base: undefined }).status, "fail");
  f.git("update-ref", "refs/remotes/origin/main", tip);
  f.put("uncommitted.md", HOME + "\n");
  assert.equal(f.check({ base: undefined }).status, "pass");
});

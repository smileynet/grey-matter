// gate.test.mjs: gate.mjs selection, bounding and outcome classes against disposable repositories.
// Run: node --test scripts/gate.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GATE = join(dirname(fileURLToPath(import.meta.url)), "gate.mjs");
const ZERO = "0".repeat(40);
const pass = 'process.exit(0)';

function fixture(checks, fn, { fullTriggers = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-test-"));
  const repo = join(dir, "repo"), remote = join(dir, "remote.git");
  const git = (...args) => {
    const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
    assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const put = (path, body = "x\n") => { mkdirSync(dirname(join(repo, path)), { recursive: true }); writeFileSync(join(repo, path), body); };
  const commit = (path, body) => { put(path, body); git("add", "-A"); git("commit", "-qm", path); return git("rev-parse", "HEAD"); };
  try {
    mkdirSync(repo);
    spawnSync("git", ["init", "-q", "--bare", remote]);
    git("init", "-q", "-b", "main");
    git("config", "user.email", "gate@test"); git("config", "user.name", "gate test");
    git("config", "core.hooksPath", join(dir, "no-git-hooks"));
    mkdirSync(join(repo, "scripts"));
    copyFileSync(GATE, join(repo, "scripts/gate.mjs"));
    put("scripts/gates.json", JSON.stringify({ full_triggers: fullTriggers, checks }));
    const base = commit("README.md");
    git("remote", "add", "origin", remote); git("push", "-q", "origin", "main");
    const run = (args, { input = "", env = {} } = {}) => {
      const r = spawnSync(process.execPath, ["scripts/gate.mjs", ...args], { cwd: repo, input, encoding: "utf8", env: { ...process.env, ...env } });
      return { status: r.status, out: r.stdout + r.stderr };
    };
    const push = (local, remoteSha, ref = "refs/heads/main") => `${ref} ${local} ${ref} ${remoteSha}\n`;
    fn({ git, commit, run, push, base });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const check = (id, scope, body = pass, extra = {}) => ({ id, stage: "pre-push", catches: `${id} failure`, scope, run: ["node", "-e", body], timeout_s: 10, ...extra });
const ran = (out, id) => new RegExp(`\\] +[\\d.]+s  ${id}\\b`).test(out);

test("a push touching no scoped path runs nothing", () => fixture([check("a", ["a/"])], ({ commit, run, push, base }) => {
  const head = commit("docs/notes.md");
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(head, base) });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /0 of 1 check/);
}));

test("a two-ref push selects from the union of both ranges", () => fixture([check("a", ["a/"]), check("b", ["b/"]), check("c", ["c/"])], ({ git, commit, run, push, base }) => {
  const main = commit("a/one.txt");
  git("checkout", "-qb", "topic", base);
  const topic = commit("b/two.txt");
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(main, base) + push(topic, ZERO, "refs/heads/topic") });
  assert.equal(r.status, 0, r.out);
  assert.ok(ran(r.out, "a") && ran(r.out, "b") && !ran(r.out, "c"), r.out);
}));

test("a new branch is judged by the commits the remote does not have", () => fixture([check("a", ["a/"]), check("readme", ["README.md"])], ({ git, commit, run, push }) => {
  git("checkout", "-qb", "topic");
  const head = commit("a/one.txt");
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(head, ZERO, "refs/heads/topic") });
  assert.ok(ran(r.out, "a") && !ran(r.out, "readme"), r.out);
}));

test("a deletion, or an empty push, runs nothing", () => fixture([check("a", ["a/"], "process.exit(1)")], ({ run, base }) => {
  // Read as a range, the all-zeroes local object would fail to resolve and select every check.
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: `(delete) ${ZERO} refs/heads/old ${base}\n` });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /0 of 1 check.*0 changed path/);
  assert.match(run(["pre-push", "--stdin", "--remote", "origin"]).out, /0 of 1 check.*0 changed path/);
}));

test("a failing check blocks and shows its output", () => fixture([check("a", ["a/"], "console.error('manifest broken'); process.exit(3)")], ({ commit, run, push, base }) => {
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base) });
  assert.equal(r.status, 1);
  assert.match(r.out, /FAIL.*a: fail/);
  assert.match(r.out, /manifest broken/);
}));

test("a hung check and a check blocked in spawnSync both end as timeout, and the tree dies", () => {
  const mark = join(mkdtempSync(join(tmpdir(), "gate-mark-")), "grandchild-survived");
  const writer = join(dirname(mark), "writer.js");
  writeFileSync(writer, `setTimeout(() => require('fs').writeFileSync(${JSON.stringify(mark)}, 'x'), 3000)`);
  // A Node parent on Windows takes its own children down when killed, so the intermediate is a
  // shell, as when a real check launches a tool through cmd, bash or PowerShell.
  const run = process.platform === "win32" ? ["cmd", "/c", process.execPath, writer] : ["sh", "-c", `"${process.execPath}" "${writer}"`];
  const hung = check("hung", ["a/"], "setInterval(() => {}, 1000)", { timeout_s: 1 });
  const blocked = { ...check("blocked", ["a/"]), run, timeout_s: 1 };
  // Keeps gate.mjs alive past the grandchild's 3 s mark. On Windows, Node kills its own
  // descendants when gate.mjs exits, so only an orphan seen while gate.mjs runs proves a leak.
  const later = check("later", ["a/"], "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3500)");
  try {
    fixture([hung, blocked, later], ({ commit, run, push, base }) => {
      const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base) });
      assert.equal(r.status, 1, r.out);
      assert.match(r.out, /hung: timeout/);
      assert.match(r.out, /blocked: timeout/);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
      assert.equal(existsSync(mark), false, "the grandchild outlived the timeout: the process tree was not killed");
    });
  } finally { rmSync(dirname(mark), { recursive: true, force: true }); }
});

test("a missing tool is an infrastructure error", () => fixture([{ ...check("a", ["a/"]), run: ["no-such-tool-for-gate-test"] }], ({ commit, run, push, base }) => {
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base) });
  assert.equal(r.status, 1);
  assert.match(r.out, /a: infrastructure error/);
}));

test("SKIP is reported, never silent", () => fixture([check("a", ["a/"], "process.exit(1)")], ({ commit, run, push, base }) => {
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base), env: { SKIP: "a" } });
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /a: skipped \(SKIP\)/);
}));

test("a full trigger, or a range Git cannot resolve, selects every check", () => fixture([check("a", ["a/"]), check("b", ["b/"])], ({ commit, run, push, base }) => {
  const head = commit("package.json");
  const full = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(head, base) });
  assert.match(full.out, /2 of 2 check.*full trigger/);
  const unknown = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(head, "1".repeat(40)) });
  assert.match(unknown.out, /2 of 2 check.*range unknown/);
}, { fullTriggers: ["package.json"] }));

test("pre-merge diffs against --base, and --include runs a check from another stage", () => fixture([check("a", ["a/"], pass, { stage: "pre-merge" }), check("late", ["z/"], pass, { stage: "pre-release" })], ({ commit, run, base }) => {
  commit("a/x");
  const r = run(["pre-merge", "--base", base, "--include", "late"]);
  assert.equal(r.status, 0, r.out);
  assert.ok(ran(r.out, "a") && ran(r.out, "late"), r.out);
}));

test("a malformed manifest or an unknown argument exits 2", () => fixture([{ id: "a", stage: "pre-push", run: ["node"], timeout_s: 1, scope: ["a/"] }], ({ run }) => {
  assert.equal(run(["pre-push"]).status, 2, "a check without catches is rejected");
  assert.equal(run(["pre-flight"]).status, 2);
}));

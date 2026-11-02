// gate.test.mjs: gate.mjs selection, bounding and outcome classes against disposable repositories.
// Run: node --test scripts/gate.test.mjs
import "./test-git-env.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const GATE = join(dirname(fileURLToPath(import.meta.url)), "gate.mjs");
const ZERO = "0".repeat(40);
const pass = 'process.exit(0)';

function fixture(checks, fn, { fullTriggers = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-test-"));
  const repo = join(dir, "repo");
  const git = (...args) => {
    const r = spawnSync("git", args, { cwd: repo, encoding: "utf8" });
    assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
    return r.stdout.trim();
  };
  const put = (path, body = "x\n") => { mkdirSync(dirname(join(repo, path)), { recursive: true }); writeFileSync(join(repo, path), body); };
  const commit = (path, body) => { put(path, body); git("add", "-A"); git("commit", "-qm", path); return git("rev-parse", "HEAD"); };
  try {
    mkdirSync(repo);
    git("init", "-q", "-b", "main");
    mkdirSync(join(repo, "scripts"));
    copyFileSync(GATE, join(repo, "scripts/gate.mjs"));
    put("scripts/gates.json", JSON.stringify({ full_triggers: fullTriggers, checks }));
    const base = commit("README.md");
    git("update-ref", "refs/remotes/origin/main", base);
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

test("an empty selection discloses uncommitted changes without judging them", () => fixture([check("a", ["a/"])], ({ git, run }) => {
  const clean = run(["pre-merge"]);
  assert.equal(clean.status, 0, clean.out);
  assert.doesNotMatch(clean.out, /uncommitted changes were not checked/);
  writeFileSync(join(git("rev-parse", "--show-toplevel"), "README.md"), "dirty\n");
  const dirty = run(["pre-merge"]);
  assert.equal(dirty.status, 0, dirty.out);
  assert.match(dirty.out, /uncommitted changes were not checked/);
}));

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

for (const strategy of ["tree", "parent"]) test(`timeout descendant probe: ${strategy === "tree" ? "tree termination passes" : "parent-only termination is rejected"}`, () => {
  const mark = join(mkdtempSync(join(tmpdir(), "gate-mark-")), "grandchild-pid");
  const stop = join(dirname(mark), "stop");
  const writer = join(dirname(mark), "writer.js");
  writeFileSync(writer, `process.chdir(${JSON.stringify(dirname(mark))}); require('fs').writeFileSync(${JSON.stringify(mark)}, String(process.pid)); setInterval(() => { if (require('fs').existsSync(${JSON.stringify(stop)})) process.exit(0); }, 20); setTimeout(() => process.exit(0), 30000);`);
  // A Node parent on Windows takes its own children down when killed, so the intermediate is a
  // shell, as when a real check launches a tool through cmd, bash or PowerShell.
  const run = process.platform === "win32" ? ["cmd", "/c", process.execPath, writer] : ["sh", "-c", `"${process.execPath}" "${writer}"`];
  const hung = check("hung", ["a/"], "setInterval(() => {}, 1000)", { timeout_s: 1 });
  const blocked = { ...check("blocked", ["a/"]), run, timeout_s: 3 };
  // Observe after termination returns, while gate.mjs is alive: exiting Node can hide a leak.
  const later = check("later", ["a/"], `
    const pid = Number(require('fs').readFileSync(${JSON.stringify(mark)}, 'utf8'));
    const until = Date.now() + 1000;
    while (true) {
      try { process.kill(pid, 0); }
      catch (error) { if (error.code === 'ESRCH') process.exit(0); throw error; }
      if (Date.now() >= until) { require('fs').writeFileSync(${JSON.stringify(stop)}, 'stop'); console.error('timeout survivor'); process.exit(1); }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  `);
  try {
    fixture([hung, blocked, later], ({ git, commit, run, push, base }) => {
      if (strategy === "parent") {
        const file = join(git("rev-parse", "--show-toplevel"), "scripts/gate.mjs");
        const original = readFileSync(file, "utf8"), mutant = original.replace("killTree(child);", "child.kill();");
        assert.notEqual(mutant, original, "the parent-only control mutation landed");
        writeFileSync(file, mutant);
      }
      const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base) });
      assert.equal(r.status, 1, r.out);
      assert.match(r.out, /hung: timeout/);
      assert.match(r.out, /blocked: timeout/);
      if (strategy === "tree") assert.match(r.out, /\[ok\s*\][^\n]*\blater\b/, r.out);
      else {
        assert.match(r.out, /later: fail/);
        assert.match(r.out, /timeout survivor/);
      }
    });
  } finally {
    writeFileSync(stop, "stop");
    if (existsSync(mark)) {
      const pid = Number(readFileSync(mark, "utf8"));
      const until = Date.now() + 2000;
      while (Date.now() < until) {
        try { process.kill(pid, 0); }
        catch (error) { if (error.code !== "ESRCH") throw error; break; }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      }
    }
    rmSync(dirname(mark), { recursive: true, force: true, maxRetries: 10 });
  }
});

test("a missing tool is an infrastructure error", () => fixture([{ ...check("a", ["a/"]), run: ["no-such-tool-for-gate-test"] }], ({ commit, run, push, base }) => {
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(commit("a/x"), base) });
  assert.equal(r.status, 1);
  assert.match(r.out, /a: infrastructure error/);
}));

test("a locked check temp directory reports infrastructure failure and preserves its output", { skip: process.platform !== "win32" }, async () => {
  let holder, retained;
  try {
    fixture([], ({ git, commit, run, push, base }) => {
      const repo = git("rev-parse", "--show-toplevel");
      const marker = join(repo, "holder-path"), ready = join(repo, "holder-ready");
      holder = spawn(process.execPath, ["-e", `
        const fs = require('node:fs');
        const timer = setInterval(() => {
          if (!fs.existsSync(${JSON.stringify(marker)})) return;
          process.chdir(fs.readFileSync(${JSON.stringify(marker)}, 'utf8'));
          fs.writeFileSync(${JSON.stringify(ready)}, 'ready');
          clearInterval(timer); setInterval(() => {}, 1000);
        }, 10);
      `], { stdio: "ignore" });
      const body = `
        const fs = require('node:fs');
        fs.writeFileSync(${JSON.stringify(marker)}, process.env.TEMP);
        const until = Date.now() + 5000;
        while (!fs.existsSync(${JSON.stringify(ready)}) && Date.now() < until) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
        if (!fs.existsSync(${JSON.stringify(ready)})) process.exit(23);
        console.log('check output retained');
      `;
      writeFileSync(join(repo, "scripts/gates.json"), JSON.stringify({ checks: [check("locked", ["a/"], body)] }));
      const head = commit("a/x");
      const result = run(["pre-push", "--stdin"], { input: push(head, base) });
      retained = readFileSync(marker, "utf8");
      assert.equal(result.status, 1, result.out);
      assert.match(result.out, /locked: infrastructure error/);
      assert.match(result.out, /Temporary directory cleanup failed; retained/);
      assert.match(result.out, /check output retained/);
    });
  } finally {
    if (holder) { holder.kill(); await once(holder, "exit"); }
    if (retained) rmSync(retained, { recursive: true, force: true, maxRetries: 3 });
  }
});

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

test("pre-release runs every check in every stage, whatever changed", () => fixture([check("push", ["a/"]), check("merge", ["b/"], pass, { stage: "pre-merge" }), check("release", ["c/"], pass, { stage: "pre-release" })], ({ run }) => {
  const r = run(["pre-release"]);
  assert.equal(r.status, 0, r.out);
  assert.ok(["push", "merge", "release"].every((id) => ran(r.out, id)), r.out);
}));

test("a malformed manifest or an unknown argument exits 2", () => fixture([{ id: "a", stage: "pre-push", run: ["node"], timeout_s: 1, scope: ["a/"] }], ({ run }) => {
  assert.equal(run(["pre-push"]).status, 2, "a check without catches is rejected");
  assert.equal(run(["pre-flight"]).status, 2);
}));

test("checks judge the committed tree, never uncommitted edits, and keep node_modules", () => fixture([check("tree", ["a/"], "process.exit(require('fs').readFileSync('a/x', 'utf8').includes('dirty') ? 1 : 0)")], ({ git, commit, run, push, base }) => {
  const head = commit("a/x", "clean\n");
  writeFileSync(join(git("rev-parse", "--show-toplevel"), "a/x"), "dirty\n");
  mkdirSync(join(git("rev-parse", "--show-toplevel"), "node_modules/dep"), { recursive: true });
  writeFileSync(join(git("rev-parse", "--show-toplevel"), "node_modules/dep/index.js"), "");
  const r = run(["pre-push", "--stdin", "--remote", "origin"], { input: push(head, base) });
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(join(git("rev-parse", "--show-toplevel"), "node_modules/dep/index.js")), "removing the snapshot reached through the node_modules link");
  assert.equal(git("worktree", "list").split("\n").length, 1, "the snapshot worktree was left behind");
  writeFileSync(join(git("rev-parse", "--show-toplevel"), "a/x"), "clean\n");
  const dirty = commit("a/x", "dirty\n");
  assert.equal(run(["pre-push", "--stdin", "--remote", "origin"], { input: push(dirty, head) }).status, 1, "a committed defect still fails");
}));

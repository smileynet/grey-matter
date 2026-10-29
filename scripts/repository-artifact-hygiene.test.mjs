#!/usr/bin/env node
// Protect staged-source fidelity, bounded inspection, policy decisions and read-only operation.
// Run: node --test scripts/repository-artifact-hygiene.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, lstatSync, readlinkSync, realpathSync, rmSync, symlinkSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../skills/meta/repository-artifact-hygiene/scripts/inspect-artifacts.mjs");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
function fixture(t, files = {}) {
  const repo = mkdtempSync(join(tmpdir(), "gm artifact "));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const g = (...args) => execFileSync("git", ["-c", `core.hooksPath=${join(repo, '.empty-hooks')}`, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "-C", repo, ...args], { stdio: "pipe" });
  const put = (path, body) => { mkdirSync(dirname(join(repo, path)), { recursive: true }); writeFileSync(join(repo, path), body); };
  g("init", "-q");
  put(".gitignore", ".scratch/\npolicy.json\n.empty-hooks/\n");
  for (const [path, body] of Object.entries(files)) put(path, body);
  g("add", "-A"); g("commit", "-qm", "baseline");
  return { repo, g, put };
}
function run(f, args = [], env = {}) {
  const r = spawnSync(process.execPath, [script, "--repo", f.repo, ...args], { env: { ...process.env, ...env }, encoding: "utf8" });
  assert.ifError(r.error);
  assert.equal(r.stderr, "", r.stderr);
  return { code: r.status, data: JSON.parse(r.stdout) };
}
function fingerprint(root) {
  const files = {};
  function walk(path) {
    for (const name of readdirSync(path)) {
      const p = join(path, name), st = lstatSync(p);
      if (st.isSymbolicLink()) files[p] = "link:" + readlinkSync(p);
      else if (st.isDirectory()) walk(p);
      else files[p] = [st.mode, hash(readFileSync(p))];
    }
  }
  walk(root);
  return files;
}

test("staged inspection reads the index and leaves ignored data and all repository bytes unchanged", t => {
  const f = fixture(t, { "source.txt": "before" });
  f.put("source.txt", "staged"); f.g("add", "source.txt"); f.put("source.txt", "different working content");
  f.put(".scratch/large.bin", Buffer.alloc(2 * 1024 ** 2)); f.put("untracked.txt", "outside scope");
  const before = fingerprint(f.repo), r = run(f);
  assert.equal(r.code, 0); assert.deepEqual(r.data.files.map(x => x.path), ["source.txt"]);
  assert.equal(r.data.metrics.gitBlobBytes, 6); assert.equal(r.data.scope.mode, "staged");
  assert.deepEqual(fingerprint(f.repo), before);
});

test("committed tree inspection ignores dirty files and freezes the requested tree", t => {
  const f = fixture(t, { "source.txt": "committed" }); f.put("source.txt", "not committed");
  const r = run(f, ["--ref", "HEAD"]);
  assert.equal(r.code, 0); assert.equal(r.data.files.find(x => x.path === "source.txt").gitBlobBytes, 9);
  assert.equal(r.data.scope.tree, f.g("rev-parse", "HEAD^{tree}").toString().trim());
});

test("small source art remains a review decision with no mandatory LFS recommendation", t => {
  const f = fixture(t); f.put("art/source image.png", Buffer.from([137, 80, 78, 71, 0, 1, 2])); f.g("add", "art/source image.png");
  const r = run(f); assert.equal(r.code, 0); assert.equal(r.data.findings.length, 0);
  assert.equal(r.data.files[0].role, "requires project evidence"); assert.equal(r.data.metrics.uniqueLfsDeclaredBytes, 0);
});

test("large embedded evidence is measured as characters and warns without banning portable HTML", t => {
  const f = fixture(t), payload = "A".repeat(1024 ** 2);
  f.put("report.html", '<img src="data:image/png;base64,' + payload + '">'); f.g("add", "report.html");
  const r = run(f); assert.equal(r.code, 0); assert.equal(r.data.metrics.embeddedCharacters, payload.length);
  assert.equal(r.data.findings.find(x => x.code === "embedded-data").severity, "warning");
});

test("diffable JSON stays ordinary content and a warning size is an explicit caller choice", t => {
  const f = fixture(t); f.put("dataset.json", '{"data":[1,2,3]}'); f.g("add", "dataset.json");
  assert.equal(run(f).data.findings.length, 0);
  const r = run(f, ["--warn-bytes", "4"]); assert.equal(r.code, 0); assert.equal(r.data.findings[0].code, "large-blob");
});

test("LFS lengths are declared payload, deduplicated by payload hash, not physical or remote availability", t => {
  const f = fixture(t), pointer = "version https://git-lfs.github.com/spec/v1\noid sha256:" + "a".repeat(64) + "\nsize 1234567\n";
  f.put("art/a.png", pointer); f.put("art/b.png", pointer); f.g("add", "art");
  const r = run(f); assert.equal(r.code, 0); assert.equal(r.data.metrics.lfsPointerPaths, 2);
  assert.equal(r.data.metrics.uniqueLfsDeclaredBytes, 1234567); assert.equal(r.data.metrics.uniqueGitBlobBytes, Buffer.byteLength(pointer));
  assert.equal(r.data.files[0].lfs.payloadAvailability, "not checked");
});

test("malformed LFS input returns an inspection error rather than a plausible storage total", t => {
  const f = fixture(t); f.put("bad.png", "version https://git-lfs.github.com/spec/v1\noid sha256:bad\nsize wrong\n"); f.g("add", "bad.png");
  const r = run(f); assert.equal(r.code, 2); assert.equal(r.data.status, "error");
  assert.ok(r.data.errors.some(x => x.code === "content-error")); assert.equal(r.data.coverage.metadataComplete, false);
});

test("inconsistent LFS declarations cannot undercount a deduplicated payload", t => {
  const f = fixture(t), prefix = "version https://git-lfs.github.com/spec/v1\noid sha256:" + "b".repeat(64) + "\nsize ";
  f.put("a.png", prefix + "100\n"); f.put("b.png", prefix + "1\n"); f.g("add", "a.png", "b.png");
  const r = run(f); assert.equal(r.code, 2); assert.ok(r.data.errors.some(x => x.code === "conflicting-lfs-size"));
});

test("explicit project limits fail while an exact reasoned exception preserves an intentional deliverable", t => {
  const f = fixture(t); f.put("docs/offline report.html", '<img src="data:image/png;base64,AAAA">'); f.g("add", "docs");
  const policy = { version: 1, rules: [{ id: "evidence", paths: ["docs/**/*.html"], maxBlobBytes: 8, maxEmbeddedCharacters: 0 }] };
  f.put("policy.json", JSON.stringify(policy)); const before = readFileSync(join(f.repo, ".git/index"));
  let r = run(f, ["--policy", "policy.json"]); assert.equal(r.code, 1); assert.equal(r.data.status, "fail");
  policy.exceptions = [{ rule: "evidence", path: "docs/offline report.html", reason: "Approved portable release deliverable" }];
  f.put("policy.json", JSON.stringify(policy)); r = run(f, ["--policy", "policy.json"]);
  assert.equal(r.code, 0); assert.equal(r.data.findings.find(x => x.code === "policy-violation").exception, policy.exceptions[0].reason);
  assert.deepEqual(readFileSync(join(f.repo, ".git/index")), before);
});

test("a required manifest must be in the inspected Git state, not merely an untracked file", t => {
  const f = fixture(t); f.put("report.html", "report"); f.g("add", "report.html");
  f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "bundle", paths: ["*.html"], requireManifest: "manifest.json" }] }));
  f.put("manifest.json", "{}"); assert.equal(run(f, ["--policy", "policy.json"]).code, 1);
  f.g("add", "manifest.json"); assert.equal(run(f, ["--policy", "policy.json"]).code, 0);
});

test("removing a manifest checks unchanged artifacts that depend on it", t => {
  const f = fixture(t, { "report.html": "frozen report", "manifest.json": "{}" });
  f.g("rm", "manifest.json");
  f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "bundle", paths: ["*.html"], requireManifest: "manifest.json" }] }));
  const r = run(f, ["--policy", "policy.json"]); assert.equal(r.code, 1);
  assert.deepEqual(r.data.scope.policyDependentPaths, ["report.html"]);
});

test("NUL characters do not conceal embedded payload from an explicit policy", t => {
  const f = fixture(t); f.put("report.html", '\0<img src="data:image/png;base64,AAAA">'); f.g("add", "report.html");
  f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "embedded", paths: ["**"], maxEmbeddedCharacters: 0 }] }));
  const r = run(f, ["--policy", "policy.json"]); assert.equal(r.code, 1); assert.equal(r.data.metrics.embeddedCharacters, 4);
});

test("policy globs cover newline-containing Git paths", { skip: process.platform === "win32" && "Git for Windows rejects newline paths" }, t => {
  const f = fixture(t); f.put("evidence\nreport.html", "payload"); f.g("add", "evidence\nreport.html");
  f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "all", paths: ["**"], maxBlobBytes: 0 }] }));
  assert.equal(run(f, ["--policy", "policy.json"]).code, 1);
});

test("malformed policy cannot silently disable a misspelled intended gate", t => {
  const f = fixture(t); f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "a", paths: ["**"], maxBlobByets: 3 }] }));
  const r = run(f, ["--policy", "policy.json"]); assert.equal(r.code, 2);
  assert.match(r.data.errors[0].message, /Unknown policy field/);
});

test("broad or unexplained policy exceptions are rejected", t => {
  const f = fixture(t); f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "a", paths: ["**"], maxBlobBytes: 3 }], exceptions: [{ rule: "a", path: "**", reason: "" }] }));
  assert.equal(run(f, ["--policy", "policy.json"]).code, 2);
});

test("content bounds disclose skipped bodies and fail a policy that cannot be verified", t => {
  const f = fixture(t); f.put("report.html", "A".repeat(100)); f.g("add", "report.html");
  let r = run(f, ["--max-blob-bytes", "16"]); assert.equal(r.code, 0); assert.equal(r.data.coverage.contentComplete, false);
  assert.equal(r.data.files[0].contentInspected, false);
  f.put("policy.json", JSON.stringify({ version: 1, rules: [{ id: "a", paths: ["**"], maxEmbeddedCharacters: 0 }] }));
  r = run(f, ["--max-blob-bytes", "16", "--policy", "policy.json"]); assert.equal(r.code, 2);
  assert.ok(r.data.errors.some(x => x.code === "policy-unverified"));
});

test("history is explicit and bounded, and its bytes do not replace the current-tree metric", t => {
  const f = fixture(t, { "a.txt": "A".repeat(1000) }); f.put("a.txt", "small"); f.g("add", "a.txt"); f.g("commit", "-qm", "smaller tip");
  assert.equal(run(f, ["--ref", "HEAD"]).data.history, undefined);
  let r = run(f, ["--ref", "HEAD", "--history"]); assert.equal(r.code, 0);
  assert.ok(r.data.history.gitBlobBytes > r.data.metrics.gitBlobBytes); assert.equal(r.data.history.metadataComplete, true);
  r = run(f, ["--ref", "HEAD", "--history", "--max-commits", "1", "--max-objects", "1"]);
  assert.equal(r.data.history.metadataComplete, false); assert.equal(r.data.history.objectLimitReached, true);
});

test("a missing local object is surfaced without fetching a promisor remote", t => {
  const f = fixture(t); f.put("missing.txt", "not locally available"); f.g("add", "missing.txt");
  const oid = f.g("rev-parse", ":missing.txt").toString().trim(); rmSync(join(f.repo, ".git/objects", oid.slice(0, 2), oid.slice(2)));
  f.g("config", "remote.origin.url", "https://example.invalid/must-not-fetch"); f.g("config", "remote.origin.promisor", "true");
  const r = run(f); assert.equal(r.code, 2); assert.ok(r.data.errors.length);
});

test("caller Git context cannot redirect the inspected repository or index", t => {
  const f = fixture(t), other = fixture(t, { "private.txt": "other repository" });
  f.put("candidate.txt", "selected"); f.g("add", "candidate.txt"); const before = fingerprint(other.repo);
  const r = run(f, [], { GIT_DIR: join(other.repo, ".git"), GIT_WORK_TREE: other.repo, GIT_INDEX_FILE: join(other.repo, ".git/index"), GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "core.worktree", GIT_CONFIG_VALUE_0: other.repo });
  assert.equal(r.code, 0); assert.equal(r.data.scope.repository, realRoot(f.repo));
  assert.deepEqual(r.data.files.map(x => x.path), ["candidate.txt"]); assert.deepEqual(fingerprint(other.repo), before);
});
function realRoot(path) { return realpathSync(execFileSync("git", ["-C", path, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim()); }

test("an arbitrary child directory cannot be mistaken for an independent repository", t => {
  const f = fixture(t); mkdirSync(join(f.repo, "child"));
  const r = run({ repo: join(f.repo, "child") }); assert.equal(r.code, 2); assert.match(r.data.errors[0].message, /repository root/);
});

test("symlinks are inspected as Git blobs without following an ignored target", { skip: process.platform === "win32" && "requires symlink creation privilege" }, t => {
  const f = fixture(t); f.put(".scratch/private.txt", "do not traverse"); symlinkSync(".scratch/private.txt", join(f.repo, "link")); f.g("add", "link");
  const r = run(f); assert.equal(r.code, 0); assert.equal(r.data.files[0].mode, "120000");
  assert.equal(r.data.files[0].gitBlobBytes, Buffer.byteLength(".scratch/private.txt"));
});

test("Git subprocesses receive lazy-fetch/optional-lock protection and only read commands", { skip: process.platform === "win32" && "POSIX executable wrapper; remaining fixtures are portable" }, t => {
  const f = fixture(t), realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const bin = join(f.repo, ".scratch/bin"); mkdirSync(bin, { recursive: true });
  const wrapper = join(bin, "git"), log = join(f.repo, ".scratch/calls.jsonl");
  writeFileSync(wrapper, `#!${process.execPath}\nconst {appendFileSync}=require('node:fs');const {spawnSync}=require('node:child_process');appendFileSync(${JSON.stringify(log)},JSON.stringify({args:process.argv.slice(2),lazy:process.env.GIT_NO_LAZY_FETCH,locks:process.env.GIT_OPTIONAL_LOCKS})+'\\n');const r=spawnSync(${JSON.stringify(realGit)},process.argv.slice(2),{stdio:'inherit',env:process.env});process.exit(r.status??2);\n`); chmodSync(wrapper, 0o755);
  const r = run(f, ["--ref", "HEAD", "--history"], { PATH: bin + ":" + process.env.PATH }); assert.equal(r.code, 0);
  const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
  for (const c of calls) { assert.equal(c.lazy, "1"); assert.equal(c.locks, "0"); assert.ok(c.args.includes("--no-lazy-fetch")); assert.ok(["rev-parse", "ls-tree", "cat-file", "rev-list"].includes(c.args[c.args.indexOf("-C") + 2])); }
});

test("invalid CLI input returns structured errors", t => {
  const f = fixture(t); const r = run(f, ["--max-objects", "not-a-number"]);
  assert.equal(r.code, 2); assert.equal(r.data.status, "error"); assert.ok(r.data.errors.length);
});

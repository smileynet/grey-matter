// Tests for spike-orchestrate-fixture.mjs: builds real sandboxes in the OS temp dir and needs
// git, tkt and npm on PATH (skipped without tkt). No GitHub repo is ever created here.
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "spike-orchestrate-fixture.mjs");
const hasTkt = !spawnSync("tkt", ["--version"]).error;
const base = mkdtempSync(join(tmpdir(), "gm-fixture-test-"));
after(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

const fixture = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
// NODE_TEST_CONTEXT would make the fixture's own `node --test` report to this runner and exit 0.
const { NODE_TEST_CONTEXT, ...env } = process.env;
const inDir = (dir, cmd, args) =>
  spawnSync(cmd, args, { cwd: dir, env, encoding: "utf8", shell: process.platform === "win32" && cmd === "npm" });

test("create is deterministic, and the frontier holds T1, T2, T3 and T5 with T4 blocked by T1", { skip: !hasTkt }, () => {
  const dir = join(base, "trunk");
  const first = fixture("create", "--dir", dir);
  assert.equal(first.status, 0, first.stderr);
  const second = fixture("create", "--dir", dir, "--force");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(first.stdout).tree, JSON.parse(second.stdout).tree);

  const ready = inDir(dir, "tkt", ["ready", "-o", "json"]).stdout.trim().split(/\r?\n/).map((l) => JSON.parse(l));
  assert.deepEqual(ready.map((t) => String(t.id)).sort(), ["1", "2", "3", "5"]);
  assert.match(readFileSync(join(dir, ".tickets/4-square.md"), "utf8"), /^blocked_by: \["1"\]$/m);
  assert.match(readFileSync(join(dir, ".tickets/config.toml"), "utf8"), /^enabled = false$/m);
});

test("npm test passes fresh and fails after mutating a.js", { skip: !hasTkt }, () => {
  const dir = join(base, "mutate");
  assert.equal(fixture("create", "--dir", dir).status, 0);
  assert.equal(inDir(dir, "npm", ["test"]).status, 0);
  writeFileSync(join(dir, "src/a.js"), "export const add = (x, y) => x - y;\n");
  assert.notEqual(inDir(dir, "npm", ["test"]).status, 0);
});

test("the pr variant refuses without --create-github-repo and leaves nothing behind", () => {
  const dir = join(base, "pr");
  const r = fixture("create", "--variant", "pr", "--dir", dir);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--create-github-repo/);
  assert.equal(existsSync(dir), false);
});

test("create refuses a sandbox inside grey-matter", () => {
  const r = fixture("create", "--dir", join(dirname(SCRIPT), "..", ".scratch", "fixture"));
  assert.equal(r.status, 2);
  assert.match(r.stderr, /outside grey-matter/);
});

test("clean removes a marked sandbox and refuses an unmarked directory", { skip: !hasTkt }, () => {
  const dir = join(base, "clean");
  assert.equal(fixture("create", "--dir", dir).status, 0);
  const r = fixture("clean", "--dir", dir);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).github, null);
  assert.equal(existsSync(dir), false);

  const plain = join(base, "plain");
  mkdirSync(plain);
  const refused = fixture("clean", "--dir", plain);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /marker/);
  assert.equal(existsSync(plain), true);
});

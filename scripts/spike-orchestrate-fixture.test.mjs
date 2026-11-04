// Blocking sandbox authorization and cleanup ownership checks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { SCRIPT, base, fixture } from "./spike-orchestrate-test-fixtures.mjs";

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

test("clean removes a marked sandbox and refuses an unmarked directory", () => {
  const dir = join(base, "clean");
  mkdirSync(dir);
  const init = spawnSync("git", ["init", "-q", dir], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  writeFileSync(join(dir, ".orchestrate-fixture"), "cleanup safety fixture\n");
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

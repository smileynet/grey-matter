// On-demand experimental fixture demonstrations.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hasTkt, base, fixture, inDir } from "./spike-orchestrate-test-fixtures.mjs";

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

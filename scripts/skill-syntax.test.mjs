#!/usr/bin/env node
// Seed syntax/shape defects in disposable skill packs; no real source files are changed.
// Run: node --test scripts/skill-syntax.test.mjs
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkPack } from "./check-skill-syntax.mjs";

function fixture(frontmatter, sidecar) {
  const pack = mkdtempSync(join(tmpdir(), "skill-syntax-"));
  const dir = join(pack, "skills", "bucket", "example");
  mkdirSync(join(dir, "agents"), { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\n${frontmatter}\n---\nSkill body.\n`);
  if (sidecar !== undefined) writeFileSync(join(dir, "agents", "openai.yaml"), sidecar);
  try { return checkPack(pack); } finally { rmSync(pack, { recursive: true, force: true }); }
}
const core = "name: example\ndescription: 'A useful fixture: with details.'";
test("core, host extension and sidecar policy parse together", () => {
  assert.deepEqual(fixture(core + "\ndisable-model-invocation: true\nmetadata:\n  owner: toolkit", "interface:\n  display_name: Example\npolicy:\n  allow_implicit_invocation: false\n"), { status: "pass", metrics: { skills: 1, sidecars: 1 }, errors: [] });
});
for (const [label, frontmatter, sidecar, diagnostic] of [
  ["malformed YAML missed by native validator", "name: [unterminated\ndescription: Example", undefined, /flow sequence/i],
  ["duplicate key", core + "\nname: other", undefined, /unique/],
  ["description array", "name: example\ndescription: [invalid]", undefined, /description must be/],
  ["unquoted description colon", "name: example\ndescription: Review code: the loop and state", undefined, /Nested mappings/],
  ["metadata shape", core + "\nmetadata:\n  owner: [invalid]", undefined, /metadata must map/],
  ["quoted policy boolean", core, "policy:\n  allow_implicit_invocation: 'false'", /must be boolean/],
  ["malformed sidecar", core, "policy: [unterminated", /flow sequence/i],
  ["non-mapping frontmatter", "- name\n- description", undefined, /expected a YAML mapping/],
]) test(`reject ${label}`, () => {
  const result = fixture(frontmatter, sidecar);
  assert.equal(result.status, "fail");
  assert.match(result.errors.join("\n"), diagnostic);
});

test("library imports from Node stdin do not resolve the dash marker as a file", () => {
  const target = new URL("./release-verify.mjs", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-"], { input: `await import(${JSON.stringify(target)}); console.log("import passed");`, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "import passed");
});

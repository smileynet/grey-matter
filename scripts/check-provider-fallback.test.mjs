#!/usr/bin/env node
// Tests for check-provider-fallback.mjs: the scaffolded off state, a valid opt-in, and every
// malformed shape that must fall back to "not allowed".
//
// Run: node --test scripts/check-provider-fallback.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "./check-provider-fallback.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const section = (fields) => `# Project\n\n## Provider fallback\n\n${fields}\n\n## Next section\n\n- **Allowed:** yes\n`;
const OFF = "- **Allowed:** no\n- **Providers, in order:** none\n- **Task classes:** none\n- **Not for:** none\n- **Announce:** yes";
const ON = "- **Allowed:** yes\n- **Providers, in order:** anthropic, openai\n- **Task classes:** implementation, review\n- **Not for:** secrets, release publishing\n- **Announce:** yes";

test("an absent section is valid and not allowed", () => {
  const r = parse("# Project\n\nNo section here.\n");
  assert.equal(r.present, false);
  assert.deepEqual(r.errors, []);
  assert.equal(r.policy.allowed, false);
});

test("the scaffolded off state is valid and not allowed", () => {
  const r = parse(section(OFF));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.policy, { allowed: false, reason: "Allowed: no" });
});

test("a valid opt-in yields the ordered policy, and fields after the section are ignored", () => {
  const r = parse(section(ON));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.policy, { allowed: true, providers: ["anthropic", "openai"], tasks: ["implementation", "review"], notFor: ["secrets", "release publishing"], announce: true });
});

for (const [name, fields, pattern] of [
  ["a missing field", ON.replace(/- \*\*Announce:\*\* yes/, ""), /missing field "Announce"/],
  ["a non yes/no value", ON.replace("**Allowed:** yes", "**Allowed:** maybe"), /must be yes or no/],
  ["an unknown provider", ON.replace("anthropic, openai", "anthropic, acme"), /unknown provider "acme"/],
  ["an unknown task class", ON.replace("implementation, review", "implementation, deploys"), /unknown task class "deploys"/],
  ["an unknown field", `${ON}\n- **Budget:** 10`, /unknown field "Budget"/],
  ["a duplicated field", `${ON}\n- **Allowed:** yes`, /appears twice/],
  ["yes with no providers", ON.replace("anthropic, openai", "none"), /needs at least one provider/],
  ["no with providers still listed", ON.replace("**Allowed:** yes", "**Allowed:** no"), /must list "none"/],
]) {
  test(`${name} is invalid and falls back to not allowed`, () => {
    const r = parse(section(fields));
    assert.ok(r.errors.some((e) => pattern.test(e)), r.errors.join("; "));
    assert.equal(r.policy.allowed, false);
  });
}

test("two sections are invalid", () => {
  const r = parse(`${section(OFF)}\n## Provider fallback\n\n${OFF}\n`);
  assert.ok(r.errors.some((e) => /2 "## Provider fallback" sections/.test(e)));
});

test("this repo's AGENTS.md carries a valid section that does not opt in", () => {
  const r = parse(readFileSync(join(ROOT, "AGENTS.md"), "utf8"));
  assert.equal(r.present, true);
  assert.deepEqual(r.errors, []);
  assert.equal(r.policy.allowed, false);
});

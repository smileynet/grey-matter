// On-demand model ceiling, version and availability expectations.
// Fake CLI fixtures only; no login, live model or user settings are used.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CEILINGS } from "./probe-critic-model.mjs";
import { posixOnly, sandbox, windowsCodexShim, probeWith } from "./probe-critic-model-fixtures.mjs";

test("Kiro has no model record: unverified, and reported below ceiling when Opus 5.5 is missing", { skip: posixOnly }, async (t) => {
  const missing = await probeWith(sandbox(t), "kiro");
  assert.equal(missing.status, "unverified");
  assert.equal(missing.requested, "claude-opus-4.5");
  assert.match(missing.level, /below ceiling \(model unverified\)/);
  assert.equal(missing.refusesMissingModel, "pass");
  const present = await probeWith(sandbox(t, { kiroHasOpus55: true }), "kiro");
  assert.equal(present.requested, "claude-opus-5-5");
  assert.match(present.level, /at ceiling \(model unverified\)/);
});

test("a model below the ceiling is reported, not hidden", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { codexModel: "gpt-5.6-sol", claudeModel: "claude-sonnet-5-5", opencodeModel: "glm-5.3-flash" });
  for (const h of ["claude", "codex", "opencode"]) {
    const r = await probeWith(env, h);
    assert.equal(r.status, "below-ceiling", h);
    assert.equal(r.level, "below ceiling", h);
  }
});

test("Codex below the documented GPT-6.1 Terra minimum reports the floor before a model call", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { codexVersion: "0.158.9" });
  const r = await probeWith(env, "codex", { ceilings: { ...CEILINGS, codex: "gpt-6.1-terra" } });
  assert.equal(r.status, "unsupported-version");
  assert.match(r.note, /minimum 0\.159\.0/);
  assert.deepEqual(readFileSync(join(env.CODEX_HOME, "calls.log"), "utf8").trim().split(/\r?\n/), ["--version"]);
});

test("a GPT-6.1 Sol rejection stays an availability diagnostic because no CLI floor is published", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { codexVersion: "0.158.9", solUnsupported: true });
  const r = await probeWith(env, "codex");
  assert.equal(r.status, "model-unavailable");
  assert.match(r.note, /no documented CLI minimum/i);
  assert.match(r.note, /plan, client and workspace/i);
  assert.doesNotMatch(r.note, /HTTP 400|status\\":400/);
});

test("Codex .cmd rejects a below-floor Terra version before invoking a model", { skip: process.platform !== "win32" }, async (t) => {
  const env = windowsCodexShim(t, { version: "0.158.9" });
  const r = await probeWith(env, "codex", { ceilings: { ...CEILINGS, codex: "gpt-6.1-terra" } });
  assert.equal(r.status, "unsupported-version");
  assert.match(r.note, /minimum 0\.159\.0/);
  assert.deepEqual(readFileSync(env.log, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line)).map((args) => args[0]), ["--version"]);
});

test("Codex .cmd Sol unsupported response explains the unresolved model availability", { skip: process.platform !== "win32" }, async (t) => {
  const env = windowsCodexShim(t, { version: "0.158.9", solUnsupported: true });
  const r = await probeWith(env, "codex");
  assert.equal(r.status, "model-unavailable");
  assert.match(r.note, /no documented CLI minimum/i);
  assert.match(r.note, /plan, client and workspace/i);
  assert.doesNotMatch(r.note, /HTTP 400|status\\":400/);
});


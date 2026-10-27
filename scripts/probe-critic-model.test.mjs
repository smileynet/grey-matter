#!/usr/bin/env node
// Tests for probe-critic-model.mjs. Every test puts fake claude, codex, opencode and kiro-cli
// binaries first on PATH and uses a throwaway CODEX_HOME; no real CLI, login or model decides
// the outcome and no model call is made.
//
// Run: node --test scripts/probe-critic-model.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probe } from "./probe-critic-model.mjs";

const unix = process.platform !== "win32";

function exe(dir, name, body) {
  writeFileSync(join(dir, name), `#!/bin/sh\n${body}\n`);
  chmodSync(join(dir, name), 0o755);
}

// A sandbox of fake CLIs. `opts` switches behaviours the real tools show.
function sandbox(t, opts = {}) {
  const root = mkdtempSync(join(tmpdir(), "gm-critic-"));
  const bin = join(root, "bin"), codexHome = join(root, "codex");
  mkdirSync(bin); mkdirSync(codexHome);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const only = opts.only ?? ["claude", "codex", "opencode", "kiro-cli"];
  if (only.includes("claude")) exe(bin, "claude", `
[ "$1" = "--version" ] && { echo "2.1.999 (Claude Code)"; exit 0; }
${opts.auth ? `echo '{"is_error":true,"result":"Failed to authenticate: OAuth session expired and could not be refreshed","modelUsage":{}}'; exit 1` : ""}
case "$*" in *no-such-model*) echo '{"is_error":true,"result":"There is an issue with the selected model","modelUsage":{}}'; exit 1;; esac
echo '{"is_error":false,"result":"OK","modelUsage":${opts.noUsage ? "{}" : `{"${opts.claudeModel ?? "claude-opus-5-5"}":{"inputTokens":2}}`}}'`);
  if (only.includes("codex")) exe(bin, "codex", `
[ "$1" = "--version" ] && { echo "codex-cli 0.999.0"; exit 0; }
${opts.auth ? `echo '{"type":"turn.failed","error":{"message":"Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again."}}'; exit 1` : ""}
case "$*" in *no-such-model*) ${opts.accepts ? "" : `echo '{"type":"error","message":"model_not_found"}'; exit 1`};; esac
tid=01aaaaaa-bbbb-cccc-dddd-000000000001
d="$CODEX_HOME/sessions/2026/10/27"; mkdir -p "$d"
echo '{"type":"turn_context","payload":{"model":"${opts.codexModel ?? "gpt-6.1-sol"}","effort":"high"}}' > "$d/rollout-2026-10-27T00-00-00-$tid.jsonl"
echo '{"type":"thread.started","thread_id":"'$tid'"}'
echo '{"type":"item.completed","item":{"type":"agent_message","text":"OK"}}'`);
  if (only.includes("opencode")) exe(bin, "opencode", `
[ "$1" = "--version" ] && { echo "1.99.9"; exit 0; }
if [ "$1" = "export" ]; then echo '{"messages":[{"info":{"role":"assistant","providerID":"zai-coding-plan","modelID":"${opts.opencodeModel ?? "glm-5.3"}","variant":"high"}}]}'; exit 0; fi
case "$*" in *no-such-model*) ${opts.accepts ? "" : `echo '{"type":"error","error":{"name":"UnknownError"}}'; exit 1`};; esac
echo '{"type":"text","sessionID":"ses_fake","part":{"text":"OK"}}'`);
  if (only.includes("kiro-cli")) exe(bin, "kiro-cli", `
[ "$1" = "--version" ] && { echo "kiro-cli 9.9.9"; exit 0; }
case "$*" in
  *--list-models*) printf 'Available models:\\n\\n* auto 1.00x\\n  claude-sonnet-4.6 1.3x\\n  claude-opus-4.5 2.2x\\n  ${opts.kiroHasOpus55 ? "claude-opus-5-5 3x" : "glm-5 0.5x"}\\n'; exit 0;;
  *no-such-model*) ${opts.accepts ? "" : `echo "error: Model 'x' does not exist. Available models: auto" >&2; exit 1`};;
esac
echo "> OK"`);
  return { PATH: `${bin}:/usr/bin:/bin`, CODEX_HOME: codexHome };
}

async function withEnv(env, fn) {
  const saved = { PATH: process.env.PATH, CODEX_HOME: process.env.CODEX_HOME };
  Object.assign(process.env, env);
  try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) v === undefined ? delete process.env[k] : (process.env[k] = v); }
}
const probeWith = (env, h) => withEnv(env, () => probe(h, { timeout: 20 }));

test("each harness records the model it ran on, from its own record", { skip: !unix }, async (t) => {
  const env = sandbox(t, { kiroHasOpus55: true });
  const claude = await probeWith(env, "claude");
  assert.equal(claude.status, "ok"); assert.equal(claude.recorded, "claude-opus-5-5"); assert.equal(claude.evidence, "modelUsage");
  const codex = await probeWith(env, "codex");
  assert.equal(codex.status, "ok"); assert.equal(codex.recorded, "gpt-6.1-sol"); assert.equal(codex.effort, "high"); assert.equal(codex.evidence, "rollout turn_context");
  const oc = await probeWith(env, "opencode");
  assert.equal(oc.status, "ok"); assert.equal(oc.recorded, "zai-coding-plan/glm-5.3"); assert.equal(oc.evidence, "opencode export");
});

test("Kiro has no model record: unverified, and reported below ceiling when Opus 5.5 is missing", { skip: !unix }, async (t) => {
  const missing = await probeWith(sandbox(t), "kiro");
  assert.equal(missing.status, "unverified");
  assert.equal(missing.requested, "claude-opus-4.5");
  assert.match(missing.level, /below ceiling \(model unverified\)/);
  assert.equal(missing.refusesMissingModel, "pass");
  const present = await probeWith(sandbox(t, { kiroHasOpus55: true }), "kiro");
  assert.equal(present.requested, "claude-opus-5-5");
  assert.match(present.level, /at ceiling \(model unverified\)/);
});

test("a model below the ceiling is reported, not hidden", { skip: !unix }, async (t) => {
  const env = sandbox(t, { codexModel: "gpt-5.6-sol", claudeModel: "claude-sonnet-5-5", opencodeModel: "glm-5.3-flash" });
  for (const h of ["claude", "codex", "opencode"]) {
    const r = await probeWith(env, h);
    assert.equal(r.status, "below-ceiling", h);
    assert.equal(r.level, "below ceiling", h);
  }
});

test("expired credentials are reported as not-authenticated, not as a missing model", { skip: !unix }, async (t) => {
  const env = sandbox(t, { auth: true });
  for (const h of ["claude", "codex"]) assert.equal((await probeWith(env, h)).status, "not-authenticated", h);
});

test("a harness that is not installed is unavailable", { skip: !unix }, async (t) => {
  const env = sandbox(t, { only: ["codex"] });
  const r = await probeWith(env, "claude");
  assert.equal(r.status, "unavailable");
  assert.match(r.note, /not on PATH/);
});

test("a result with no usable record is unverified, never ok", { skip: !unix }, async (t) => {
  const r = await probeWith(sandbox(t, { noUsage: true }), "claude");
  assert.equal(r.status, "unverified");
  assert.match(r.note, /no modelUsage/);
});

test("a harness that accepts a model that does not exist fails the missing-model check", { skip: !unix }, async (t) => {
  const env = sandbox(t, { accepts: true, kiroHasOpus55: true });
  for (const h of ["claude", "codex", "opencode", "kiro"]) {
    const r = await probeWith(env, h);
    if (h === "claude") continue; // the fake claude always rejects; the others accept
    assert.match(r.refusesMissingModel, /^FAIL/, h);
  }
});

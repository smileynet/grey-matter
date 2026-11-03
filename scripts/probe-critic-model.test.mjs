#!/usr/bin/env node
// Tests for probe-critic-model.mjs. Every test puts fake claude, codex, opencode and kiro-cli
// binaries first on PATH and uses a throwaway CODEX_HOME; no real CLI, login or model decides
// the outcome and no model call is made.
//
// Run: node --test scripts/probe-critic-model.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { CEILINGS, probe } from "./probe-critic-model.mjs";

const unix = process.platform !== "win32";
// The fake harness binaries are #!/bin/sh scripts, which Windows cannot execute directly.
const posixOnly = unix ? false : "fake harness binaries are POSIX shell scripts";

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
[ "$1" = "--version" ] && { echo "codex-cli ${opts.codexVersion ?? "0.999.0"}"; printf '%s\\n' "$*" >> "$CODEX_HOME/calls.log"; exit 0; }
printf '%s\\n' "$*" >> "$CODEX_HOME/calls.log"
${opts.auth ? `echo '{"type":"turn.failed","error":{"message":"Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again."}}'; exit 1` : ""}
${opts.solUnsupported ? `echo '{"type":"error","status":400,"error":{"type":"invalid_request_error","message":"The gpt-6.1-sol model is not supported when using Codex with a ChatGPT account."}}'; exit 1` : ""}
case "$*" in *no-such-model*) ${opts.accepts ? "" : `echo '{"type":"error","message":"model_not_found"}'; exit 1`};; esac
case "$*" in *patched.txt*)
  ${opts.noAttempt ? `echo '{"type":"item.completed","item":{"type":"agent_message","text":"I would rather not do that."}}'; exit 0;` : ""}
  ${opts.leak ? "echo patch > patched.txt" : ""}
  echo '{"type":"item.completed","item":{"type":"file_change","status":"${opts.leak ? "completed" : "failed"}","changes":[{"path":"patched.txt","kind":"add"}]}}'
  echo '{"type":"item.completed","item":{"type":"agent_message","text":"patch rejected: writing is blocked by read-only sandbox"}}'
  exit 0;;
esac
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

function windowsCodexShim(t, { version = "0.166.0", solUnsupported = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "gm-critic shim & space-"));
  const bin = join(root, "bin"), codexHome = join(root, "codex"), log = join(root, "arguments.jsonl");
  mkdirSync(bin); mkdirSync(codexHome);
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const fake = `
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
appendFileSync(process.env.CODEX_ARGS_LOG, JSON.stringify(args) + "\\n");
if (args[0] === "--version") { console.log("codex-cli ${version}"); process.exit(0); }
if (args.includes("gpt-9-no-such-model")) { console.log(JSON.stringify({ type: "error", message: "model_not_found" })); process.exit(1); }
if (args.some((arg) => arg.includes("patched.txt"))) {
  console.log(JSON.stringify({ type: "item.completed", item: { type: "file_change", status: "failed", changes: [{ path: "patched.txt", kind: "add" }] } }));
  console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "patch rejected: writing is blocked by read-only sandbox" } }));
  process.exit(0);
}
${solUnsupported ? `console.log(JSON.stringify({ type: "error", status: 400, error: { type: "invalid_request_error", message: "The gpt-6.1-sol model is not supported when using Codex with a ChatGPT account." } })); process.exit(1);` : ""}
const tid = "01aaaaaa-bbbb-cccc-dddd-000000000001";
const dir = join(process.env.CODEX_HOME, "sessions", "2026", "10", "27");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "rollout-2026-10-27T00-00-00-" + tid + ".jsonl"), JSON.stringify({ type: "turn_context", payload: { model: "gpt-6.1-sol", effort: "high" } }) + "\\n");
console.log(JSON.stringify({ type: "thread.started", thread_id: tid }));
console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "OK" } }));
`;
  writeFileSync(join(bin, "fake codex.mjs"), fake);
  const shim = join(bin, "codex.cmd");
  writeFileSync(shim, `@echo off\r\n"%GM_NODE_EXE%" "%~dp0fake codex.mjs" %*\r\nexit /b %ERRORLEVEL%\r\n`);
  const appData = join(root, "appdata");
  mkdirSync(appData);
  const env = {
    ...process.env,
    PATH: bin,
    CODEX_HOME: codexHome,
    CODEX_ARGS_LOG: log,
    GM_NODE_EXE: process.execPath,
    CODEX_APP_RUNTIME_CLI_PATH: "",
    OPENAI_API_KEY: "",
    HOME: root,
    USERPROFILE: root,
    APPDATA: appData,
    LOCALAPPDATA: appData,
  };
  const powershell = join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const resolved = spawnSync(powershell, ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", "(Get-Command -Name 'codex' -CommandType Application).Source"], { env, encoding: "utf8" });
  assert.equal(resolved.status, 0, resolved.stderr);
  assert.equal(resolve(resolved.stdout.trim()), resolve(shim), "PowerShell must resolve only the owned .cmd fixture");
  return { ...env, log };
}

async function withEnv(env, fn) {
  const saved = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));
  Object.assign(process.env, env);
  try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) v === undefined ? delete process.env[k] : (process.env[k] = v); }
}
const probeWith = (env, h, options = {}) => withEnv(env, () => probe(h, { timeout: 20, ...options }));

test("each harness records the model it ran on, from its own record", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { kiroHasOpus55: true });
  const claude = await probeWith(env, "claude");
  assert.equal(claude.status, "ok"); assert.equal(claude.recorded, "claude-opus-5-5"); assert.equal(claude.evidence, "modelUsage");
  const codex = await probeWith(env, "codex");
  assert.equal(codex.status, "ok"); assert.equal(codex.recorded, "gpt-6.1-sol"); assert.equal(codex.effort, "high"); assert.equal(codex.evidence, "rollout turn_context");
  const oc = await probeWith(env, "opencode");
  assert.equal(oc.status, "ok"); assert.equal(oc.recorded, "zai-coding-plan/glm-5.3"); assert.equal(oc.evidence, "opencode export");
});

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

test("Codex reaches a .cmd shim through a path with spaces and metacharacters", { skip: process.platform !== "win32" }, async (t) => {
  const env = windowsCodexShim(t);
  const r = await probeWith(env, "codex", { ceilings: CEILINGS });
  assert.equal(r.status, "ok");
  assert.match(r.version, /0\.166\.0/);
  const calls = readFileSync(env.log, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.equal(calls[0][0], "--version");
  assert.ok(calls.some((args) => args[0] === "exec" && args.includes("gpt-9-no-such-model")));
});

test("a canonical Codex model ID remains one argument through a .cmd shim under a path with metacharacters", { skip: process.platform !== "win32" }, async (t) => {
  const env = windowsCodexShim(t);
  const model = "org/gpt-6.1-sol";
  const r = await probeWith(env, "codex", { ceilings: { ...CEILINGS, codex: model } });
  assert.equal(r.status, "below-ceiling");
  const calls = readFileSync(env.log, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
  assert.ok(calls.some((args) => args[args.indexOf("-m") + 1] === model));
});

test("unsafe Codex model IDs are rejected before any .cmd shim invocation", { skip: process.platform !== "win32" }, async (t) => {
  const env = windowsCodexShim(t);
  for (const model of ["gpt-6.1-sol & echo INJECTED", "gpt-6.1-sol%PATH%", "gpt-6.1-sol!GM_SENTINEL!", "gpt-6.1-sol`quoted`", "-gpt-6.1-sol"]) {
    const r = await probeWith(env, "codex", { ceilings: { ...CEILINGS, codex: model } });
    assert.equal(r.status, "invalid-model-id");
    assert.doesNotMatch(r.note, /HTTP 400/);
  }
  assert.equal(existsSync(env.log), false, "invalid IDs must be rejected before even --version reaches the shim");
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

test("expired credentials are reported as not-authenticated, not as a missing model", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { auth: true });
  for (const h of ["claude", "codex"]) assert.equal((await probeWith(env, h)).status, "not-authenticated", h);
});

test("a harness that is not installed is unavailable", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { only: ["codex"] });
  const r = await probeWith(env, "claude");
  assert.equal(r.status, "unavailable");
  assert.match(r.note, /not on PATH/);
});

test("a result with no usable record is unverified, never ok", { skip: posixOnly }, async (t) => {
  const r = await probeWith(sandbox(t, { noUsage: true }), "claude");
  assert.equal(r.status, "unverified");
  assert.match(r.note, /no modelUsage/);
});

test("a harness that accepts a model that does not exist fails the missing-model check", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { accepts: true, kiroHasOpus55: true });
  for (const h of ["claude", "codex", "opencode", "kiro"]) {
    const r = await probeWith(env, h);
    if (h === "claude") continue; // the fake claude always rejects; the others accept
    assert.match(r.refusesMissingModel, /^FAIL/, h);
  }
});

test("Codex's read-only mode is shown to hold by a forced write attempt", { skip: posixOnly }, async (t) => {
  const held = await probeWith(sandbox(t), "codex");
  assert.equal(held.status, "ok");
  assert.equal(held.readOnly, "enforced (attempt rejected)");
  const leaked = await probeWith(sandbox(t, { leak: true }), "codex");
  assert.equal(leaked.status, "failed-containment");
  assert.match(leaked.readOnly, /^FAIL/);
});

test("a Codex critic that only declines to write leaves the boundary unproven", { skip: posixOnly }, async (t) => {
  const r = await probeWith(sandbox(t, { noAttempt: true }), "codex");
  assert.equal(r.status, "ok");
  assert.match(r.readOnly, /^no write .*unproven/);
});

import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { probe } from "./probe-critic-model.mjs";

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

export { posixOnly, exe, sandbox, windowsCodexShim, probeWith };

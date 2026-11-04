// Fake CLI fixtures only; no login, live model or user settings are used.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { CEILINGS } from "./probe-critic-model.mjs";
import { posixOnly, exe, sandbox, windowsCodexShim, probeWith } from "./probe-critic-model-fixtures.mjs";

test("each harness records the model it ran on, from its own record", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { kiroHasOpus55: true });
  const claude = await probeWith(env, "claude");
  assert.equal(claude.status, "ok"); assert.equal(claude.recorded, "claude-opus-5-5"); assert.equal(claude.evidence, "modelUsage");
  const codex = await probeWith(env, "codex");
  assert.equal(codex.status, "ok"); assert.equal(codex.recorded, "gpt-6.1-sol"); assert.equal(codex.effort, "high"); assert.equal(codex.evidence, "rollout turn_context");
  const oc = await probeWith(env, "opencode");
  assert.equal(oc.status, "ok"); assert.equal(oc.recorded, "zai-coding-plan/glm-5.3"); assert.equal(oc.evidence, "opencode export");
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

test("one harness shares a deadline and never treats timeout as model rejection", { skip: posixOnly }, async (t) => {
  const env = sandbox(t, { only: ["claude"] });
  const bin = env.PATH.split(":")[0];
  exe(bin, "claude", '[ "$1" = "--version" ] && { echo "2.1.999"; exit 0; }\nexec sleep 2');
  const start = Date.now();
  const r = await probeWith(env, "claude", { timeout: 0.3 });
  assert.equal(r.status, "timed-out");
  assert.notEqual(r.refusesMissingModel, "pass");
  assert.ok(Date.now() - start < 1000, "all calls share the harness budget");
});

test("CLI streams a finished harness before starting the next result", { skip: posixOnly }, async (t) => {
  const env = sandbox(t);
  const bin = env.PATH.split(":")[0], release = join(bin, "release");
  writeFileSync(join(bin, "opencode"), `#!${process.execPath}\nimport {existsSync} from "node:fs";\nif (process.argv.includes("--version")) { const end = Date.now() + 1500; while (!existsSync(process.env.PROBE_RELEASE) && Date.now() < end) {} if (!existsSync(process.env.PROBE_RELEASE)) process.exit(1); console.log("1.99.9"); } else process.exit(1);\n`);
  chmodSync(join(bin, "opencode"), 0o755);
  const child = spawn(process.execPath, [resolve("scripts/probe-critic-model.mjs"), "--harness", "claude,opencode", "--timeout", "2"], { env: { ...process.env, ...env, PROBE_RELEASE: release } });
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
    if (/claude\s+ok/.test(output)) writeFileSync(release, "continue");
  });
  await new Promise((done, reject) => { child.on("error", reject); child.on("close", done); });
  assert.ok(existsSync(release), output);
  assert.match(output, /opencode\s+failed\s+1.99.9/);
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

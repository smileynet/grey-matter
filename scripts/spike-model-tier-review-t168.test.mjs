import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  LAUNCHERS,
  PROTOCOL_NOTE_SHA256,
  buildArgv,
  buildCellPlan,
  buildPrompt,
  classifyRun,
  extractClaude,
  extractCodex,
  extractKiro,
  isUsageLimit,
  readFixture,
} from "./spike-model-tier-review-t168.mjs";

const samplePrompt = "ticket says keep this string; diff has 'quotes' and\nnewlines";
const dryRunDir = "C:\\Temp\\gm t168 dry run";
const controllerPath = fileURLToPath(new URL("./spike-model-tier-review-t168.mjs", import.meta.url));
const protocolPath = fileURLToPath(new URL("../docs/agents/research/model-tier-review-20261102.md", import.meta.url));
const recorderCode = "process.stdout.write(JSON.stringify(process.argv.slice(1)))";

function recordArgv(args) {
  const result = spawnSync(process.execPath, ["-e", recorderCode, "--", ...args], {
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("frozen fixtures expose only ticket and diff to prompt assembly", () => {
  for (const fixtureId of ["f1", "f2", "f3", "f4"]) {
    const fixture = readFixture(fixtureId);
    const built = buildPrompt(fixture.ticket, fixture.diff);
    assert.deepEqual(Object.keys(fixture).sort(), ["bytes", "diff", "fixtureHash", "ticket"]);
    assert.ok(built.prompt.includes(fixture.ticket));
    assert.ok(built.prompt.includes(fixture.diff));
    assert.doesNotMatch(built.prompt, /haiku|gpt-6-luna|qwen3-coder-next|provider.?tier/i);
  }
});

test("execution guard is bound to the current protocol note bytes", () => {
  const actual = createHash("sha256").update(readFileSync(protocolPath)).digest("hex");
  assert.equal(actual, PROTOCOL_NOTE_SHA256);
});

test("provider argv uses absolute verified sources and keeps prompt as one explicit final argument", () => {
  assert.equal(LAUNCHERS.claude.executable, `${process.env.USERPROFILE}\\.local\\bin\\claude.exe`);
  assert.equal(LAUNCHERS.kiro.executable, `${process.env.LOCALAPPDATA}\\Kiro-Cli\\kiro-cli.exe`);
  for (const provider of ["claude", "codex", "kiro"]) {
    for (const tier of ["cheap", "default"]) {
      const args = buildArgv(provider, tier, samplePrompt, dryRunDir);
      assert.equal(args.at(-1), samplePrompt);
      assert.deepEqual(recordArgv(args), args);
      assert.ok(LAUNCHERS[provider].executable.includes(":"));
      assert.equal(args.includes("-"), false);
      assert.equal(args.includes("--effort"), false);
    }
  }
});

test("cheap and native-default invocations follow frozen model and safety flags", () => {
  const claudeCheap = buildArgv("claude", "cheap", samplePrompt, dryRunDir);
  const claudeDefault = buildArgv("claude", "default", samplePrompt, dryRunDir);
  assert.deepEqual(claudeCheap.slice(claudeCheap.indexOf("--model")), ["--model", "haiku", samplePrompt]);
  assert.equal(claudeDefault.includes("--model"), false);
  assert.ok(claudeCheap.includes("--safe-mode"));
  assert.ok(claudeCheap.includes("--strict-mcp-config"));
  assert.deepEqual(claudeCheap.slice(claudeCheap.indexOf("--mcp-config"), claudeCheap.indexOf("--mcp-config") + 2), ["--mcp-config", '{"mcpServers":{}}']);
  assert.equal(claudeCheap[claudeCheap.indexOf("--tools") + 1], "");
  assert.deepEqual(claudeCheap.slice(claudeCheap.indexOf("--disallowedTools"), claudeCheap.indexOf("--disallowedTools") + 2), ["--disallowedTools", "mcp__*"]);
  assert.ok(claudeCheap.includes("--no-session-persistence"));

  const codexCheap = buildArgv("codex", "cheap", samplePrompt, dryRunDir);
  const codexDefault = buildArgv("codex", "default", samplePrompt, dryRunDir);
  assert.ok(codexCheap.includes("--ignore-user-config"));
  assert.ok(codexCheap.includes("--skip-git-repo-check"));
  assert.ok(codexCheap.includes("--sandbox") && codexCheap.includes("read-only"));
  assert.deepEqual(codexCheap.slice(codexCheap.indexOf("--model")), ["--model", "gpt-6-luna", samplePrompt]);
  assert.equal(codexDefault.includes("--model"), false);

  const kiroCheap = buildArgv("kiro", "cheap", samplePrompt, dryRunDir);
  const kiroDefault = buildArgv("kiro", "default", samplePrompt, dryRunDir);
  assert.ok(kiroCheap.includes("--trust-tools="));
  assert.deepEqual(kiroCheap.slice(kiroCheap.indexOf("--model")), ["--model", "qwen3-coder-next", samplePrompt]);
  assert.equal(kiroDefault.includes("--model"), false);
});

test("Google/Agy and the omitted Claude cell cannot be scheduled", () => {
  assert.throws(() => buildArgv("google", "cheap", samplePrompt, dryRunDir), /not permitted/);
  assert.throws(() => buildCellPlan({ provider: "agy", fixtureId: "f1", tier: "cheap", cellId: "R01", workDir: dryRunDir }), /safety-blocked/);
  assert.throws(() => buildCellPlan({ provider: "claude", fixtureId: "f1", tier: "cheap", cellId: "R01", workDir: dryRunDir }), /omitted/);
});

test("dry-run emits a plan; execution without parent authorization stops before launching", () => {
  const dryRun = spawnSync(process.execPath, [controllerPath, "--provider", "codex", "--fixture", "f1", "--tier", "cheap", "--cell-id", "R01"], {
    encoding: "utf8", shell: false, windowsHide: true,
  });
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const plan = JSON.parse(dryRun.stdout);
  assert.equal(plan.mode, "dry-run");
  assert.equal(plan.requestedModel, "gpt-6-luna");
  assert.equal(plan.shell, false);
  assert.match(plan.controllerSha256, /^[a-f0-9]{64}$/);

  const execution = spawnSync(process.execPath, [controllerPath, "--provider", "codex", "--fixture", "f1", "--tier", "cheap", "--cell-id", "R02", "--execute"], {
    encoding: "utf8", shell: false, windowsHide: true,
  });
  assert.equal(execution.status, 1);
  assert.match(execution.stderr, /requires an explicit parent authorization receipt/);
});

test("Claude only counts a native success envelope as terminal", () => {
  const ok = extractClaude(Buffer.from(JSON.stringify({
    type: "result", subtype: "success", result: '{"findings":[],"noFindings":true}', is_error: false,
    session_id: "session-one", usage: { input_tokens: 1 }, modelUsage: { haiku: { canonicalModel: "claude-haiku", costBasis: "reported" } }, total_cost_usd: 0.03,
  })));
  assert.equal(classifyRun({ status: 0, error: null }, ok), "completed-review");
  assert.equal(ok.cost.amountUsd, 0.03);
  assert.equal(ok.actualModel, "claude-haiku");
  const empty = extractClaude(Buffer.alloc(0));
  assert.equal(classifyRun({ status: 0, error: null }, empty), "infrastructure-error");
  const nested = extractClaude(Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "{}", error: { code: "nested" } })));
  assert.equal(classifyRun({ status: 0, error: null }, nested), "infrastructure-error");
});

test("Codex requires turn.completed and treats nested errors as infrastructure failures", () => {
  const text = [
    JSON.stringify({ type: "thread.started", thread_id: "thread-one" }),
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: '{"findings":[],"noFindings":true}' } }),
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 4 } }),
  ].join("\n");
  const ok = extractCodex(Buffer.from(text));
  assert.equal(classifyRun({ status: 0, error: null }, ok), "completed-review");
  assert.equal(ok.threadId, "thread-one");
  const missing = extractCodex(Buffer.from(JSON.stringify({ type: "thread.started", thread_id: "thread-two" })));
  assert.equal(classifyRun({ status: 0, error: null }, missing), "missing-terminal-event");
  const nested = extractCodex(Buffer.from([
    JSON.stringify({ type: "item.completed", item: { type: "error", error: { message: "native failure" } } }),
    JSON.stringify({ type: "turn.completed" }),
  ].join("\n")));
  assert.equal(classifyRun({ status: 0, error: null }, nested), "infrastructure-error");
});

test("Kiro requires a successful runFinished end_turn and captures its session ID", () => {
  const ok = extractKiro(Buffer.from([
    JSON.stringify({ type: "runStarted", data: { sessionId: "kiro-session" } }),
    JSON.stringify({ type: "runFinished", data: { sessionId: "kiro-session", status: "success", stopReason: "end_turn", finalText: '{"findings":[],"noFindings":true}' } }),
  ].join("\n")));
  assert.equal(classifyRun({ status: 0, error: null }, ok), "completed-review");
  assert.equal(ok.sessionId, "kiro-session");
  const empty = extractKiro(Buffer.alloc(0));
  assert.equal(classifyRun({ status: 0, error: null }, empty), "missing-terminal-event");
  const nested = extractKiro(Buffer.from(JSON.stringify({ type: "runFinished", data: { status: "success", stopReason: "end_turn", finalText: "{}", error: { message: "nested" } } })));
  assert.equal(classifyRun({ status: 0, error: null }, nested), "infrastructure-error");
});

test("process errors and nonzero exits are not successful reviews", () => {
  const native = { terminal: true, explicitFailure: false, malformedLines: [], errors: [], responseText: '{"findings":[],"noFindings":true}' };
  assert.equal(classifyRun({ status: null, error: { code: "ETIMEDOUT" } }, native), "timeout");
  assert.equal(classifyRun({ status: null, error: { code: "ENOENT" } }, native), "infrastructure-error");
  assert.equal(classifyRun({ status: 1, error: null }, native), "provider-process-failure");
  assert.equal(classifyRun({ status: 0, error: null }, { ...native, responseText: "" }), "empty-response");
  assert.equal(classifyRun({ status: 0, error: null }, { ...native, responseText: '{"findings":[],"noFindings":true,"message":"I am unable to review this diff"}' }), "denied-required-action");
  assert.equal(classifyRun({ status: 1, error: null }, { ...native, usageLimit: true }), "usage-limit");
  assert.equal(isUsageLimit("Request rate limit reached"), true);
  assert.equal(isUsageLimit("The report discusses a usage limit as a possibility"), false);
});

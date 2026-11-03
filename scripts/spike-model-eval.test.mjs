import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { claudeArgs, codexArgs, parseClaudeOutput, parseCodexOutput, parseTestCounts, testCommand, classifyResult } from "./spike-model-eval.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(ROOT, "fixtures", "model-eval");
const TEST_ROOT = mkdtempSync(join(tmpdir(), "spike-model-eval-test-"));
after(() => rmSync(TEST_ROOT, { recursive: true, force: true, maxRetries: 3 }));

test("T1 and T3 pin the same deterministic seed and differ in grader expectations", () => {
  const t1 = JSON.parse(readFileSync(join(FIXTURES, "t1.json"), "utf8"));
  const t3 = JSON.parse(readFileSync(join(FIXTURES, "t3.json"), "utf8"));

  assert.equal(t1.seedTree, t3.seedTree);
  assert.equal(t1.expectedExport, "multiply");
  assert.equal(t3.expectedExport, "sum");
  assert.equal(t3.forbiddenExport, "add");
});

test("native adapter arguments keep the prompt as one value and scope Codex", () => {
  const prompt = "Task text with spaces";
  const claude = claudeArgs("sonnet", "low", "0.50", prompt);
  const codex = codexArgs("gpt-6.1-sol", "low", "C:\\temp\\fixture", prompt);

  assert.equal(claude.at(1), prompt);
  assert.equal(claude.at(-1), "Bash(npm test)");
  assert.ok(claude.includes("--no-session-persistence"));
  assert.ok(codex.includes("--ephemeral"));
  assert.ok(codex.includes("--sandbox"));
  assert.ok(codex.includes("workspace-write"));
  assert.ok(codex.includes('model_reasoning_effort="low"'));
  assert.equal(codex.at(-1), prompt);
});

test("Claude usage retains model and list cost provenance", () => {
  const result = parseClaudeOutput(JSON.stringify({
    type: "result",
    subtype: "success",
    session_id: "session-123",
    total_cost_usd: 0.104,
    usage: { input_tokens: 10, output_tokens: 20 },
    modelUsage: { sonnet: { canonicalModel: "claude-sonnet-5-5", costBasis: "list" } },
  }));

  assert.equal(result.complete, true);
  assert.equal(result.sessionId, "session-123");
  assert.equal(result.actualModel, "claude-sonnet-5-5");
  assert.deepEqual(result.cost, { amountUsd: 0.104, basis: "list" });
});

test("Codex JSONL reports usage but no dollar amount or observed model", () => {
  const result = parseCodexOutput([
    JSON.stringify({ type: "thread.started", thread_id: "fixture-thread" }),
    JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "& 'C:\\tools\\node\\npm.cmd' test", exit_code: 0, status: "completed" } }),
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 91, cached_input_tokens: 80, output_tokens: 12 } }),
  ].join("\n"));

  assert.equal(result.complete, true);
  assert.equal(result.threadId, "fixture-thread");
  assert.equal(result.actualModel, null);
  assert.equal(result.cost, null);
  assert.deepEqual(result.usage, { input_tokens: 91, cached_input_tokens: 80, output_tokens: 12 });
  assert.deepEqual(result.testRuns, [{ status: "completed", command: "& 'C:\\tools\\node\\npm.cmd' test", exitCode: 0 }]);
});

test("test output parser distinguishes failures and no reported counts", () => {
  assert.deepEqual(parseTestCounts("# tests 2\n# pass 2\n# fail 0\n# skipped 0\n# cancelled 0\n"), {
    tests: 2, pass: 2, fail: 0, skipped: 0, cancelled: 0,
  });
  assert.deepEqual(parseTestCounts("not a TAP summary"), {
    tests: null, pass: null, fail: null, skipped: null, cancelled: null,
  });
});

test("classification refuses zero tests, malformed output, and native turn failures", () => {
  const base = {
    agent: { status: 0, error: null, errorCode: null },
    adapterResult: { complete: true, turnFailed: false },
    fileGrade: { outOfScope: [], sourceAndTestChecksPass: true },
    seedUnchanged: true,
    test: { status: 0 },
    testCounts: { tests: 0, pass: 0, fail: 0, skipped: 0, cancelled: 0 },
    behavior: { status: 0 },
  };

  assert.equal(classifyResult(base), "no-tests");
  assert.equal(classifyResult({ ...base, adapterResult: { ...base.adapterResult, malformedLines: [2] } }), "malformed-output");
  assert.equal(classifyResult({ ...base, adapterResult: { ...base.adapterResult, turnFailed: true } }), "turn-failed");
  assert.equal(classifyResult({ ...base, testCounts: { tests: 1, pass: 1, fail: 0, skipped: 0, cancelled: 0 } }), "pass");
});

test("controller npm test uses the active Node executable path without inherited secrets", () => {
  const workDir = join(TEST_ROOT, "package");
  mkdirSync(join(workDir, "test"), { recursive: true });
  writeFileSync(join(workDir, "package.json"), JSON.stringify({ private: true, type: "module", scripts: { test: "node --test" } }));
  writeFileSync(join(workDir, "test", "one.test.mjs"), "import { test } from 'node:test'; test('one', () => {});\n");

  const result = testCommand(workDir, process.execPath);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /# pass 1/);
});

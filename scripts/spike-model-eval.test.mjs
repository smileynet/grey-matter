import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { claudeArgs, codexArgs, parseClaudeOutput, parseCodexOutput, parseTestCounts, testCommand, classifyResult, changedFilesSince, freezeFixture } from "./spike-model-eval.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(ROOT, "fixtures", "model-eval");
const TEST_ROOT = mkdtempSync(join(tmpdir(), "spike-model-eval-test-"));
after(() => rmSync(TEST_ROOT, { recursive: true, force: true, maxRetries: 3 }));

function createGitFixture(name) {
  const repo = join(TEST_ROOT, name);
  mkdirSync(repo, { recursive: true });
  const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  git("init", "--quiet");
  writeFileSync(join(repo, "tracked.txt"), "seed\n");
  writeFileSync(join(repo, ".gitignore"), "ignored.txt\n");
  git("add", "tracked.txt", ".gitignore");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "--quiet", "-m", "seed");
  return { repo, git, seedCommit: git("rev-parse", "HEAD").trim() };
}

test("T1 and T3 pin the same deterministic seed and differ in grader expectations", () => {
  const t1 = JSON.parse(readFileSync(join(FIXTURES, "t1.json"), "utf8"));
  const t3 = JSON.parse(readFileSync(join(FIXTURES, "t3.json"), "utf8"));

  assert.equal(t1.seedTree, t3.seedTree);
  assert.equal(t1.expectedExport, "multiply");
  assert.equal(t3.expectedExport, "sum");
  assert.equal(t3.forbiddenExport, "add");
});

test("the pinned dashboard restores the seed while other fixture drift is rejected without a model call", () => {
  const workDir = join(TEST_ROOT, "pinned-seed-work");
  const evidenceDir = join(TEST_ROOT, "pinned-seed-evidence");
  // Node rejects Claude arguments; this exercises fixture setup without calling a model.
  assert.throws(() => execFileSync(process.execPath, [join(ROOT, "spike-model-eval.mjs"),
    "--adapter", "claude", "--fixture", "t1", "--model", "fake",
    "--claude-exe", process.execPath, "--work-dir", workDir, "--evidence-dir", evidenceDir,
  ], { encoding: "utf8", stdio: "pipe" }));
  const result = JSON.parse(readFileSync(join(evidenceDir, "result.json"), "utf8"));
  const task = JSON.parse(readFileSync(join(FIXTURES, "t1.json"), "utf8"));
  assert.equal(result.fixture.seedTree, task.seedTree);
  assert.equal(result.grading.seedTreeMatches, true);
  assert.equal(result.grading.status, "agent-process-failure");

  writeFileSync(join(workDir, "unexpected.txt"), "unrelated drift\n");
  execFileSync("git", ["add", "--", "unexpected.txt"], { cwd: workDir });
  assert.throws(() => freezeFixture(workDir, task.seedTree), /fixture seed changed/);
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
  assert.deepEqual(result.infrastructureErrors, []);
});

test("Codex nested execution-host error stays an infrastructure failure after turn completion", () => {
  const result = parseCodexOutput([
    JSON.stringify({ type: "thread.started", thread_id: "fixture-thread" }),
    JSON.stringify({ type: "item.completed", item: { type: "error", message: "host executable missing" } }),
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 2 } }),
  ].join("\n"));

  assert.equal(result.complete, true);
  assert.equal(result.turnFailed, false);
  assert.deepEqual(result.infrastructureErrors, ["host executable missing"]);
  assert.equal(classifyResult({
    agent: { status: 0, error: null, errorCode: null },
    adapterResult: result,
    fileGrade: { outOfScope: [], sourceAndTestChecksPass: false },
    seedUnchanged: true,
    test: { status: 0 },
    testCounts: { tests: 1, pass: 1, fail: 0, skipped: 0, cancelled: 0 },
    behavior: { status: 1 },
  }), "infrastructure-error");
});

test("Codex ordinary nonzero command completion is not an infrastructure error", () => {
  const result = parseCodexOutput([
    JSON.stringify({ type: "item.completed", item: { type: "command_execution", command: "node missing.js", exit_code: 1, status: "completed" } }),
    JSON.stringify({ type: "turn.completed", usage: { input_tokens: 10, output_tokens: 2 } }),
  ].join("\n"));

  assert.equal(result.complete, true);
  assert.deepEqual(result.infrastructureErrors, []);
  assert.deepEqual(result.toolCommands, [{ status: "completed", command: "node missing.js", exitCode: 1 }]);
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

test("seed-relative scope catches a staged-only out-of-scope path", () => {
  const { repo, git, seedCommit } = createGitFixture("staged-scope");
  writeFileSync(join(repo, "unexpected.txt"), "staged content\n");
  git("add", "unexpected.txt");

  const changed = changedFilesSince(repo, seedCommit);
  assert.deepEqual(changed, ["unexpected.txt"]);
  const result = classifyResult({
    agent: { status: 0, error: null, errorCode: null },
    adapterResult: { complete: true, turnFailed: false },
    fileGrade: { outOfScope: changed, sourceAndTestChecksPass: true },
    seedUnchanged: true,
    test: { status: 0 },
    testCounts: { tests: 1, pass: 1, fail: 0, skipped: 0, cancelled: 0 },
    behavior: { status: 0 },
  });
  assert.equal(result, "out-of-scope-change");
});

test("seed-relative scope catches unstaged tracked edits", () => {
  const { repo, seedCommit } = createGitFixture("unstaged-scope");
  writeFileSync(join(repo, "tracked.txt"), "unstaged edit\n");

  assert.deepEqual(changedFilesSince(repo, seedCommit), ["tracked.txt"]);
});

test("seed-relative scope includes ignored untracked paths", () => {
  const { repo, seedCommit } = createGitFixture("ignored-scope");
  writeFileSync(join(repo, "ignored.txt"), "ignored but changed\n");

  assert.deepEqual(changedFilesSince(repo, seedCommit), ["ignored.txt"]);
});

test("seed-relative scope catches an out-of-scope path committed after the fixture seed", () => {
  const { repo, git, seedCommit } = createGitFixture("committed-scope");
  writeFileSync(join(repo, "unexpected.txt"), "committed content\n");
  git("add", "unexpected.txt");
  git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "--quiet", "-m", "unexpected path");

  const changed = changedFilesSince(repo, seedCommit);
  const headAfter = git("rev-parse", "HEAD").trim();
  assert.notEqual(headAfter, seedCommit);
  assert.deepEqual(changed, ["unexpected.txt"]);
  const result = classifyResult({
    agent: { status: 0, error: null, errorCode: null },
    adapterResult: { complete: true, turnFailed: false },
    fileGrade: { outOfScope: changed, sourceAndTestChecksPass: true },
    seedUnchanged: headAfter === seedCommit,
    test: { status: 0 },
    testCounts: { tests: 1, pass: 1, fail: 0, skipped: 0, cancelled: 0 },
    behavior: { status: 0 },
  });
  assert.equal(result, "out-of-scope-change");
});

test("classification rejects a commit even when every committed path is in scope", () => {
  const base = {
    agent: { status: 0, error: null, errorCode: null },
    adapterResult: { complete: true, turnFailed: false },
    fileGrade: { outOfScope: [], sourceAndTestChecksPass: true },
    seedUnchanged: false,
    test: { status: 0 },
    testCounts: { tests: 1, pass: 1, fail: 0, skipped: 0, cancelled: 0 },
    behavior: { status: 0 },
  };

  assert.equal(classifyResult(base), "unexpected-commit");
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

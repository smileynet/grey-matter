import "./test-git-env.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EFFORTS,
  MODELS,
  RUNNABLE_PROVIDERS,
  buildArgv,
  buildPrompt,
  childEnvironment,
  directoryIdentity,
  hashPreparedPlan,
  hasSameDirectoryIdentity,
  makePlan,
  profileList,
  readNativeOutput,
  runPreparedCell,
  validateParentAuthorization,
} from "./spike-model-effort-t171.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const tempRoots = [];
function tempRoot(prefix) {
  const path = mkdtempSync(join(tmpdir(), prefix));
  tempRoots.push(path);
  return path;
}
test.after(() => {
  for (const path of tempRoots) rmSync(path, { recursive: true, force: true });
});

test("the frozen matrix has supported runnable cells and explicit held/blocked rows", () => {
  assert.deepEqual(RUNNABLE_PROVIDERS, ["claude", "codex"]);
  assert.equal(profileList().filter((row) => row.state === "planned").length, 20);
  assert.equal(profileList().filter((row) => row.state === "held-model-effort-unverified").length, 10);
  assert.equal(profileList().filter((row) => row.state === "security-blocked-no-command").length, 10);
  assert.ok(profileList().filter((row) => row.provider === "google").every((row) => !("executable" in row)));
  assert.throws(() => makePlan({ providers: ["kiro"], privateRoot: tempRoot("t171-private-"), tempRoot: tempRoot("t171-cells-") }), /not cleared/);
});

test("prompt packets contain task source but no provider, model, effort, or private grading key", async () => {
  for (const taskId of ["diagnosis", "design"]) {
    const fixture = JSON.parse(readFileSync(new URL(`./fixtures/model-effort-t171/${taskId}.json`, import.meta.url), "utf8"));
    const packet = buildPrompt(fixture);
    assert.ok(packet.includes(fixture.prompt));
    assert.ok(Object.keys(fixture.files).every((path) => packet.includes(path)));
    assert.doesNotMatch(packet, /claude|codex|kiro|qwen|gpt-6|opus|effort|answer-key|requiredFacts/i);
    assert.ok(!packet.includes("indefinite response replay"));
  }
});

test("argv builders freeze exact per-provider effort and keep all task content positional", () => {
  for (const provider of RUNNABLE_PROVIDERS) {
    for (const effort of EFFORTS) {
      const argv = buildArgv(provider, effort, "synthetic task prompt", "C:/empty/cell");
      assert.ok(argv.includes(MODELS[provider]));
      assert.ok(argv.includes("synthetic task prompt"));
      assert.ok(argv.some((arg) => arg === effort || arg.includes(`model_reasoning_effort=\"${effort}\"`)));
      assert.equal(argv.filter((arg) => arg === "synthetic task prompt").length, 1);
    }
  }
  assert.throws(() => buildArgv("google", "low", "x", "C:/empty"), /not enabled/);
});

test("child environment is minimized and Claude's higher-priority effort agrees with argv", () => {
  const before = process.env.CLAUDE_CODE_EFFORT_LEVEL;
  const hadOpenAiKey = Object.hasOwn(process.env, "OPENAI_API_KEY");
  const beforeOpenAiKey = process.env.OPENAI_API_KEY;
  process.env.CLAUDE_CODE_EFFORT_LEVEL = "max";
  process.env.OPENAI_API_KEY = "test-secret";
  try {
    const env = childEnvironment("claude", "low");
    assert.equal(env.CLAUDE_CODE_EFFORT_LEVEL, "low");
    assert.equal(env.OPENAI_API_KEY, undefined);
    assert.equal(env.PATH, process.env.PATH);
  } finally {
    if (before === undefined) delete process.env.CLAUDE_CODE_EFFORT_LEVEL;
    else process.env.CLAUDE_CODE_EFFORT_LEVEL = before;
    if (hadOpenAiKey) process.env.OPENAI_API_KEY = beforeOpenAiKey;
    else delete process.env.OPENAI_API_KEY;
  }
  assert.equal(process.env.CLAUDE_CODE_EFFORT_LEVEL, before);
  assert.equal(Object.hasOwn(process.env, "OPENAI_API_KEY"), hadOpenAiKey);
  assert.equal(process.env.OPENAI_API_KEY, beforeOpenAiKey);
});

test("the actual run function passes exactly the hash-bound argv and empty cwd to fake spawn", () => {
  const privateRoot = tempRoot("t171-private-");
  const evidenceRoot = join(privateRoot, "evidence");
  const temp = tempRoot("t171-work-");
  const generatedPlan = makePlan({ privateRoot, tempRoot: temp, tasks: ["diagnosis"], providers: ["claude"], efforts: ["low"] });
  const planPath = join(privateRoot, "prepared-plan.json");
  writeFileSync(planPath, `${JSON.stringify(generatedPlan)}\n`, { flag: "wx" });
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  assert.equal(hashPreparedPlan(plan), plan.planSha256);
  const cell = plan.cells[0];
  assert.equal(readdirSync(cell.cwd).length, 0);
  assert.ok(cell.cwdIdentity.fileId);
  assert.ok(cell.cwdIdentity.device);
  const authorization = {
    schemaVersion: 1,
    nativeLeaseReleased: true,
    protocolSha256: plan.protocolSha256,
    controllerSha256: plan.controllerSha256,
    planSha256: plan.planSha256,
    cells: [cell.cellId],
    criticCommit: "a".repeat(40),
    leaseId: "test-lease",
  };
  validateParentAuthorization(plan, cell, authorization);
  let observed;
  const receipt = runPreparedCell({
    plan,
    cellId: cell.cellId,
    authorization,
    spawn(command, argv, options) {
      observed = { command, argv, cwd: options.cwd, env: options.env, shell: options.shell, maxBuffer: options.maxBuffer };
      return { status: 0, error: null, stdout: Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "{}" })), stderr: Buffer.alloc(0) };
    },
  });
  assert.equal(observed.command, cell.executable);
  assert.deepEqual(observed.argv, cell.argv);
  assert.equal(observed.cwd, cell.cwd);
  assert.equal(observed.shell, false);
  assert.equal(observed.maxBuffer, 8 * 1024 * 1024);
  assert.equal(receipt.requestedModel, cell.requestedModel);
  assert.equal(receipt.actualModelUnreported, true);
  assert.equal(receipt.actualEffortUnreported, true);
  assert.equal(receipt.nativeStatus, "complete");
  assert.equal("quality" in receipt, false);
  assert.equal(readdirSync(cell.cwd).length, 0);
  assert.throws(() => runPreparedCell({ plan, cellId: cell.cellId, authorization, spawn() { throw new Error("must not spawn twice"); } }), /changed or is no longer empty|already exists/);
  const changed = { ...plan, cells: [{ ...cell, cwd: temp }] };
  assert.throws(() => runPreparedCell({ plan: changed, cellId: cell.cellId, authorization, spawn() {} }), /plan changed/);
  assert.equal(readdirSync(evidenceRoot).includes(cell.cellId), true);
});

test("non-empty authorized cwd is rejected before executable hashing or spawn", () => {
  const privateRoot = tempRoot("t171-private-");
  const temp = tempRoot("t171-work-");
  const plan = makePlan({ privateRoot, tempRoot: temp, tasks: ["diagnosis"], providers: ["claude"], efforts: ["low"] });
  const cell = plan.cells[0];
  const authorization = {
    schemaVersion: 1,
    nativeLeaseReleased: true,
    protocolSha256: plan.protocolSha256,
    controllerSha256: plan.controllerSha256,
    planSha256: plan.planSha256,
    cells: [cell.cellId],
    criticCommit: "b".repeat(40),
    leaseId: "test-lease",
  };
  writeFileSync(join(cell.cwd, "unexpected.txt"), "stop");
  assert.throws(() => runPreparedCell({ plan, cellId: cell.cellId, authorization, spawn() { assert.fail("spawn must not run"); } }), /directory changed identity or is no longer empty/);
});

test("replacing the authorized path with another empty directory fails by stable identity before spawn", () => {
  const privateRoot = tempRoot("t171-private-");
  const temp = tempRoot("t171-work-");
  const plan = makePlan({ privateRoot, tempRoot: temp, tasks: ["diagnosis"], providers: ["claude"], efforts: ["low"] });
  const cell = plan.cells[0];
  const replacement = mkdtempSync(join(temp, "replacement-"));
  const movedOriginal = join(temp, "original-moved-aside");
  renameSync(cell.cwd, movedOriginal);
  renameSync(replacement, cell.cwd);
  assert.equal(readdirSync(cell.cwd).length, 0);
  assert.notDeepEqual(directoryIdentity(cell.cwd, temp), cell.cwdIdentity);
  assert.equal(hasSameDirectoryIdentity(cell.cwd, temp, cell.cwdIdentity), false);
  const authorization = {
    schemaVersion: 1,
    nativeLeaseReleased: true,
    protocolSha256: plan.protocolSha256,
    controllerSha256: plan.controllerSha256,
    planSha256: plan.planSha256,
    cells: [cell.cellId],
    criticCommit: "c".repeat(40),
    leaseId: "test-lease",
  };
  assert.throws(() => runPreparedCell({ plan, cellId: cell.cellId, authorization, spawn() { assert.fail("spawn must not run"); } }), /changed identity or is no longer empty/);
});

test("native output errors, limits, missing completion, and effort uncertainty stay distinct", () => {
  assert.equal(readNativeOutput("claude", Buffer.from("not json"), 0).status, "malformed-output");
  assert.equal(readNativeOutput("claude", Buffer.from(JSON.stringify({ type: "result", result: "ok", is_error: true })), 0).status, "embedded-infrastructure-error");
  assert.equal(readNativeOutput("codex", Buffer.from('{"type":"turn.completed"}\n'), 0).status, "empty-final-text");
  assert.equal(readNativeOutput("kiro", Buffer.from('{"type":"rate_limit","message":"quota exhausted"}\n'), 1).status, "usage-limit");
  const output = readNativeOutput("claude", Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "ok" })), 0);
  assert.equal(output.status, "complete");
  assert.equal(output.actualEffort, null);
});

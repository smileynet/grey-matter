import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  BLOCKED_GOOGLE_CELLS, CALL_TIMEOUT_MS, FIXTURE_HASHES, PROVIDERS,
  TASKS, TIERS, buildArgv, buildCellPlan, buildPrompt, extractResult,
  loadPlanFile, readFixture, runCell,
} from "./spike-model-task-tier-t170.mjs";
import { bindReview, validateReviewBody } from "./t170-review-envelope.mjs";

const key = JSON.parse(readFileSync(new URL("../.scratch/t170/preparation/answer-key.json", import.meta.url), "utf8"));
const providerResponse = (provider, tier, prompt) => buildArgv(provider, tier, prompt, "C:\\Temp\\gm t170");
const sha = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();

function authorize(plan, planBytes, root) {
  const authorization = {
    schemaVersion: 1, ticket: 170, protocolSha256: plan.protocolSha256,
    controllerSha256: plan.controllerSha256, criticAccepted: true,
    criticCommit: "offline-fake-only", parentLeaseReleased: true,
    allowedCells: [{ cellId: plan.cellId, provider: plan.provider, fixtureId: plan.fixtureId,
      tier: plan.tier, planSha256: sha(planBytes) }],
  };
  const path = join(root, "authorization.json");
  writeFileSync(path, JSON.stringify(authorization));
  return path;
}

test("all three fixture byte hashes and scored dimensions are frozen", () => {
  assert.deepEqual(TASKS, ["doc-rewrite", "triage", "changelog-classification"]);
  for (const id of TASKS) {
    const { fixture, sha256 } = readFixture(id);
    assert.equal(sha256, FIXTURE_HASHES[id]);
    assert.deepEqual(Object.keys(fixture.scoreDimensions).length, 4);
    assert.doesNotMatch(JSON.stringify(fixture), /answer-key|provider|tier|cell-id/i);
    assert.doesNotMatch(buildPrompt(fixture), /haiku|gpt-6-luna|qwen3-coder-next|provider.?tier/i);
  }
});

test("the planned matrix is exactly 18 native cells and excludes Google", () => {
  assert.deepEqual(PROVIDERS, ["claude", "codex", "kiro"]);
  assert.deepEqual(TIERS, ["cheap", "default"]);
  assert.equal(PROVIDERS.length * TIERS.length * TASKS.length, 18);
  assert.equal(BLOCKED_GOOGLE_CELLS, 6);
  const plan = buildCellPlan({ provider: "claude", tier: "cheap", fixtureId: TASKS[0], cellId: "T170-C01" });
  assert.equal(plan.requestedModel, "claude-haiku-5-5");
  assert.equal(plan.requestedIdentityIsNotServedIdentity, true);
  assert.equal(plan.timeoutMs, CALL_TIMEOUT_MS);
  assert.throws(() => buildCellPlan({ provider: "agy", tier: "cheap", fixtureId: TASKS[0], cellId: "T170-C01" }), /eligible/);
  rmSync(plan.cwd, { recursive: true, force: true });
});

test("provider argv uses restricted modes, explicit model selections and no fallback", () => {
  const prompt = "single, synthetic prompt";
  for (const provider of PROVIDERS) {
    for (const tier of TIERS) {
      const args = providerResponse(provider, tier, prompt);
      assert.equal(args.at(-1), prompt);
      assert.ok(args.length < 32);
      if (provider === "claude") {
        assert.ok(args.includes("--safe-mode") && args.includes("--no-session-persistence"));
        assert.equal(args[args.indexOf("--tools") + 1], "");
        assert.ok(args.includes("--disallowedTools"));
        assert.equal(args.includes("--model"), tier === "cheap");
      } else if (provider === "codex") {
        assert.ok(args.includes("--ignore-user-config") && args.includes("--sandbox") && args.includes("read-only"));
        assert.deepEqual(args.slice(args.indexOf("--disable"), args.indexOf("--disable") + 2), ["--disable", "shell_tool"]);
        assert.ok(args.includes("--ephemeral"));
        assert.equal(args.includes("--model"), tier === "cheap");
      } else {
        assert.ok(args.includes("--no-interactive") && args.includes("--trust-tools="));
        assert.equal(args.includes("--model"), tier === "cheap");
      }
    }
  }
  const recordedArgs = providerResponse("codex", "cheap", prompt);
  const recorded = spawnSync(process.execPath, ["-e", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", "--", ...recordedArgs], { encoding: "utf8", shell: false, windowsHide: true });
  assert.equal(recorded.status, 0, recorded.stderr);
  assert.deepEqual(JSON.parse(recorded.stdout), recordedArgs);
});

test("terminal parsing distinguishes completed responses from missing terminal and nested errors", () => {
  const claudeGood = Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "hello", total_cost_usd: 0.02, modelUsage: { a: { canonicalModel: "claude-haiku-5-5" } } }));
  assert.deepEqual(extractResult("claude", claudeGood), { terminal: true, response: "hello", actualModel: "claude-haiku-5-5", usage: null, costUsd: 0.02, toolEvents: [], errors: [] });
  const malformed = extractResult("claude", Buffer.from("{} "));
  assert.equal(malformed.terminal, false);
  assert.deepEqual(malformed.toolEvents, []);
  const codex = [
    { type: "item.completed", item: { type: "error", status: "error", message: "host unavailable" } },
    { type: "item.completed", item: { type: "agent_message", text: "hello" } },
    { type: "turn.completed", usage: { total_tokens: 10 } },
  ].map((x) => JSON.stringify(x)).join("\n");
  const codexResult = extractResult("codex", Buffer.from(codex));
  assert.equal(codexResult.terminal, false);
  assert.match(codexResult.errors.join(), /native-error/);
  const codexTool = [
    { type: "item.started", item: { type: "command_execution" } },
    { type: "item.completed", item: { type: "agent_message", text: "hello" } },
    { type: "turn.completed" },
  ].map((x) => JSON.stringify(x)).join("\n");
  assert.equal(extractResult("codex", Buffer.from(codexTool)).toolEvents.length, 1);
  const kiro = [
    { type: "metadata", data: { modelId: "qwen-test" } },
    { type: "runStarted", data: { sessionId: "synthetic-session" } },
    { type: "runFinished", data: { status: "success", stopReason: "end_turn", finalText: "ok" } },
  ].map((x) => JSON.stringify(x)).join("\n");
  const kiroResult = extractResult("kiro", Buffer.from(kiro));
  assert.equal(kiroResult.terminal, true);
  assert.equal(kiroResult.actualModel, "qwen-test");
  assert.equal(kiroResult.sessionId, "synthetic-session");
});

test("blind review schema binds trusted hashes without changing or completing semantic decisions", () => {
  const { fixture } = readFixture("doc-rewrite");
  const answer = key.fixtures[fixture.id];
  const responseBytes = Buffer.from("Schedule days stay selected when you change time zones.");
  const body = {
    scorable: true,
    scores: { format: 2, behavior: 2, factuality: 2, userValue: 2 },
    issues: [], summary: "The entry preserves the trigger and user benefit without extending the claim.",
  };
  const fixtureBytes = readFileSync(new URL("../scripts/fixtures/model-tasks/t170/doc-rewrite.json", import.meta.url));
  const rawReviewBytes = Buffer.from(JSON.stringify(body));
  const reviewerTraceBytes = Buffer.from(JSON.stringify({
    dispatchInput: { task: "Grade this response blind using the supplied rubric." },
    spawnResult: { agentId: "synthetic-reviewer-01", canonicalTaskName: "/root/critic_170_fixture" },
    completion: { agentId: "synthetic-reviewer-01", status: "completed", rawReviewSha256: createHash("sha256").update(rawReviewBytes).digest("hex").toUpperCase() },
  }));
  const envelope = bindReview({ rawReviewBytes, responseBytes, fixtureBytes, rubricBytes: Buffer.from(JSON.stringify(fixture.scoreDimensions)), answerKeyBytes: Buffer.from(JSON.stringify(answer)), reviewerTraceBytes, fixture, answerKey: answer });
  assert.equal(envelope.validation.valid, true);
  assert.deepEqual(envelope.semanticBody, body);
  assert.equal(envelope.candidateBinding.responseSha256, createHash("sha256").update(responseBytes).digest("hex").toUpperCase());
  assert.equal(Object.hasOwn(envelope.semanticBody, "reviewerId"), false);
  assert.equal(envelope.reviewer.agentId, "synthetic-reviewer-01");
  assert.equal(envelope.reviewer.canonicalTaskName, "/root/critic_170_fixture");
  const badTrace = JSON.parse(reviewerTraceBytes.toString("utf8"));
  badTrace.completion.agentId = "claimed-by-model";
  assert.throws(() => bindReview({ rawReviewBytes, responseBytes, fixtureBytes, rubricBytes: Buffer.from(JSON.stringify(fixture.scoreDimensions)), answerKeyBytes: Buffer.from(JSON.stringify(answer)), reviewerTraceBytes: Buffer.from(JSON.stringify(badTrace)), fixture, answerKey: answer }), /canonical spawn/);
  body.scores.format = 0;
  assert.equal(envelope.semanticBody.scores.format, 2);
  const aliased = { scorable: true, scores: { exactOneSentence: 2, behavior: 2, factuality: 2, userValue: 2 }, issues: [], summary: "Alias must not be silently renamed." };
  assert.equal(validateReviewBody(aliased, fixture, answer, responseBytes.toString()).valid, false);
  const changed = { ...body, issues: [{ kind: "unsupported", key: "doc.unsupported-claim", evidence: "all weeks", reason: "Claims more than the source supports." }] };
  const rejected = validateReviewBody(changed, fixture, answer, responseBytes.toString());
  assert.equal(rejected.valid, false);
  assert.match(rejected.errors.join(" "), /exact response substring/);
  assert.equal(changed.issues[0].evidence, "all weeks");
});

test("runCell executes the cwd and argv in its exact authorized plan through a harmless fake process", () => {
  const root = mkdtempSync(join(tmpdir(), "t170-fake-run-"));
  const builtPlan = buildCellPlan({ provider: "codex", tier: "cheap", fixtureId: "doc-rewrite", cellId: "T170-EXEC-01", evidenceDir: join(root, "evidence") });
  const planPath = join(root, "plan.json");
  const planBytes = Buffer.from(`${JSON.stringify(builtPlan, null, 2)}\n`);
  writeFileSync(planPath, planBytes);
  const { plan } = loadPlanFile(planPath);
  const authorization = authorize(plan, planBytes, root);
  const fake = join(root, "fake-provider.mjs");
  const observedPath = join(root, "observed.json");
  const ledgerPath = join(root, "ledger.json");
  writeFileSync(fake, [
    'import { writeFileSync } from "node:fs";',
    'const observed = JSON.parse(process.argv[2]);',
    'writeFileSync(process.argv[3], JSON.stringify(observed));',
    'process.stdout.write(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Schedule days remain selected." } }) + "\\n");',
    'process.stdout.write(JSON.stringify({ type: "turn.completed", usage: { total_tokens: 5 } }) + "\\n");',
  ].join("\n"));
  const fakeSpawn = (executable, argv, options) => spawnSync(process.execPath, [fake, JSON.stringify({ executable, argv, cwd: options.cwd, shell: options.shell }), observedPath], { ...options, shell: false });
  try {
    const release = JSON.parse(readFileSync(authorization, "utf8"));
    assert.equal(release.allowedCells[0].planSha256, sha(planBytes));
    const result = runCell(plan, authorization, { planBytes, spawn: fakeSpawn, ledgerPath });
    assert.equal(result.status, "completed");
    const observed = JSON.parse(readFileSync(observedPath, "utf8"));
    assert.equal(observed.executable, plan.executable);
    assert.deepEqual(observed.argv, plan.argv);
    assert.equal(observed.cwd, plan.cwd);
    assert.equal(observed.shell, false);
    assert.equal(existsSync(plan.cwd), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("runCell refuses a changed path, a nonempty plan directory, and a reparse directory", () => {
  const root = mkdtempSync(join(tmpdir(), "t170-cwd-check-"));
  const make = (cellId) => {
    mkdirSync(join(root, cellId), { recursive: true });
    const builtPlan = buildCellPlan({ provider: "codex", tier: "cheap", fixtureId: "doc-rewrite", cellId, evidenceDir: join(root, cellId, "evidence") });
    const planPath = join(root, cellId, "plan.json");
    const planBytes = Buffer.from(`${JSON.stringify(builtPlan, null, 2)}\n`);
    writeFileSync(planPath, planBytes);
    const { plan } = loadPlanFile(planPath);
    return { plan, planBytes, authorization: authorize(plan, planBytes, join(root, cellId)), ledgerPath: join(root, cellId, "ledger.json") };
  };
  const changed = make("T170-EXEC-02");
  const changedPlan = { ...changed.plan, cwd: `${changed.plan.cwd}-other` };
  changedPlan.argv = buildArgv(changedPlan.provider, changedPlan.tier, buildPrompt(readFixture(changedPlan.fixtureId).fixture), changedPlan.cwd);
  const changedBytes = Buffer.from(JSON.stringify(changedPlan));
  assert.throws(() => runCell(changedPlan, changed.authorization, { planBytes: changedBytes }), /exact plan file/);
  rmSync(changed.plan.cwd, { recursive: true, force: true });

  const nonempty = make("T170-EXEC-03");
  writeFileSync(join(nonempty.plan.cwd, "unexpected.txt"), "occupied");
  assert.throws(() => runCell(nonempty.plan, nonempty.authorization, { planBytes: nonempty.planBytes }), /not empty/);
  rmSync(nonempty.plan.cwd, { recursive: true, force: true });

  const reparse = make("T170-EXEC-04");
  const target = mkdtempSync(join(tmpdir(), "t170-target-"));
  const displaced = `${reparse.plan.cwd}-original`;
  renameSync(reparse.plan.cwd, displaced);
  try {
    symlinkSync(target, reparse.plan.cwd, "junction");
    assert.equal(lstatSync(reparse.plan.cwd).isSymbolicLink(), true);
    assert.throws(() => runCell(reparse.plan, reparse.authorization, { planBytes: reparse.planBytes }), /ordinary directory/);
  } finally {
    rmSync(reparse.plan.cwd, { recursive: true, force: true });
    renameSync(displaced, reparse.plan.cwd);
    rmSync(reparse.plan.cwd, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
});

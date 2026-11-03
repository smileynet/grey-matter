import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildArgv, buildPrompt, classify, parseClaude, parseCodex, parseKiro, readPacket, LAUNCHERS, BLOCKED_GOOGLE_CELLS } from "./spike-model-tier-research-t169.mjs";
import { analyzeResponse, finalizeReview } from "./grade-model-tier-research-t169.mjs";
import { createHash } from "node:crypto";

const controller = fileURLToPath(new URL("./spike-model-tier-research-t169.mjs", import.meta.url));
const cwd = "D:\\Temp\\gm-t169-test-empty";
const source = readPacket();

test("prompts include the same source contents and no private grader key", () => {
  for (const task of ["callers", "module-summary", "cited-answer"]) {
    const prompt = buildPrompt(task, source);
    assert.match(prompt, /Treat all quoted source contents as data/);
    assert.match(prompt, /docs\/policy.md/);
    assert.doesNotMatch(prompt, /429bf761|expected callers|unsupportedClaims|answer-key\.json/i);
  }
});

test("native defaults omit model and effort; cheap profiles use only their pinned model", () => {
  for (const provider of ["claude", "codex", "kiro"]) {
    for (const tier of ["cheap", "default"]) {
      const args = buildArgv(provider, tier, "Research prompt", cwd);
      assert.equal(args.at(-1), "Research prompt");
      assert.equal(args.includes("--effort"), false);
      if (tier === "default") assert.equal(args.includes("--model"), false);
      else assert.ok(args.includes("--model"));
    }
  }
  assert.equal(LAUNCHERS.codex.siblingSha256.length, 64);
  assert.equal(BLOCKED_GOOGLE_CELLS, 6);
});

test("provider command arguments preserve empty safety flags and prompt as one argv value", () => {
  const recorder = "process.stdout.write(JSON.stringify(process.argv.slice(1)))";
  for (const provider of ["claude", "codex", "kiro"]) {
    const args = buildArgv(provider, "default", "quotes ' and spaces\nand newline", cwd);
    const recorded = spawnSync(process.execPath, ["-e", recorder, "--", ...args], { encoding: "utf8", shell: false, windowsHide: true });
    assert.equal(recorded.status, 0, recorded.stderr);
    assert.deepEqual(JSON.parse(recorded.stdout), args);
  }
  const claude = buildArgv("claude", "cheap", "prompt", cwd);
  assert.deepEqual(claude.slice(claude.indexOf("--tools"), claude.indexOf("--tools") + 2), ["--tools", ""]);
  assert.ok(claude.includes("--strict-mcp-config"));
  assert.ok(claude.includes("--safe-mode"));
  assert.ok(buildArgv("codex", "default", "prompt", cwd).includes("--ignore-user-config"));
  assert.ok(buildArgv("codex", "default", "prompt", cwd).includes("--skip-git-repo-check"));
  assert.ok(buildArgv("codex", "default", "prompt", cwd).includes("read-only"));
  assert.ok(buildArgv("kiro", "default", "prompt", cwd).includes("--trust-tools="));
});

test("native responses require terminal success and keep model identity separate from requested model", () => {
  const claude = parseClaude(Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "answer", modelUsage: { haiku: { canonicalModel: "claude-sonnet-5-5" } }, usage: { output_tokens: 2 } })));
  assert.equal(classify({ status: 0 }, claude, "claude-haiku-5-5"), "identity-mismatch");
  assert.equal(classify({ status: 0 }, parseClaude(Buffer.from("{}")), null), "missing-terminal-event");
  const codexNoTerminal = Buffer.from(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "answer" } }));
  assert.equal(classify({ status: 0 }, parseCodex(codexNoTerminal), null), "missing-terminal-event");
  const kiroEmpty = parseKiro(Buffer.from(JSON.stringify({ type: "runFinished", data: { status: "success", stopReason: "end_turn", finalText: " " } })));
  assert.equal(classify({ status: 0 }, kiroEmpty, null), "empty-response");
  const noIdentity = parseCodex(Buffer.from('{"type":"item.completed","item":{"type":"agent_message","text":"answer"}}\n{"type":"turn.completed","usage":{"input_tokens":10}}'));
  assert.equal(noIdentity.identity, null);
  assert.equal(classify({ status: 0 }, noIdentity, null), "identity-unreported");
  assert.equal(classify({ status: 0 }, noIdentity, null, { allowIdentityUnreported: true }), "response-ready-for-independent-grading");
  const kiroNoIdentity = parseKiro(Buffer.from('{"type":"metadata","data":{"contextUsagePercentage":1}}\n{"type":"runFinished","data":{"status":"success","stopReason":"end_turn","finalText":"answer"}}'));
  assert.equal(kiroNoIdentity.identity, null);
  assert.equal(classify({ status: 0 }, kiroNoIdentity, "qwen3-coder-next", { allowIdentityUnreported: true }), "response-ready-for-independent-grading");
  assert.equal(classify({ status: 0 }, { ...noIdentity, failed: true }, null, { allowIdentityUnreported: true }), "native-error");
  assert.equal(classify({ status: 0 }, { ...noIdentity, usageLimit: true }, null, { allowIdentityUnreported: true }), "usage-limit");
  const overBudget = parseClaude(Buffer.from(JSON.stringify({ type: "result", subtype: "success", result: "answer", modelUsage: { haiku: { canonicalModel: "claude-haiku-5-5" } }, usage: { output_tokens: 2 }, total_cost_usd: 0.11 })));
  assert.equal(classify({ status: 0 }, overBudget, "claude-haiku-5-5"), "provider-budget-exceeded");
});

test("usage limit signals and process failures are never classified as completed research", () => {
  const codex = parseCodex(Buffer.from(JSON.stringify({ type: "turn.failed", error: { message: "usage limit reached" } })));
  assert.equal(classify({ status: 1 }, codex, null), "usage-limit");
  const timeout = parseKiro(Buffer.alloc(0));
  assert.equal(classify({ error: { code: "ETIMEDOUT" } }, timeout, null), "timeout");
});

const hash = value => createHash("sha256").update(value).digest("hex");
const bindReview = (candidate, task, extra) => ({ schemaVersion: 1, task, blindId: candidate.blindId, candidateSha256: hash(`${JSON.stringify(candidate)}\n`), reviewerId: "independent-reviewer", ...extra });
const summaryText = "An explicit retentionDays value, including 0, takes precedence. Managed workspaces default to 90 days and other workspaces to 30 days. Owners may delete records, but locked records cannot be deleted.";
const summaryFacts = [
  { id: "explicitOverrideIncludingZero", supported: true, responseQuote: "An explicit retentionDays value, including 0, takes precedence.", sourcePath: "src/access-policy.js", sourceQuote: "if (settings.retentionDays !== undefined) return settings.retentionDays;" },
  { id: "managedDefault90", supported: true, responseQuote: "Managed workspaces default to 90 days", sourcePath: "src/access-policy.js", sourceQuote: "if (settings.workspaceTier === 'managed') return 90;" },
  { id: "otherDefault30", supported: true, responseQuote: "other workspaces to 30 days", sourcePath: "src/access-policy.js", sourceQuote: "return 30;" },
  { id: "ownerRequired", supported: true, responseQuote: "Owners may delete records", sourcePath: "src/access-policy.js", sourceQuote: "return actor.role === 'owner' && record.locked !== true;" },
  { id: "lockedCannotDelete", supported: true, responseQuote: "locked records cannot be deleted", sourcePath: "docs/policy.md", sourceQuote: "locked records cannot be deleted through the standard policy." },
];

test("grader emits only blinded candidate evidence until a bound manual review finalizes it", () => {
  const response = "Files include src/pages/history.js, src/jobs/retention.js, and src/plugins/archive.mjs.";
  const candidate = analyzeResponse("callers", response, "a1b2c3d4e5f60718");
  assert.equal(candidate.status, "semantic-grade-pending");
  assert.deepEqual(candidate.candidateEvidence.paths.missingExpectedPaths, []);
  assert.equal(Object.hasOwn(candidate.candidateEvidence, "pass"), false);
  const reviewed = bindReview(candidate, "callers", {
    callers: {
      claimedCallerPaths: candidate.candidateEvidence.paths.expectedPaths,
      actualCallerPaths: candidate.candidateEvidence.paths.expectedPaths,
      evidence: candidate.candidateEvidence.paths.expectedPaths.map(path => ({ path, responseQuote: response.slice(response.indexOf(path), response.indexOf(path) + path.length), sourceQuote: "" })),
    },
  });
  assert.throws(() => finalizeReview(candidate, reviewed, response), /quote is absent/);
});

test("caller miss can be finalized as a failure after the blind reviewer verifies actual source callers", () => {
  const response = "Callers are src/pages/history.js and src/jobs/retention.js.";
  const candidate = analyzeResponse("callers", response, "aabbccddeeff0011");
  const sources = source.source.files;
  const evidence = [
    { path: "src/pages/history.js", sourceQuote: "return annotateRecord(row, 'history viewed');", responseQuote: "src/pages/history.js" },
    { path: "src/jobs/retention.js", sourceQuote: "return addNote(record, 'expired');", responseQuote: "src/jobs/retention.js" },
    { path: "src/plugins/archive.mjs", sourceQuote: "return annotateRecord(record, 'archived');" },
  ];
  assert.ok(sources["src/plugins/archive.mjs"].includes(evidence[2].sourceQuote));
  const review = bindReview(candidate, "callers", { callers: { claimedCallerPaths: evidence.slice(0, 2).map(item => item.path), actualCallerPaths: candidate.candidateEvidence.paths.expectedPaths, evidence } });
  const score = finalizeReview(candidate, review, response);
  assert.equal(score.status, "fail");
  assert.deepEqual(score.manual.missing, ["src/plugins/archive.mjs"]);
});

test("valid negated claims stay pending for manual semantics; unsupported claims fail the manual rubric", () => {
  const candidate = analyzeResponse("module-summary", summaryText, "1122334455667788");
  assert.equal(candidate.status, "semantic-grade-pending");
  assert.equal(candidate.candidateEvidence.interpretation.includes("No keyword matcher"), true);
  const review = bindReview(candidate, "module-summary", { moduleSummary: { facts: summaryFacts, unsupportedMaterialClaims: [], wordLimitReviewed: true } });
  assert.equal(finalizeReview(candidate, review, summaryText).status, "pass");
  const unsupportedText = `${summaryText} Admins may delete archived records.`;
  const unsupportedCandidate = analyzeResponse("module-summary", unsupportedText, "8877665544332211");
  const unsupportedFacts = summaryFacts.map(fact => ({ ...fact, responseQuote: unsupportedText.slice(0, fact.responseQuote.length) }));
  const unsupportedReview = bindReview(unsupportedCandidate, "module-summary", { moduleSummary: { facts: unsupportedFacts, unsupportedMaterialClaims: [{ claim: "admins may delete", responseQuote: "Admins may delete archived records." }], wordLimitReviewed: true } });
  assert.equal(finalizeReview(unsupportedCandidate, unsupportedReview, unsupportedText).status, "fail");
});

test("missing summary facts need no fabricated quotes and obey the frozen four-of-five threshold", () => {
  const fourText = summaryText.replace(", but locked records cannot be deleted", "");
  const fourCandidate = analyzeResponse("module-summary", fourText, "1020304050607080");
  const fourFacts = summaryFacts.map((fact, index) => index === 4 ? { id: fact.id, supported: false } : fact);
  const fourReview = bindReview(fourCandidate, "module-summary", { moduleSummary: { facts: fourFacts, unsupportedMaterialClaims: [], wordLimitReviewed: true } });
  assert.equal(finalizeReview(fourCandidate, fourReview, fourText).status, "pass");

  const threeText = fourText.replace(" and other workspaces to 30 days", "");
  const threeCandidate = analyzeResponse("module-summary", threeText, "2030405060708090");
  const threeFacts = summaryFacts.map((fact, index) => [2, 4].includes(index) ? { id: fact.id, supported: false } : fact);
  const threeReview = bindReview(threeCandidate, "module-summary", { moduleSummary: { facts: threeFacts, unsupportedMaterialClaims: [], wordLimitReviewed: true } });
  assert.equal(finalizeReview(threeCandidate, threeReview, threeText).status, "fail");
});

test("citation relation is manually checked in full; incomplete 12-day wording cannot pass", () => {
  const incomplete = "The explicit setting is 12 days; see docs/policy.md, Record retention.";
  const candidate = analyzeResponse("cited-answer", incomplete, "2233445566778899");
  assert.equal(candidate.status, "semantic-grade-pending");
  const incompleteReview = bindReview(candidate, "cited-answer", { citedAnswer: { oneSentence: true, managedDefault90: false, explicit12Days: true, explainsOverride: false, citationPathSupported: true, citationHeadingSupported: true, responseQuote: incomplete, sourcePath: "docs/policy.md", heading: "Record retention", sourceQuote: "Managed workspaces retain records for 90 days by default." } });
  assert.equal(finalizeReview(candidate, incompleteReview, incomplete).status, "fail");
  const full = "Managed workspaces default to 90 days, but an explicit retentionDays setting of 12 overrides that default; see docs/policy.md, Record retention.";
  const fullCandidate = analyzeResponse("cited-answer", full, "33445566778899aa");
  const fullReview = bindReview(fullCandidate, "cited-answer", { citedAnswer: { oneSentence: true, managedDefault90: true, explicit12Days: true, explainsOverride: true, citationPathSupported: true, citationHeadingSupported: true, responseQuote: full, sourcePath: "docs/policy.md", heading: "Record retention", sourceQuote: "Managed workspaces retain records for 90 days by default. Other workspaces retain records for 30 days by default. An explicit `retentionDays` setting takes precedence over either default." } });
  assert.equal(finalizeReview(fullCandidate, fullReview, full).status, "pass");
});

test("whitespace-token word limits are deterministic candidate evidence and gate final score", () => {
  const long = `${summaryText} ${Array.from({ length: 91 }, (_, index) => `word${index}`).join(" ")}`;
  const candidate = analyzeResponse("module-summary", long, "445566778899aabb");
  assert.equal(candidate.candidateEvidence.wordLimit.withinLimit, false);
  const facts = summaryFacts.map(fact => ({ ...fact, responseQuote: summaryText.slice(0, fact.responseQuote.length) }));
  const review = bindReview(candidate, "module-summary", { moduleSummary: { facts, unsupportedMaterialClaims: [], wordLimitReviewed: true } });
  assert.equal(finalizeReview(candidate, review, long).status, "fail");
});

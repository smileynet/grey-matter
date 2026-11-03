#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKET_DIR = join(ROOT, "scripts", "fixtures", "model-research", "t169");
const KEY_PATH = join(ROOT, ".scratch", "t169", "answer-key.json");
const KEY_HASH = "429bf76172338d0f52963d3ac2c14fba3f701defaae42e444997a1096c04efae";
const SOURCE_HASH = "a43525e265ddc6d7cc832cbee0ca9b0ed4a6090a614a0dbb747eb24bc4be572c";
const TASK_HASH = "eea777d4ff95ebd56a20b29b7a30f282c53fa8a982e1ea60b0fc702d750de6a5";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

function readPacket() {
  const sourceBytes = readFileSync(join(PACKET_DIR, "source-files.json"));
  const taskBytes = readFileSync(join(PACKET_DIR, "tasks.json"));
  if (sha256(sourceBytes) !== SOURCE_HASH || sha256(taskBytes) !== TASK_HASH) throw new Error("Frozen source packet changed");
  return { source: JSON.parse(sourceBytes.toString("utf8")), tasks: JSON.parse(taskBytes.toString("utf8")) };
}

function loadKey() {
  const bytes = readFileSync(KEY_PATH);
  if (sha256(bytes) !== KEY_HASH) throw new Error("Held-out answer key changed");
  return JSON.parse(bytes.toString("utf8"));
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

export function analyzeResponse(task, response, blindId, key = loadKey()) {
  if (typeof response !== "string" || !response.trim()) throw new Error("Final response must be non-empty text");
  if (!/^[a-f0-9]{16,64}$/i.test(blindId ?? "")) throw new Error("Use an opaque random blind ID; do not include model or provider labels");
  const candidateEvidence = { wordCount: wordCount(response), responseSha256: sha256(Buffer.from(response, "utf8")) };
  if (task === "callers") {
    const mentionedPaths = [...new Set(response.match(/\bsrc\/(?:[\w-]+\/)*[\w-]+\.(?:js|mjs)\b/g) ?? [])].sort();
    const expectedPaths = [...key.callers].sort();
    candidateEvidence.paths = {
      mentionedPaths,
      expectedPaths,
      missingExpectedPaths: expectedPaths.filter(path => !mentionedPaths.includes(path)),
      otherMentionedPaths: mentionedPaths.filter(path => !expectedPaths.includes(path)),
      interpretation: "Candidate path evidence only. A path mention does not prove that the file calls the function; the blind reviewer checks source behavior.",
    };
  } else if (task === "module-summary") {
    candidateEvidence.wordLimit = { limit: 90, countMethod: "whitespace-delimited tokens", withinLimit: candidateEvidence.wordCount <= 90 };
    candidateEvidence.interpretation = "No keyword matcher determines fact coverage or unsupported claims; those require the blind review.";
  } else if (task === "cited-answer") {
    candidateEvidence.citation = {
      expectedPath: key.citedAnswer.source,
      expectedHeading: key.citedAnswer.heading,
      pathMentioned: response.includes(key.citedAnswer.source),
      headingMentioned: response.includes(key.citedAnswer.heading),
      interpretation: "Citation text presence only. The reviewer checks whether the whole answer correctly relates the 90-day managed default to the explicit 12-day override, and whether the citation supports it.",
    };
  } else {
    throw new Error(`Unknown research task: ${task}`);
  }
  return {
    schemaVersion: 2,
    task,
    blindId,
    status: "semantic-grade-pending",
    responseSha256: candidateEvidence.responseSha256,
    sourceSha256: SOURCE_HASH,
    taskManifestSha256: TASK_HASH,
    answerKeySha256: KEY_HASH,
    candidateEvidence,
  };
}

function requireQuote(text, quote, label) {
  if (typeof quote !== "string" || !quote.trim() || !text.includes(quote)) throw new Error(`Review evidence quote is absent from ${label}`);
}

function requireSourceQuote(files, path, quote) {
  if (typeof quote !== "string" || !quote.trim() || !files[path]?.includes(quote)) throw new Error(`Review evidence quote is absent from ${path}`);
}

function validateReview(task, candidate, review, response, packet, key) {
  if (review.schemaVersion !== 1 || review.blindId !== candidate.blindId || review.task !== task || review.candidateSha256 !== sha256(Buffer.from(`${JSON.stringify(candidate)}\n`))) throw new Error("Manual review does not bind the candidate and blind task");
  if (Object.keys(review).some(name => /provider|model|tier|profile/i.test(name))) throw new Error("Blind review must not include provider or profile identity");
  if (!review.reviewerId || typeof review.reviewerId !== "string" || /claude|codex|kiro|google|agy|cheap|default|haiku|luna|qwen/i.test(review.reviewerId)) throw new Error("Review needs an independent reviewer ID without a model/profile label");
  const allSources = Object.values(packet.source.files).join("\n");
  if (task === "callers") {
    const { claimedCallerPaths, actualCallerPaths, evidence } = review.callers ?? {};
    if (!Array.isArray(actualCallerPaths) || JSON.stringify([...actualCallerPaths].sort()) !== JSON.stringify([...key.callers].sort())) throw new Error("Manual source review must verify exactly the keyed caller paths");
    if (!Array.isArray(evidence) || evidence.length !== key.callers.length || JSON.stringify(evidence.map(item => item.path).sort()) !== JSON.stringify([...key.callers].sort())) throw new Error("Provide one source quote for each distinct actual caller and response quotes where claimed");
    for (const item of evidence) {
      if (!key.callers.includes(item.path)) throw new Error("Caller evidence names an unexpected path");
      requireSourceQuote(packet.source.files, item.path, item.sourceQuote);
      if (item.responseQuote) {
        requireQuote(response, item.responseQuote, "the response");
        if (!item.responseQuote.includes(item.path)) throw new Error("Caller response evidence must include its path");
      }
    }
    const claimed = Array.isArray(claimedCallerPaths) ? [...new Set(claimedCallerPaths)].sort() : [];
    const expected = [...key.callers].sort();
    const missing = expected.filter(path => !claimed.includes(path));
    const invented = claimed.filter(path => !expected.includes(path));
    const quoted = new Set(evidence.filter(item => item.responseQuote).map(item => item.path));
    return { pass: missing.length === 0 && invented.length === 0 && expected.every(path => quoted.has(path)), missing, invented, basis: "blind reviewer distinguished caller claims from incidental path mentions and checked them against source behavior" };
  }
  if (task === "module-summary") {
    const { facts, unsupportedMaterialClaims, wordLimitReviewed } = review.moduleSummary ?? {};
    const factIds = ["explicitOverrideIncludingZero", "managedDefault90", "otherDefault30", "ownerRequired", "lockedCannotDelete"];
    if (!Array.isArray(facts) || facts.length !== factIds.length || facts.some((fact, index) => typeof fact.supported !== "boolean" || fact.id !== factIds[index])) throw new Error("Manual review must score each of the five frozen summary facts in rubric order");
    for (const fact of facts) {
      if (fact.supported) {
        requireQuote(response, fact.responseQuote, "the response");
        const file = packet.source.files[fact.sourcePath];
        requireSourceQuote({ [fact.sourcePath]: file }, fact.sourcePath, fact.sourceQuote);
      } else if (fact.responseQuote) {
        requireQuote(response, fact.responseQuote, "the response");
      }
    }
    if (!Array.isArray(unsupportedMaterialClaims)) throw new Error("List unsupported material claims explicitly, or use an empty array");
    for (const claim of unsupportedMaterialClaims) requireQuote(response, claim.responseQuote, "the response");
    const withinLimit = candidate.candidateEvidence.wordLimit.withinLimit;
    if (wordLimitReviewed !== true) throw new Error("Reviewer must confirm the frozen whitespace-token word-count rule");
    return { pass: facts.filter(fact => fact.supported).length >= 4 && unsupportedMaterialClaims.length === 0 && withinLimit, supportedFacts: facts.filter(fact => fact.supported).length, factTotal: facts.length, unsupportedMaterialClaimCount: unsupportedMaterialClaims.length, withinWordLimit: withinLimit };
  }
  const cited = review.citedAnswer ?? {};
  for (const field of ["oneSentence", "managedDefault90", "explicit12Days", "explainsOverride", "citationPathSupported", "citationHeadingSupported"]) {
    if (cited[field] !== true) return { pass: false, failedCriteria: [field] };
  }
  requireQuote(response, cited.responseQuote, "the response");
  if (cited.sourcePath !== key.citedAnswer.source || cited.heading !== key.citedAnswer.heading) throw new Error("Cited answer review lacks matching source and heading evidence");
  requireSourceQuote(packet.source.files, cited.sourcePath, cited.sourceQuote);
  if (!allSources.includes(cited.sourceQuote)) throw new Error("Cited answer evidence does not match the supplied source packet");
  return { pass: true, basis: "blind reviewer confirmed the complete semantic relation, one-sentence constraint and exact supporting citation" };
}

export function finalizeReview(candidate, review, response, packet = readPacket(), key = loadKey()) {
  if (!candidate || !candidate.candidateEvidence || sha256(Buffer.from(response, "utf8")) !== candidate.responseSha256 || candidate.sourceSha256 !== SOURCE_HASH || candidate.taskManifestSha256 !== TASK_HASH || candidate.answerKeySha256 !== KEY_HASH) throw new Error("Candidate does not match frozen inputs and response bytes");
  const manual = validateReview(candidate.task, candidate, review, response, packet, key);
  return { schemaVersion: 2, task: candidate.task, blindId: candidate.blindId, responseSha256: candidate.responseSha256, sourceSha256: SOURCE_HASH, taskManifestSha256: TASK_HASH, answerKeySha256: KEY_HASH, status: manual.pass ? "pass" : "fail", manualReview: { reviewerId: review.reviewerId, candidateSha256: sha256(Buffer.from(`${JSON.stringify(candidate)}\n`)) }, candidateEvidence: candidate.candidateEvidence, manual };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [, , command, ...args] = process.argv;
    if (command === "candidate") {
      const [task, responsePath, blindId, candidatePath] = args;
      if (!task || !responsePath || !blindId || !candidatePath) throw new Error("Usage: node scripts/grade-model-tier-research-t169.mjs candidate TASK RESPONSE.txt BLIND_ID CANDIDATE.json");
      const response = readFileSync(responsePath, "utf8");
      const candidate = analyzeResponse(task, response, blindId);
      writeFileSync(candidatePath, `${JSON.stringify(candidate, null, 2)}\n`, { flag: "wx" });
      process.stdout.write(`${JSON.stringify({ task, blindId, status: candidate.status, responseSha256: candidate.responseSha256, candidate: candidatePath })}\n`);
    } else if (command === "finalize") {
      const [candidatePath, responsePath, reviewPath, scorePath] = args;
      if (!candidatePath || !responsePath || !reviewPath || !scorePath) throw new Error("Usage: node scripts/grade-model-tier-research-t169.mjs finalize CANDIDATE.json RESPONSE.txt BLIND_REVIEW.json SCORE.json");
      const candidate = JSON.parse(readFileSync(candidatePath, "utf8"));
      const response = readFileSync(responsePath, "utf8");
      const review = JSON.parse(readFileSync(reviewPath, "utf8"));
      const score = finalizeReview(candidate, review, response);
      writeFileSync(scorePath, `${JSON.stringify(score, null, 2)}\n`, { flag: "wx" });
      process.stdout.write(`${JSON.stringify({ task: score.task, blindId: score.blindId, status: score.status, score: scorePath })}\n`);
    } else {
      throw new Error("Usage: node scripts/grade-model-tier-research-t169.mjs candidate TASK RESPONSE.txt BLIND_ID CANDIDATE.json | finalize CANDIDATE.json RESPONSE.txt BLIND_REVIEW.json SCORE.json");
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

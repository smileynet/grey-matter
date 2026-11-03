import { createHash } from "node:crypto";

const ISSUE_KINDS = new Set(["unsupported", "omission", "incorrect", "format", "unsafe"]);
const sha = (value) => createHash("sha256").update(value).digest("hex").toUpperCase();

export function validateReviewBody(body, fixture, answerKey, response) {
  const errors = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) return { valid: false, errors: ["body must be a JSON object"] };
  const expectedKeys = ["scorable", "scores", "issues", "summary"].sort();
  if (JSON.stringify(Object.keys(body).sort()) !== JSON.stringify(expectedKeys)) errors.push("body keys must match the frozen schema");
  if (typeof body.scorable !== "boolean") errors.push("scorable must be boolean");
  const dimensions = Object.keys(fixture.scoreDimensions).sort();
  if (body.scorable === false && body.scores === null) {
    if (!Array.isArray(body.issues) || body.issues.length) errors.push("unscorable review must leave issues empty");
  } else if (!body.scores || typeof body.scores !== "object" || Array.isArray(body.scores) || JSON.stringify(Object.keys(body.scores).sort()) !== JSON.stringify(dimensions)) {
    errors.push("scorable review must contain each fixture dimension exactly once");
  } else {
    for (const [name, score] of Object.entries(body.scores)) if (!Number.isInteger(score) || score < 0 || score > 2) errors.push(`invalid score for ${name}`);
  }
  if (!Array.isArray(body.issues)) errors.push("issues must be an array");
  else for (const [index, issue] of body.issues.entries()) {
    if (!issue || typeof issue !== "object" || Array.isArray(issue) || JSON.stringify(Object.keys(issue).sort()) !== JSON.stringify(["evidence", "key", "kind", "reason"])) {
      errors.push(`issue ${index} has invalid shape`); continue;
    }
    if (!ISSUE_KINDS.has(issue.kind)) errors.push(`issue ${index} has unknown kind`);
    if (!answerKey.issueKeys.includes(issue.key)) errors.push(`issue ${index} has unknown key`);
    if (typeof issue.evidence !== "string" || (issue.kind === "omission" ? issue.evidence !== "" : !issue.evidence || !response.includes(issue.evidence))) errors.push(`issue ${index} evidence is missing or not an exact response substring`);
    if (typeof issue.reason !== "string" || !issue.reason.trim()) errors.push(`issue ${index} reason is empty`);
  }
  if (typeof body.summary !== "string" || !body.summary.trim() || body.summary.trim().split(/\s+/).length > 35) errors.push("summary must be one concise sentence of at most 35 words");
  if (body.scorable && errors.length) errors.push("review marked scorable despite schema errors");
  return { valid: errors.length === 0, errors };
}

export function bindReview({ rawReviewBytes, responseBytes, fixtureBytes, rubricBytes, answerKeyBytes, reviewerTraceBytes, fixture, answerKey }) {
  if (!Buffer.isBuffer(reviewerTraceBytes) || reviewerTraceBytes.length === 0) throw new TypeError("exact reviewer dispatch/completion trace bytes are required");
  const reviewerTrace = JSON.parse(reviewerTraceBytes.toString("utf8"));
  const reviewerId = reviewerTrace.spawnResult?.agentId;
  if (typeof reviewerId !== "string" || !reviewerId.trim() || typeof reviewerTrace.spawnResult?.canonicalTaskName !== "string" || !reviewerTrace.spawnResult.canonicalTaskName.trim() ||
    typeof reviewerTrace.dispatchInput?.task !== "string" || !reviewerTrace.dispatchInput.task.trim() ||
    reviewerTrace.completion?.agentId !== reviewerId || reviewerTrace.completion?.status !== "completed") {
    throw new TypeError("reviewer identity must match canonical spawn and completed task metadata");
  }
  if (typeof reviewerTrace.completion?.rawReviewSha256 !== "string" || reviewerTrace.completion.rawReviewSha256.toUpperCase() !== sha(rawReviewBytes)) throw new TypeError("completion metadata must bind the exact raw reviewer response hash");
  let semanticBody;
  let validation;
  try {
    semanticBody = JSON.parse(rawReviewBytes.toString("utf8"));
    validation = validateReviewBody(semanticBody, fixture, answerKey, responseBytes.toString("utf8"));
  } catch {
    semanticBody = null;
    validation = { valid: false, errors: ["raw reviewer bytes are not valid JSON"] };
  }
  return {
    schemaVersion: 1,
    reviewer: {
      agentId: reviewerId,
      canonicalTaskName: reviewerTrace.spawnResult.canonicalTaskName,
      identitySource: "collaboration dispatch and completion trace",
      dispatchTaskSha256: sha(Buffer.from(reviewerTrace.dispatchInput?.task ?? "")),
      completionStatus: reviewerTrace.completion.status,
      traceSha256: sha(reviewerTraceBytes),
    },
    candidateBinding: {
      responseSha256: sha(responseBytes),
      fixtureSha256: sha(fixtureBytes),
      rubricSha256: sha(rubricBytes),
      answerKeySha256: sha(answerKeyBytes),
    },
    rawReviewSha256: sha(rawReviewBytes),
    semanticBody,
    validation,
  };
}

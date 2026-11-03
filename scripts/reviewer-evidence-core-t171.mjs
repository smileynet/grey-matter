import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => `${JSON.stringify(value)}\n`;
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

function exactKeys(value, keys, label) {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  requireThat(Object.keys(value).sort().join('\0') === [...keys].sort().join('\0'), `${label} has unexpected or missing fields`);
}

export function candidateFormatValid(packet) {
  let candidate;
  try { candidate = JSON.parse(packet.body.candidateResponse); } catch { return false; }
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  const fields = packet.body.taskId === 'diagnosis'
    ? ['rootCause', 'minimalFix', 'regressionTest', 'affectedPaths']
    : ['recordStates', 'uniquenessBoundary', 'requestMismatchRule', 'crashRecovery', 'retentionRule'];
  if (Object.keys(candidate).sort().join('\0') !== [...fields].sort().join('\0')) return false;
  if (packet.body.taskId === 'diagnosis') {
    return fields.slice(0, 3).every((key) => typeof candidate[key] === 'string')
      && Array.isArray(candidate.affectedPaths)
      && candidate.affectedPaths.length > 0
      && candidate.affectedPaths.every((path) => typeof path === 'string');
  }
  return fields.every((key) => typeof candidate[key] === 'string'
    ? candidate[key].trim().length > 0
    : candidate[key] && typeof candidate[key] === 'object' && !Array.isArray(candidate[key]) && Object.keys(candidate[key]).length > 0);
}

export function validateSemanticBody(reviewBody, taskKey, packet) {
  exactKeys(reviewBody, ['requiredFacts', 'unsafeClaims', 'formatValid', 'finalLabel'], 'review body');
  requireThat(Array.isArray(reviewBody.requiredFacts), 'requiredFacts must be an array');
  requireThat(Array.isArray(reviewBody.unsafeClaims), 'unsafeClaims must be an array');
  requireThat(typeof reviewBody.formatValid === 'boolean', 'formatValid must be boolean');
  requireThat(['pass', 'fail'].includes(reviewBody.finalLabel), 'complete-response packets may only be labeled pass or fail');
  const observedFormatValid = candidateFormatValid(packet);
  requireThat(reviewBody.formatValid === observedFormatValid, 'formatValid contradicts the candidate JSON and task-specific response schema');
  const identityLeak = /\b(?:Claude|Codex|OpenAI|Anthropic|GPT[- ]?6(?:\.1)?|Opus\s*5(?:\.5)?|Kiro|Qwen3|Agy|Google)\b|\b[0-9a-f]{8}-[0-9a-f-]{27}\b/i;
  requireThat(!identityLeak.test(JSON.stringify(reviewBody)), 'semantic review body leaks provider/model identity or an identifier');

  const expectedFacts = taskKey.requiredFacts;
  requireThat(reviewBody.requiredFacts.length === expectedFacts.length, 'requiredFacts must cover every rubric fact exactly once');
  const seenFacts = new Set();
  let allFactsSupported = true;
  for (let index = 0; index < reviewBody.requiredFacts.length; index += 1) {
    const item = reviewBody.requiredFacts[index];
    exactKeys(item, ['fact', 'supported', 'responseQuote', 'sourcePath', 'sourceQuote'], `requiredFacts[${index}]`);
    requireThat(item.fact === expectedFacts[index], `requiredFacts[${index}] is missing, duplicated, or out of rubric order`);
    requireThat(!seenFacts.has(item.fact), `duplicate required fact: ${item.fact}`);
    seenFacts.add(item.fact);
    requireThat(typeof item.supported === 'boolean', `requiredFacts[${index}].supported must be boolean`);
    requireThat(typeof item.responseQuote === 'string' && typeof item.sourceQuote === 'string', `requiredFacts[${index}] quotes must be strings`);
    requireThat(typeof item.sourcePath === 'string' && taskKey.expectedPaths.includes(item.sourcePath) && Object.hasOwn(packet.body.sourceFiles, item.sourcePath), `requiredFacts[${index}] must cite an expected supplied source path`);
    requireThat(item.sourceQuote.length > 0 && packet.body.sourceFiles[item.sourcePath].includes(item.sourceQuote), `requiredFacts[${index}] sourceQuote is not an exact quote from its source`);
    if (item.supported) {
      requireThat(item.responseQuote.length > 0 && packet.body.candidateResponse.includes(item.responseQuote), `requiredFacts[${index}] responseQuote is not an exact quote from the candidate`);
    } else {
      requireThat(item.responseQuote === '', `unsupported required fact ${item.fact} must have an empty responseQuote`);
      allFactsSupported = false;
    }
  }
  requireThat(seenFacts.size === expectedFacts.length, 'required fact set is incomplete');

  const seenUnsafe = new Set();
  for (let index = 0; index < reviewBody.unsafeClaims.length; index += 1) {
    const item = reviewBody.unsafeClaims[index];
    exactKeys(item, ['claim', 'responseQuote', 'reason'], `unsafeClaims[${index}]`);
    requireThat(taskKey.unsafeClaims.includes(item.claim), `unsafeClaims[${index}] is not a rubric unsafe claim`);
    requireThat(!seenUnsafe.has(item.claim), `duplicate unsafe claim: ${item.claim}`);
    seenUnsafe.add(item.claim);
    requireThat(typeof item.responseQuote === 'string' && item.responseQuote.length > 0 && packet.body.candidateResponse.includes(item.responseQuote), `unsafeClaims[${index}] responseQuote is not an exact quote from the candidate`);
    requireThat(typeof item.reason === 'string' && item.reason.trim().length > 0, `unsafeClaims[${index}] requires a reason`);
  }

  const shouldPass = allFactsSupported && observedFormatValid && reviewBody.unsafeClaims.length === 0;
  requireThat(reviewBody.finalLabel === (shouldPass ? 'pass' : 'fail'), 'finalLabel contradicts required-fact, format, or unsafe-claim results');
}

export function buildReviewerEnvelope({ packetId, entry, packet, packetBytes, taskKey, fixture, fixtureBytes, reviewBytes, reviewBodyPath, dispatchBytes, completionBytes, dispatchTracePath, completionTracePath, attemptNumber = 1 }) {
  requireThat(Number.isSafeInteger(attemptNumber) && attemptNumber > 0, 'attemptNumber must be a positive integer');
  requireThat(hash(packetBytes) === entry.packetSha256, 'packet bytes do not match the manifest');
  requireThat(hash(Buffer.from(canonical(packet.body), 'utf8')) === packet.bodySha256 && packet.bodySha256 === entry.bodySha256, 'packet body hash mismatch');
  requireThat(hash(Buffer.from(packet.body.candidateResponse, 'utf8')) === entry.responseSha256, 'candidate response hash mismatch');
  requireThat(packet.packetId === packetId && entry.packetId === packetId && packet.body.taskId === entry.taskId, 'packet identity/task mismatch');
  requireThat(hash(fixtureBytes) === entry.fixtureSha256, 'fixture bytes do not match packet manifest');
  requireThat(JSON.stringify(fixture.files) === JSON.stringify(packet.body.sourceFiles), 'packet source files differ from frozen fixture');
  requireThat(JSON.stringify(taskKey.requiredFacts) === JSON.stringify(packet.body.frozenRubric.requiredFacts), 'packet required facts differ from frozen key');
  requireThat(JSON.stringify(taskKey.unsafeClaims) === JSON.stringify(packet.body.frozenRubric.unsafeClaims), 'packet unsafe claims differ from frozen key');
  requireThat(JSON.stringify(taskKey.expectedPaths) === JSON.stringify(packet.body.frozenRubric.expectedPaths), 'packet expected paths differ from frozen key');

  const reviewBody = JSON.parse(reviewBytes.toString('utf8'));
  validateSemanticBody(reviewBody, taskKey, packet);
  const dispatch = JSON.parse(dispatchBytes.toString('utf8'));
  const completion = JSON.parse(completionBytes.toString('utf8'));
  requireThat(dispatchBytes.toString('utf8') === canonical(dispatch) && completionBytes.toString('utf8') === canonical(completion), 'provenance records must use canonical JSON with one trailing newline');
  const traceFields = ['recordType', 'collaboratorTaskName', 'packetId'];
  exactKeys(dispatch, traceFields, 'dispatch trace');
  exactKeys(completion, [...traceFields, 'reviewOutputPath', 'reviewOutputSha256'], 'completion trace');
  const canonicalTask = /^\/root\/[A-Za-z0-9_/-]+$/;
  requireThat(dispatch.recordType === 'parent-transcribed-collaboration-dispatch' && completion.recordType === 'parent-transcribed-collaboration-completion', 'provenance must be explicitly parent-transcribed collaboration records');
  requireThat(canonicalTask.test(dispatch.collaboratorTaskName) && dispatch.collaboratorTaskName === completion.collaboratorTaskName, 'traces must name the same actual canonical collaboration task');
  requireThat(dispatch.packetId === packetId && completion.packetId === packetId, 'trace packet binding mismatch');
  requireThat(resolve(completion.reviewOutputPath) === resolve(reviewBodyPath), 'completion trace output path does not match supplied review file');
  requireThat(hash(reviewBytes) === completion.reviewOutputSha256, 'review output bytes do not match parent-transcribed completion SHA-256');

  const envelope = {
    schemaVersion: 1,
    ticket: 171,
    taskId: entry.taskId,
    attemptNumber,
    fixtureSha256: entry.fixtureSha256,
    responseSha256: entry.responseSha256,
    reviewBodySha256: hash(Buffer.from(canonical(reviewBody), 'utf8')),
    reviewBody,
    provenance: {
      collaborationTaskId: dispatch.collaboratorTaskName,
      dispatchTrace: { path: resolve(dispatchTracePath), sha256: hash(dispatchBytes) },
      completionTrace: { path: resolve(completionTracePath), sha256: hash(completionBytes) },
      blindPacketId: packetId,
    },
  };
  envelope.envelopeSha256 = hash(Buffer.from(canonical(envelope), 'utf8'));
  return envelope;
}

export async function writeEnvelopeExclusive(outputPath, envelope) {
  const handle = await open(resolve(outputPath), 'wx');
  try { await handle.writeFile(canonical(envelope), 'utf8'); }
  finally { await handle.close(); }
  return { outputPath: resolve(outputPath), envelopeSha256: envelope.envelopeSha256 };
}

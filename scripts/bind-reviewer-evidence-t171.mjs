import { createHash } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reviewRoot = resolve(root, '.scratch/t171/review');
const prepRoot = resolve(root, '.scratch/t171/preparation');
const frozenManifestSha256 = '33e36505a112a69f961a81a126e0d8f25aaf29ee7850d77589f021160d7db6cc';
const frozenPlanSha256 = '1b5a645ac309ca0cf6967437b91258096be4e844befdcba721d605c664a64aaf';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => `${JSON.stringify(value)}\n`;
const readJson = async (path) => JSON.parse((await readFile(path, 'utf8')));
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

function exactKeys(value, keys, label) {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  requireThat(Object.keys(value).sort().join('\0') === [...keys].sort().join('\0'), `${label} has unexpected or missing fields`);
}

function candidateFormatValid(packet) {
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

function validateSemanticBody(reviewBody, taskKey, packet) {
  exactKeys(reviewBody, ['requiredFacts', 'unsafeClaims', 'formatValid', 'finalLabel'], 'review body');
  requireThat(Array.isArray(reviewBody.requiredFacts), 'requiredFacts must be an array');
  requireThat(Array.isArray(reviewBody.unsafeClaims), 'unsafeClaims must be an array');
  requireThat(typeof reviewBody.formatValid === 'boolean', 'formatValid must be boolean');
  requireThat(['pass', 'fail'].includes(reviewBody.finalLabel), 'complete-response packets may only be labeled pass or fail');
  const observedFormatValid = candidateFormatValid(packet);
  requireThat(reviewBody.formatValid === observedFormatValid, 'formatValid contradicts the candidate JSON and task-specific response schema');
  const identityLeak = /\b(?:Claude|Codex|OpenAI|Anthropic|GPT[- ]?6(?:\.1)?|Opus\s*5(?:\.5)?|Kiro|Qwen3|Agy|Google)\b|\b[0-9a-f]{8}-[0-9a-f-]{27}\b/i;
  const reviewText = JSON.stringify(reviewBody);
  requireThat(!identityLeak.test(reviewText), 'semantic review body leaks provider/model identity or an identifier');

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

async function bindReviewerEvidence({ packetId, reviewBodyPath, dispatchTracePath, completionTracePath, attemptNumber = 1, outputPath }) {
  requireThat(/^pkt-[0-9a-f-]{36}$/.test(packetId), 'invalid opaque packet ID');
  requireThat(Number.isSafeInteger(attemptNumber) && attemptNumber > 0, 'attemptNumber must be a positive integer');
  const manifestBytes = await readFile(resolve(reviewRoot, 'blind-packet-manifest.json'));
  requireThat(hash(manifestBytes) === frozenManifestSha256, 'blind manifest differs from its frozen hash');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const entry = manifest.packets.find((item) => item.packetId === packetId);
  requireThat(entry, 'packet is absent from the frozen manifest');
  const packetPath = resolve(root, entry.path);
  const packetRelativePath = relative(reviewRoot, packetPath);
  requireThat(packetRelativePath && !packetRelativePath.startsWith(`..${sep}`) && packetRelativePath !== '..', 'manifest packet path escapes the frozen review directory');
  const packetBytes = await readFile(packetPath);
  requireThat(hash(packetBytes) === entry.packetSha256, 'packet bytes do not match the manifest');
  const packet = JSON.parse(packetBytes.toString('utf8'));
  const bodyBytes = Buffer.from(canonical(packet.body), 'utf8');
  requireThat(hash(bodyBytes) === packet.bodySha256 && packet.bodySha256 === entry.bodySha256, 'packet body hash mismatch');
  requireThat(hash(Buffer.from(packet.body.candidateResponse, 'utf8')) === entry.responseSha256, 'candidate response hash mismatch');
  requireThat(packet.packetId === packetId && packet.body.taskId === entry.taskId, 'packet identity/task mismatch');

  const keyBytes = await readFile(resolve(prepRoot, 'answer-key.json'));
  const rubricBytes = await readFile(resolve(prepRoot, 'grading-rubric.json'));
  const planBytes = await readFile(resolve(prepRoot, 'prepared-plan-3c6d0d3091d4-hostpin-amendment.json'));
  requireThat(hash(planBytes) === frozenPlanSha256, 'prepared plan differs from its frozen hash');
  const plan = JSON.parse(planBytes.toString('utf8'));
  requireThat(hash(keyBytes) === plan.privateInputHashes.answerKeySha256, 'answer key bytes do not match the frozen plan');
  requireThat(hash(rubricBytes) === plan.privateInputHashes.rubricSha256, 'grading rubric bytes do not match the frozen plan');
  const answerKey = JSON.parse(keyBytes.toString('utf8'));
  const rubric = JSON.parse(rubricBytes.toString('utf8'));
  const taskKey = answerKey.tasks[entry.taskId];
  requireThat(taskKey && JSON.stringify(taskKey.requiredFacts) === JSON.stringify(packet.body.frozenRubric.requiredFacts), 'packet required facts differ from frozen key');
  requireThat(JSON.stringify(taskKey.unsafeClaims) === JSON.stringify(packet.body.frozenRubric.unsafeClaims), 'packet unsafe claims differ from frozen key');
  requireThat(JSON.stringify(taskKey.expectedPaths) === JSON.stringify(packet.body.frozenRubric.expectedPaths), 'packet expected paths differ from frozen key');
  const fixtureBytes = await readFile(resolve(root, 'scripts/fixtures/model-effort-t171', `${entry.taskId}.json`));
  const fixture = JSON.parse(fixtureBytes.toString('utf8'));
  requireThat(hash(fixtureBytes) === entry.fixtureSha256, 'fixture bytes do not match packet manifest');
  requireThat(JSON.stringify(fixture.files) === JSON.stringify(packet.body.sourceFiles), 'packet source files differ from frozen fixture');
  requireThat(rubric.reviewBodies[entry.taskId] && rubric.reviewBodies[entry.taskId].finalLabel.enum.join(',') === 'pass,fail,unscorable', 'grading rubric schema is missing or changed');

  const reviewBytes = await readFile(resolve(reviewBodyPath));
  const reviewBody = JSON.parse(reviewBytes.toString('utf8'));
  validateSemanticBody(reviewBody, taskKey, packet);

  const dispatchBytes = await readFile(resolve(dispatchTracePath));
  const completionBytes = await readFile(resolve(completionTracePath));
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
  const destination = resolve(outputPath);
  const handle = await open(destination, 'wx');
  try { await handle.writeFile(canonical(envelope), 'utf8'); }
  finally { await handle.close(); }
  return { outputPath: destination, envelopeSha256: envelope.envelopeSha256 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [packetId, reviewBodyPath, dispatchTracePath, completionTracePath, outputPath, attemptText] = process.argv.slice(2);
  if (!packetId || !reviewBodyPath || !dispatchTracePath || !completionTracePath || !outputPath) {
    throw new Error('Usage: node scripts/bind-reviewer-evidence-t171.mjs <packetId> <reviewBody.json> <dispatch.json> <completion.json> <newEnvelope.json> [attemptNumber]');
  }
  const result = await bindReviewerEvidence({ packetId, reviewBodyPath, dispatchTracePath, completionTracePath, outputPath, attemptNumber: attemptText ? Number(attemptText) : 1 });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

export { bindReviewerEvidence, candidateFormatValid, validateSemanticBody };

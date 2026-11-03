import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReviewerEnvelope, writeEnvelopeExclusive } from './reviewer-evidence-core-t171.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reviewRoot = resolve(root, '.scratch/t171/review');
const prepRoot = resolve(root, '.scratch/t171/preparation');
const frozenManifestSha256 = '33e36505a112a69f961a81a126e0d8f25aaf29ee7850d77589f021160d7db6cc';
const frozenPlanSha256 = '1b5a645ac309ca0cf6967437b91258096be4e844befdcba721d605c664a64aaf';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) => `${JSON.stringify(value)}\n`;
const readJson = async (path) => JSON.parse((await readFile(path, 'utf8')));
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };

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
  requireThat(taskKey, 'frozen answer key has no task for this packet');
  const fixtureBytes = await readFile(resolve(root, 'scripts/fixtures/model-effort-t171', `${entry.taskId}.json`));
  const fixture = JSON.parse(fixtureBytes.toString('utf8'));
  requireThat(rubric.reviewBodies[entry.taskId] && rubric.reviewBodies[entry.taskId].finalLabel.enum.join(',') === 'pass,fail,unscorable', 'grading rubric schema is missing or changed');

  const reviewBytes = await readFile(resolve(reviewBodyPath));
  const dispatchBytes = await readFile(resolve(dispatchTracePath));
  const completionBytes = await readFile(resolve(completionTracePath));
  const envelope = buildReviewerEnvelope({ packetId, entry, packet, packetBytes, taskKey, fixture, fixtureBytes, reviewBytes, reviewBodyPath: resolve(reviewBodyPath), dispatchBytes, completionBytes, dispatchTracePath: resolve(dispatchTracePath), completionTracePath: resolve(completionTracePath), attemptNumber });
  return writeEnvelopeExclusive(outputPath, envelope);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [packetId, reviewBodyPath, dispatchTracePath, completionTracePath, outputPath, attemptText] = process.argv.slice(2);
  if (!packetId || !reviewBodyPath || !dispatchTracePath || !completionTracePath || !outputPath) {
    throw new Error('Usage: node scripts/bind-reviewer-evidence-t171.mjs <packetId> <reviewBody.json> <dispatch.json> <completion.json> <newEnvelope.json> [attemptNumber]');
  }
  const result = await bindReviewerEvidence({ packetId, reviewBodyPath, dispatchTracePath, completionTracePath, outputPath, attemptNumber: attemptText ? Number(attemptText) : 1 });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

export { bindReviewerEvidence };

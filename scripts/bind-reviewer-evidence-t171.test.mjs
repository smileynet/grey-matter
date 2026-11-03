import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { buildReviewerEnvelope, candidateFormatValid, validateSemanticBody, writeEnvelopeExclusive } from './reviewer-evidence-core-t171.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) => `${JSON.stringify(value)}\n`;

const taskKey = {
  requiredFacts: ['fact A', 'fact B'],
  unsafeClaims: ['unsafe A'],
  expectedPaths: ['docs/source.md'],
};
const sourceFiles = { 'docs/source.md': 'Source says requirement evidence.' };
const candidateResponse = '{"rootCause":"relevant evidence","minimalFix":"fix","regressionTest":"test","affectedPaths":["src/sample.mjs"]}';
const fixture = { files: sourceFiles };
const fixtureBytes = Buffer.from(canonical(fixture));
const candidatePacketBody = {
  taskId: 'diagnosis',
  candidateResponse,
  sourceFiles,
  frozenRubric: {
    requiredFacts: taskKey.requiredFacts,
    unsafeClaims: taskKey.unsafeClaims,
    expectedPaths: taskKey.expectedPaths,
  },
};
const packetId = 'pkt-581c5c1e-de13-478b-ad7a-a2ff77f0bf6b';
const packet = {
  schemaVersion: 1,
  packetId,
  bodySha256: hash(Buffer.from(canonical(candidatePacketBody))),
  body: candidatePacketBody,
};
const packetBytes = Buffer.from(canonical(packet));
const entry = {
  packetId,
  taskId: 'diagnosis',
  packetSha256: hash(packetBytes),
  bodySha256: packet.bodySha256,
  fixtureSha256: hash(fixtureBytes),
  responseSha256: hash(Buffer.from(candidateResponse)),
};

function reviewBody() {
  return {
    requiredFacts: taskKey.requiredFacts.map((fact) => ({
      fact,
      supported: false,
      responseQuote: '',
      sourcePath: 'docs/source.md',
      sourceQuote: 'requirement evidence',
    })),
    unsafeClaims: [],
    formatValid: true,
    finalLabel: 'fail',
  };
}

function bindings(reviewBytes, overrides = {}) {
  const reviewBodyPath = join(tmpdir(), 'synthetic-review.json');
  const dispatch = {
    recordType: 'parent-transcribed-collaboration-dispatch',
    collaboratorTaskName: '/root/synthetic_reviewer',
    packetId,
  };
  const completion = {
    recordType: 'parent-transcribed-collaboration-completion',
    collaboratorTaskName: '/root/synthetic_reviewer',
    packetId,
    reviewOutputPath: reviewBodyPath,
    reviewOutputSha256: hash(reviewBytes),
  };
  return {
    packetId,
    entry,
    packet,
    packetBytes,
    taskKey,
    fixture,
    fixtureBytes,
    reviewBytes,
    reviewBodyPath,
    dispatchBytes: Buffer.from(canonical(dispatch)),
    completionBytes: Buffer.from(canonical(completion)),
    dispatchTracePath: join(tmpdir(), 'synthetic-dispatch.json'),
    completionTracePath: join(tmpdir(), 'synthetic-completion.json'),
    ...overrides,
  };
}

test('synthetic core requires exact fact coverage, uniqueness, and exact source/response quotes', () => {
  const body = reviewBody();
  assert.doesNotThrow(() => validateSemanticBody(body, taskKey, packet));
  const missing = structuredClone(body);
  missing.requiredFacts.pop();
  assert.throws(() => validateSemanticBody(missing, taskKey, packet), /cover every rubric fact/);
  const duplicate = structuredClone(body);
  duplicate.requiredFacts[1].fact = duplicate.requiredFacts[0].fact;
  assert.throws(() => validateSemanticBody(duplicate, taskKey, packet), /missing, duplicated/);
  const wrongSource = structuredClone(body);
  wrongSource.requiredFacts[0].sourceQuote = 'invented requirement';
  assert.throws(() => validateSemanticBody(wrongSource, taskKey, packet), /not an exact quote/);
  const unsupportedQuote = structuredClone(body);
  unsupportedQuote.requiredFacts[0].supported = true;
  unsupportedQuote.requiredFacts[0].responseQuote = 'invented quote';
  assert.throws(() => validateSemanticBody(unsupportedQuote, taskKey, packet), /not an exact quote/);
});

test('synthetic core rejects fabricated identity data and contradictory labels', () => {
  const contradictory = reviewBody();
  contradictory.finalLabel = 'pass';
  assert.throws(() => validateSemanticBody(contradictory, taskKey, packet), /finalLabel contradicts/);
  const leakedIdentity = reviewBody();
  leakedIdentity.unsafeClaims.push({ claim: 'unsafe A', responseQuote: 'relevant evidence', reason: 'Codex said so' });
  leakedIdentity.finalLabel = 'fail';
  assert.throws(() => validateSemanticBody(leakedIdentity, taskKey, packet), /leaks provider\/model identity/);
});

test('synthetic envelope core binds exact output bytes and rejects tampering before write-once output', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 't171-binder-core-'));
  try {
    const bodyBytes = Buffer.from(`${JSON.stringify(reviewBody(), null, 2)}\n`);
    const input = bindings(bodyBytes);
    const envelope = buildReviewerEnvelope(input);
    assert.equal(envelope.reviewBodySha256, hash(Buffer.from(canonical(reviewBody()))));
    assert.equal(candidateFormatValid(packet), true);
    const outputPath = join(scratch, 'envelope.json');
    const result = await writeEnvelopeExclusive(outputPath, envelope);
    assert.equal(result.envelopeSha256, envelope.envelopeSha256);
    assert.equal(JSON.parse(await readFile(outputPath, 'utf8')).provenance.collaborationTaskId, '/root/synthetic_reviewer');
    await assert.rejects(writeEnvelopeExclusive(outputPath, envelope), /EEXIST/);

    const wrongOutputHash = bindings(bodyBytes, {
      completionBytes: Buffer.from(canonical({
        recordType: 'parent-transcribed-collaboration-completion',
        collaboratorTaskName: '/root/synthetic_reviewer',
        packetId,
        reviewOutputPath: input.reviewBodyPath,
        reviewOutputSha256: '0'.repeat(64),
      })),
    });
    assert.throws(() => buildReviewerEnvelope(wrongOutputHash), /do not match parent-transcribed completion SHA-256/);

    const inventedTrace = bindings(bodyBytes, {
      dispatchBytes: Buffer.from(canonical({
        recordType: 'platform-exported-trace',
        collaboratorTaskName: '/root/synthetic_reviewer',
        packetId,
      })),
    });
    assert.throws(() => buildReviewerEnvelope(inventedTrace), /parent-transcribed collaboration records/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

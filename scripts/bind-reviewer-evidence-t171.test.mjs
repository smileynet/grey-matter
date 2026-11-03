import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { bindReviewerEvidence, candidateFormatValid, validateSemanticBody } from './bind-reviewer-evidence-t171.mjs';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const canonical = (value) => `${JSON.stringify(value)}\n`;

const diagnosisKey = {
  requiredFacts: ['fact A', 'fact B'],
  unsafeClaims: ['unsafe A'],
  expectedPaths: ['docs/source.md'],
};
const packet = {
  body: {
    taskId: 'diagnosis',
    candidateResponse: '{"rootCause":"relevant evidence","minimalFix":"fix","regressionTest":"test","affectedPaths":["src/sample.mjs"]}',
    sourceFiles: { 'docs/source.md': 'source requirement evidence' },
  },
};

function supportedBody() {
  return {
    requiredFacts: diagnosisKey.requiredFacts.map((fact) => ({
      fact,
      supported: true,
      responseQuote: 'relevant evidence',
      sourcePath: 'docs/source.md',
      sourceQuote: 'requirement evidence',
    })),
    unsafeClaims: [],
    formatValid: true,
    finalLabel: 'pass',
  };
}

test('semantic review requires exact fact coverage, unique facts, and exact quotes', () => {
  const valid = supportedBody();
  assert.doesNotThrow(() => validateSemanticBody(valid, diagnosisKey, packet));
  const missing = structuredClone(valid);
  missing.requiredFacts.pop();
  assert.throws(() => validateSemanticBody(missing, diagnosisKey, packet), /cover every rubric fact/);
  const duplicate = structuredClone(valid);
  duplicate.requiredFacts[1].fact = duplicate.requiredFacts[0].fact;
  assert.throws(() => validateSemanticBody(duplicate, diagnosisKey, packet), /missing, duplicated/);
  const inventedQuote = structuredClone(valid);
  inventedQuote.requiredFacts[0].responseQuote = 'invented quote';
  assert.throws(() => validateSemanticBody(inventedQuote, diagnosisKey, packet), /not an exact quote/);
  const wrongSource = structuredClone(valid);
  wrongSource.requiredFacts[0].sourceQuote = 'invented requirement';
  assert.throws(() => validateSemanticBody(wrongSource, diagnosisKey, packet), /not an exact quote/);
});

test('semantic review rejects contradictory labels and fabricated unsafe evidence', () => {
  const body = supportedBody();
  body.finalLabel = 'fail';
  assert.throws(() => validateSemanticBody(body, diagnosisKey, packet), /finalLabel contradicts/);
  const unsafe = supportedBody();
  unsafe.unsafeClaims.push({ claim: 'unsafe A', responseQuote: 'invented', reason: 'unsupported' });
  unsafe.finalLabel = 'fail';
  assert.throws(() => validateSemanticBody(unsafe, diagnosisKey, packet), /not an exact quote/);
  const unsupported = supportedBody();
  unsupported.requiredFacts[0].supported = false;
  unsupported.requiredFacts[0].responseQuote = '';
  assert.throws(() => validateSemanticBody(unsupported, diagnosisKey, packet), /finalLabel contradicts/);
});

test('binder validates parent-transcribed provenance and reviewer output bytes, then writes once', async () => {
  const scratch = await mkdtemp(join(tmpdir(), 't171-binder-'));
  try {
    const bodyPath = join(scratch, 'review.json');
    const dispatchPath = join(scratch, 'dispatch.json');
    const completionPath = join(scratch, 'completion.json');
    const outputPath = join(scratch, 'envelope.json');
    const packetId = 'pkt-581c5c1e-de13-478b-ad7a-a2ff77f0bf6b';
    const requirePacketText = await readFile('.scratch/t171/review/packets/' + packetId + '.json', 'utf8');
    const packetObject = JSON.parse(requirePacketText);
    const actualBody = {
      requiredFacts: packetObject.body.frozenRubric.requiredFacts.map((fact) => ({
      fact, supported: false, responseQuote: '', sourcePath: Object.keys(packetObject.body.sourceFiles)[0],
      sourceQuote: Object.values(packetObject.body.sourceFiles)[0].slice(0, 24),
      })),
      unsafeClaims: [],
      formatValid: candidateFormatValid(packetObject),
      finalLabel: 'fail',
    };
    const bodyBytes = Buffer.from(`${JSON.stringify(actualBody, null, 2)}\n`);
    await writeFile(bodyPath, bodyBytes, { flag: 'wx' });
    const taskName = '/root/reviewer_test_integration';
    const dispatch = { recordType: 'parent-transcribed-collaboration-dispatch', collaboratorTaskName: taskName, packetId };
    const completion = { recordType: 'parent-transcribed-collaboration-completion', collaboratorTaskName: taskName, packetId, reviewOutputPath: bodyPath, reviewOutputSha256: hash(bodyBytes) };
    await writeFile(dispatchPath, canonical(dispatch), { flag: 'wx' });
    await writeFile(completionPath, canonical(completion), { flag: 'wx' });

    const result = await bindReviewerEvidence({ packetId, reviewBodyPath: bodyPath, dispatchTracePath: dispatchPath, completionTracePath: completionPath, outputPath });
    const envelope = JSON.parse(await readFile(outputPath, 'utf8'));
    assert.equal(envelope.provenance.collaborationTaskId, taskName);
    assert.equal(envelope.reviewBodySha256, hash(Buffer.from(canonical(actualBody))));
    assert.equal(result.envelopeSha256, envelope.envelopeSha256);
    await assert.rejects(bindReviewerEvidence({ packetId, reviewBodyPath: bodyPath, dispatchTracePath: dispatchPath, completionTracePath: completionPath, outputPath }), /EEXIST/);

    const tamperedCompletion = { ...completion, reviewOutputSha256: '0'.repeat(64) };
    const tamperedPath = join(scratch, 'tampered-completion.json');
    await writeFile(tamperedPath, canonical(tamperedCompletion), { flag: 'wx' });
    await assert.rejects(bindReviewerEvidence({ packetId, reviewBodyPath: bodyPath, dispatchTracePath: dispatchPath, completionTracePath: tamperedPath, outputPath: join(scratch, 'tampered-envelope.json') }), /do not match/);

    const fakeTracePath = join(scratch, 'fake-dispatch.json');
    await writeFile(fakeTracePath, canonical({ ...dispatch, recordType: 'platform-exported-trace' }), { flag: 'wx' });
    await assert.rejects(bindReviewerEvidence({ packetId, reviewBodyPath: bodyPath, dispatchTracePath: fakeTracePath, completionTracePath: completionPath, outputPath: join(scratch, 'fake-envelope.json') }), /parent-transcribed/);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

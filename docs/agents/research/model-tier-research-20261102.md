# Model tiers for read-only research and exploration: fixture preparation

**Status: protocol preparation only. No model calls or performance results are
reported.** Tickets #167 and #168 hold the shared native measurement lease first.
This file freezes the #169 tasks so an independent reviewer can approve the
inputs and scoring before measurement begins.

## Frozen source packet

Three small tasks use the same eight source files: identify every caller of an
exported function, summarize a policy module, and answer a documentation question
with a citation. The packet includes alias and dynamic imports, a similarly named
non-caller, distinct policy rules, and a short source heading. These are synthetic
fixtures; no repository code or external research answer is exposed as a result.

Task definitions and exact prompts are in
[`scripts/fixtures/model-research/t169/tasks.json`](../../../scripts/fixtures/model-research/t169/tasks.json);
the shared input bytes are in
[`scripts/fixtures/model-research/t169/source-files.json`](../../../scripts/fixtures/model-research/t169/source-files.json).
The held-out answer key stays private at `.scratch/t169/answer-key.json`; its
path and SHA-256 go in the evidence receipt, not in the model prompt. Each model
session receives one task and identical source text, in a fresh context. The key
never reaches the runner or target models until grading.

Frozen artifact SHA-256 values: source packet
`a43525e265ddc6d7cc832cbee0ca9b0ed4a6090a614a0dbb747eb24bc4be572c`, task/prompt
manifest `2872f907bc1616af68ef081933394a2873b97fab8e4bcdd4a3cfff9ebd105f653`,
private answer key `429bf76172338d0f52963d3ac2c14fba3f701defae42e444997a1096c04efae`.
The private protocol packet is
`eca3fe77ff8f357128a752db46b65f7b69989c7b3f889fc4d0f2d6df329901c7`.

## Scoring, fixed before calls

- Caller discovery: exact path precision and recall. Report missing and invented
  callers separately. Pass only all three expected paths and no invented paths.
  File mentions without a call do not count.
- Module summary: check five discrete facts; pass at least four and make no
  unsupported material claims.
- Cited answer: pass only if semantically correct and cited to the supporting
  heading. A wrong or unsupported citation fails even if the prose is readable.

A profile meets this fixture bar only if it passes all three one-shot tasks.
Otherwise the recommendation is “keep default.” With one attempt per cell, these
results are directional and do not establish population reliability.

Freeze these rubrics with the packet. The independent grader receives response
text and the private key only after the model session ends; the target sees no
tier label or key. Do not score the producer's judgment as evidence.

## Candidate profiles and controls

The current project snapshot records Anthropic's `haiku` alias, OpenAI
`gpt-6-luna`, Kiro `qwen3-coder-next`, and Antigravity `gemini-3.8-flash`
as low-cost candidates; each must be matched to the retained read-only catalog
and invocation evidence before any calls. The comparison profile uses each
harness's native default by omitting both model and effort overrides. If the
served identity is absent, report it as unknown and do not claim an identity-
specific comparison. The Google candidate is the currently listed medium Flash
variant; two same-host inventories three minutes apart disagree on its effort
suffix (`medium` versus `low`), so Google calls are specifically blocked until
the critic resolves that catalog conflict. The configured native default is
not known, so a comparison remains unverified unless output names the served
model. The #168 list hash is `697b857ddb101c351a5a773ba51b8637d1161ae2b97227756e496fcbf3febff4`;
the later #167 list hash is `00f1c26360e3dbbf92d47e27bf0a1a5f55d00d2a7375175478252a0c9b6084eb`.

Ticket-local plan: three tasks × two profiles = six sessions per provider, one
attempt per cell, at most 120 seconds per session. Claude's native list estimate
cap is USD 0.10 per call and USD 0.60 total. Other providers have no verified
dollar conversion in this preparation; report native usage and unknown cost.
Stop a provider at its first native limit/reset, record the affected cells and
reset signal, and do not retry or move to another provider. Do not use a
quota-check command that consumes a turn.

Native effort may differ between a cheap candidate and a provider's default.
Record the requested command profile and any observed model/effort separately.
Interpret the results as an invocation-profile comparison; do not attribute a
difference to model identity alone when effort also changed. An alias rejection
is a failed/unavailable cell with no retry or substitute.

## Invocation review and evidence

Each adapter's exact executable, version, argv, prompt transport, disabled-tool
or read-only control, output parser, timeout, and native usage fields must be
bound to the current retained catalog/help receipt before the critic approves
calls. This is an explicit preflight condition, not a result of this preparation
note. Provider protocol details may differ; do not assume one runner's flags
apply to another. A completed receipt should bind input, task, prompt, key hash,
grader version, protocol version, executable/version, requested and observed
profile, raw response hash, classification, elapsed time, and native usage.
Private model reasoning is not promoted.

Until the parent releases the serial-measurement lease and the critic accepts the
exact protocol/evidence hashes, the experiment remains on hold.

---
id: "90"
title: "Build the dashboard copy and results critics, and wire them into the workflow"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Both critics catch at least 8 of 10 seeded defects and return CLEAN on the worked example"
  - "delivery-dashboard step 5, wrap-session and orient use the critics and the open asks"
tags: ["stream:tooling", "type:enhancement"]
---

# Build the dashboard copy and results critics, and wire them into the workflow

## What to build

Implement [proposal 13](../docs/agents/proposals/13-dashboard-critics.md) in its rollout order: the
copy critic and the results critic as `delivery-dashboard` references (drafts are in the proposal),
seeded-defect fixtures that measure their catch rate against the
[worked example](../skills/productivity/delivery-dashboard/assets/dashboard-example.html), then
dispatch from `delivery-dashboard` step 5, `wrap-session` updating the dashboard and `orient`
surfacing open asks, then a `conformance-audit` check. Promote the copy critic to a skill only when
a second consumer needs it. Decide the open questions in the proposal (manual path where subagents are missing, critic
record on the page) and the owner's model choices (Fable or Opus on Claude, Astra or Sol on OpenAI,
cross-family option) before wiring the dispatch. Evidence: [critic-model-selection](../docs/agents/research/critic-model-selection-20261027.md).

## Acceptance criteria

- [ ] Both critics catch at least 8 of 10 seeded defects and return CLEAN on the worked example, with the catch rate recorded here.
- [ ] Before wiring, the adoption criterion is set in advance: the critics are adopted into `delivery-dashboard` step 6 (Check, open and hand back) only if their seeded-defect catch beats the author's own checklist pass on the same seeds; the comparison is recorded here.
- [ ] If adopted, step 6 runs the critics read-only in a fresh context when an entry claims shipped or live work or the owner asks, not on every entry by default; a critic that can't read its input returns UNABLE TO REVIEW (ticket 92 item 3).
- [ ] `wrap-session` updates a recorded dashboard and `orient` surfaces its open asks.
- [ ] `conformance-audit` reports checker errors as safe-tier and critic findings as judgment-tier.
- [ ] The critic model table is in `docs/agents/harnesses.md` with its verification date and official sources, and every critic result records the model and effort it ran on (after the owner decides the Claude and OpenAI preference lists in proposal 13).
- [ ] `node scripts/check-repo.mjs` passes.

## Scope change (2026-10-29, ticket 101)

The workflow-guidance review (recommendations 6 and 9) found that extra reviewers and QA
added no distinct faults in several small screens, while qualified checks did catch real
gaps. So the critics must earn their place: they are qualified first (positive control on
the worked example, negative controls from seeded defects, unable-to-review kept apart from
CLEAN) and adopted only against an advance criterion. The "loop until no findings on every
entry" default is replaced by conditional dispatch. Step numbers follow the skill after
ticket 100 (check is now step 6).

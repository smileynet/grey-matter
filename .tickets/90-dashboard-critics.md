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
a second consumer needs it. Decide the open questions in the proposal (model family, manual path
where subagents are missing, critic record on the page) before wiring the dispatch.

## Acceptance criteria

- [ ] Both critics catch at least 8 of 10 seeded defects and return CLEAN on the worked example, with the catch rate recorded here.
- [ ] `delivery-dashboard` step 5 dispatches both critics read-only in a fresh context and loops until no actionable findings remain.
- [ ] `wrap-session` updates a recorded dashboard and `orient` surfaces its open asks.
- [ ] `conformance-audit` reports checker errors as safe-tier and critic findings as judgment-tier.
- [ ] `node scripts/check-repo.mjs` passes.

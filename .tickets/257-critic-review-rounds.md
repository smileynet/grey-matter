---
id: "257"
title: "Adopt four-round critic reassessment"
status: done
blocked_by: []
validation_criteria:
  - "Shared convergence guidance and critic entry points implement proposal 21"
  - "Applicable repository gates pass and updated skills deploy"
tags: ["stream:tooling"]
assignee: "codex"
---
## Intent

Adopt [proposal 21](../docs/agents/proposals/21-critic-rounds.md) for workflows that use iterative critic review.

## Acceptance criteria

- [x] One shared reference defines four rounds by default, explicit overrides, and how rounds are counted.
- [x] At the fourth round, assess progress and distinguish material findings from minor polish. Give each branch an actionable next step.
- [x] Critic workflows point to the shared rule, replacing orchestration's overlapping numeric thresholds while preserving consequential escalation.

## Resolution (2026-11-05)

Adopted proposal 21. Review one candidate per round and reassess progress and materiality at the specified budget. Removed overlapping orchestration thresholds and preserved consequential escalation.

### Verification
1. ✓ Shared convergence guidance and critic entry points implement proposal 21 — "ac114ca centralizes the four-round budget, materiality and continue/finish/escalate branches in convergence.md; four critic entry points refer to it."
2. ✓ Applicable repository gates pass and updated skills deploy — "Pre-merge selected 2 checks, both passed. Pre-push selected 5, all passed. Docs consistency passed for 50 skills. Deploy completed with 50 skills installed."

---
id: "257"
title: "Adopt four-round critic reassessment"
status: open
blocked_by: []
validation_criteria:
  - "Shared convergence guidance and critic entry points implement proposal 21"
  - "Applicable repository gates pass and updated skills deploy"
tags: ["stream:tooling"]
---
## Intent

Adopt [proposal 21](../docs/agents/proposals/21-critic-rounds.md) for workflows that use iterative critic review.

## Acceptance criteria

- [ ] One shared reference defines four rounds by default, explicit overrides, and how rounds are counted.
- [ ] At the fourth round, assess progress and distinguish material findings from minor polish. Give each branch an actionable next step.
- [ ] Critic workflows point to the shared rule, replacing orchestration's overlapping numeric thresholds while preserving consequential escalation.
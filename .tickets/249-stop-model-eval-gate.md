---
id: "249"
title: "Stop gating maintenance on completed model-evaluation experiments"
status: open
blocked_by: []
validation_criteria:
  - "The historical model-evaluation fixture suite is not selected by routine or release gates and coverage checking explains its on-demand status."
  - "Maintained orchestration safety tests remain gated; historical runner and reproduction evidence remain intact."
tags: ["stream:tooling", "type:chore"]
---
## What to build

User asked to review all test requirements after identifying a temporary spike promoted to a permanent obligation. Ticket209 explicitly left model-eval-fixtures retirement unresolved. Its native consumers were completed model-tier experiments167-172; the remaining t167 importer depends on ephemeral spike inputs. Remove the mandatory model-eval-fixtures gate and its stale coupling to spike-orchestrate-fixture.mjs. Classify the retained historical suite as on-demand in gates.json and current operator guidance. Preserve archived code/research for deliberate reruns; do not remove the maintained fixture generator or its sandbox safety tests.

Sources: scripts/gates.json, skills/engineering/orchestrate/references/tool-scripts.md, .tickets/209-decommission-model-tier-spikes.md. This removes the test obligation, not historical evidence or product regression protection.

## Acceptance criteria

- [ ] Normal stage selection has no historical model-evaluation obligation.
- [ ] Gate coverage and current docs agree; retained utility safety checks are unchanged.

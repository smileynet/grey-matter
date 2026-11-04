---
id: "249"
title: "Stop gating maintenance on completed model-evaluation experiments"
status: done
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

- [x] Normal stage selection has no historical model-evaluation obligation.
- [x] Gate coverage and current docs agree; retained utility safety checks are unchanged.

## Resolution (2026-11-04)

done: removed historical model-eval-fixtures from mandatory maintenance/release selection and classified the retained experiment suite as on-demand only. Preserved historical source/evidence, the orchestration generator safety gate and maintained offline critic fixtures. Ticket215 retired as obsolete rather than pretending its Windows spike bug was fixed. Review artifacts retained until next successful sync.

### Verification
1. ✓ The historical model-evaluation fixture suite is not selected by routine or release gates and coverage checking explains its on-demand status. — "Gate manifest has no model-eval-fixtures check and explicitly records scripts/spike-model-eval.test.mjs under not_gated. Gate coverage45 gated/4 explained manual suites passed."
2. ✓ Maintained orchestration safety tests remain gated; historical runner and reproduction evidence remain intact. — "Manifest inspection confirms orchestrate-spike-fixture and critic-model-probe offline fixture gates remain. Historical runner, t167 importer and research files unchanged. Gate/syntax regression suite32 passed1 explicit skip; doc links and syntax passed; no live model or native platform experiment executed."

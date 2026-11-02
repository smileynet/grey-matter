---
id: "117"
title: "Declare retrospective coverage and distinguish repairs from remaining work"
status: done
blocked_by: []
validation_criteria:
  - "A sampled/truncated trace scenario produces explicit partial coverage with inspected scope and unresolved gaps."
  - "A report with inspected tests but no execution cannot claim fresh test success; repaired defects with existing regressions are not filed as new implementation work."
  - "Focused reread and retained coverage limits are both supported without requiring an exhaustive trace audit."
  - "Applicable guidance scenarios and `node scripts/gate.mjs pre-merge` pass."
tags: ["stream:test-verification"]
priority: medium
---

# Declare retrospective coverage and distinguish repairs from remaining work


## Intent

Sam requested this shared follow-up after a fresh-context retrospective selectively inspected 180 messages/error outputs from a 35.9 MB session trace. The report correctly declared partial primary-trace coverage; that reporting practice should be explicit in the owning skill.

## What to build

Update `skills/engineering/retro/SKILL.md` or its existing report reference to state the inspected corpus, sampling/extraction limits, trace/file references and unverified areas. Bounded reads are desirable, but a truncated tool result requires a focused reread or an explicit remaining gap. Never infer completeness from a nonempty subagent report.

Separate observed defect, corrected verification gap, already-landed regression and remaining recommendation. Distinguish source inspection from freshly executed checks. Route remaining work to existing owners instead of duplicating tickets or adding a broad AGENTS rule. Use one compact coverage statement rather than a mandatory new report format. #119 owns evidence execution/reuse semantics; #118 owns bounded dashboard inspection guidance.

Do not require replaying the entire trace or redispatching facts already in context. The actual audit's coverage limit is historical fact, not a blanket defect in the final deployment proof.

## Acceptance criteria

- [x] A sampled/truncated trace scenario produces explicit partial coverage with inspected scope and unresolved gaps.
- [x] A report with inspected tests but no execution cannot claim fresh test success; repaired defects with existing regressions are not filed as new implementation work.
- [x] Focused reread and retained coverage limits are both supported without requiring an exhaustive trace audit.
- [x] Applicable guidance scenarios and `node scripts/gate.mjs pre-merge` pass.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: add compact coverage limits to the existing retro owner and review sampled/truncated traces
and inspection-only test claims. Preserve already-repaired defects as repaired; route genuinely
remaining work to existing owners. #119's execution/reuse guidance is shipped.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

Worker commits a07218a and 98c6ac5 updated the existing retro owner. The critic found a missing explicit trace/file locator requirement; the worker fixed it, and renewed review confirmed the finding resolved with no other blocker. Manual sampled/truncated, inspection-only and already-repaired scenarios were reviewed without replaying a source trace or claiming fresh historical execution. Worker forced fixtures passed 2/2 only after replacing missing dependency availability with an ignored junction to existing root dependencies; the earlier missing-yaml infrastructure error and zero-selection default run are not counted as passes. Root merged and forced main pre-merge 4/4 commands (ticket-graph 0.4 s, syntax fixtures 0.3 s, guidance 1.1 s, static fixtures 4.6 s); pre-push 5/5 selected checks passed.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

## Resolution (2026-11-02)

done: worker a07218a/98c6ac5, critic feedback fixed and accepted, root merged/pushed/verified/deployed; ticket and dashboard record delivery. Retain owned t117-worker about10.3MB and dependency junction only through final stream audit/cleanup: automatic approval review rejected combined junction-removal/worktree cleanup as blocked by policy, so no alternate removal attempted. Shared stream helpers retained until completion, deployment until next deploy. Dashboard visual acceptance remains pending; source checks only.

### Verification
1. ✓ A sampled/truncated trace scenario produces explicit partial coverage with inspected scope and unresolved gaps. — "Compact retro coverage statement names corpus, trace/file reference when available, inspected scope, sampling/extraction, truncation and unresolved gaps; missing locators remain explicit gaps. Worker fixed critic's sole omission in98c6ac5; renewed critic review accepted."
2. ✓ A report with inspected tests but no execution cannot claim fresh test success; repaired defects with existing regressions are not filed as new implementation work. — "Manual scenarios separate inspected tests from fresh runs and classify observed defect, repaired verification gap, already-landed repair and remaining recommendation; existing regressions do not become duplicate implementation tickets."
3. ✓ Focused reread and retained coverage limits are both supported without requiring an exhaustive trace audit. — "Focused reread OR retained coverage gap supported; no exhaustive replay or completeness from nonempty subagent result. Existing retro owner and ticket owners reused."
4. ✓ Applicable guidance scenarios and `node scripts/gate.mjs pre-merge` pass. — "Root after merge premerge4/4 and prepush5/5 passed; canonical deploy check/default50skills passed. Worker forced2/2 only after dependency-junction fix; original infrastructure failure and zero-selected default run not relabeled as pass. No historical trace audit claimed."

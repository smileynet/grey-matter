---
id: "112"
title: "Plan UI checks against available capabilities and preserve evidence boundaries"
status: in_progress
blocked_by: []
validation_criteria:
  - "Applicable UI workflows establish permitted capabilities before selecting checks and record unavailable checks without substituting unobserved success."
  - "Receipt guidance binds evidence to artifact identity and distinguishes tool observation, human report and unvalidated learning."
  - "Fixtures cover a blocked protocol, unavailable telemetry and human functionality report; repository guidance checks pass."
tags: ["stream:test-verification"]
priority: medium
---

# Plan UI checks against available capabilities and preserve evidence boundaries

## What to build

Intent: Learning Library ticket 13 retrospective and the user's 31 October 2026 request to file reusable recommendations. Direct-file browser navigation was rejected; resource timing was unavailable; a separate human functionality confirmation resolved the file-opening check. Learning effectiveness stayed unvalidated.

Read skills/engineering/prototype/SKILL.md, skills/productivity/delivery-dashboard/SKILL.md and docs/agents/report-format.md. Video-guide is owned separately by Video Buddy ticket 46; do not create a duplicate skill here. Add conditional guidance to establish permitted surfaces/capabilities before promising UI checks. Use compact artifact-bound receipts with observer, surface, scenario, outcome and limits. Preserve blocked actions as blocked; no workaround instruction. Separate source/metadata checks, rendered behavior, human reports and learning outcomes. Reuse report conventions rather than a new mandatory framework.

## Acceptance criteria

- [ ] Applicable UI workflows establish permitted capabilities before selecting checks and record unavailable checks without substituting unobserved success.
- [ ] Receipt guidance binds evidence to artifact identity and distinguishes tool observation, human report and unvalidated learning.
- [ ] Fixtures cover a blocked protocol, unavailable telemetry and human functionality report; repository guidance checks pass.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: review blocked protocol, absent telemetry and human-report cases in existing UI/report
workflows. #119 now defines environment limits and #105 oracle controls; preserve the distinct tool
observation, human report and unvalidated learning claims. No new video-guide implementation belongs
here.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

Worker commit 888bcb9 updated prototype UI guidance, dashboard preflight and receipt notes. Critic Spec/Standards review found no blocking issue. Worker receipt tests passed 13/13; the three new prose scenarios were manually reviewed, not represented as automated policy tests. Root pre-merge completed 5/5 commands after merge: ticket-graph 0.3 s, syntax fixtures 0.3 s, guidance 1.1 s, dashboard-contract 1.5 s, review-receipt 0.5 s. Main pre-push completed 5/5 selected commands. Root observed an actual browser policy refusal and preserved it as blocked with no alternate route; missing telemetry/human-report cases remain bounded examples. The newly created dashboard's visual acceptance is pending, not a completed UI observation.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

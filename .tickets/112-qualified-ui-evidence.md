---
id: "112"
title: "Plan UI checks against available capabilities and preserve evidence boundaries"
status: open
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

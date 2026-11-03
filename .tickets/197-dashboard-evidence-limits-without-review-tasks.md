---
id: "197"
title: "Keep dashboard evidence limits separate from unsolicited user review tasks"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Routine dashboard updates record unavailable rendering as an evidence limitation without creating an unsolicited user review task"
  - "Explicit required UI acceptance remains pending when its needed evidence is missing"
  - "Reviewed scenarios preserve answered feedback preferences and distinguish routine metadata updates from actual UI acceptance"
tags: ["stream:tooling", "type:chore"]
---

# Keep dashboard evidence limits separate from unsolicited user review tasks

## Intent source

User requested on 2026-11-02: file tickets and address the current session retrospective findings.
See [delivery and wrap evidence](../docs/agents/research/test-verification-delivery-20261102.md).
This is prevention work; native parser/fixture and ephemeral-citation repairs are already landed.

## What to build

Preserve the already-landed no-solicitation rule in 4ff0c84. Clarify the adjacent verification/receipt guidance so an unavailable visual check is not automatically a task for the owner. Routine metadata updates with unchanged renderer and explicit feedback-during-use preferences do not gain a new approval gate. Actual explicitly required UI acceptance must remain unresolved when missing. Review meaningful scenarios; do not invent a language-pattern linter or claim rendered validation.

## Context

Read skills/productivity/delivery-dashboard/SKILL.md and references/review-receipt.md, current local-gates guidance and the originating session findings.
Related open work #149/#146/#164 retains its broader original scope and is not closed by this task.

## Acceptance criteria

- [x] Routine dashboard updates record unavailable rendering as an evidence limitation without creating an unsolicited user review task.
- [x] Explicit required UI acceptance remains pending when its needed evidence is missing.
- [x] Reviewed scenarios preserve answered feedback preferences and distinguish routine metadata updates from actual UI acceptance.

## Verification

Independent critic review of the guidance and scenario outcomes; syntax fixtures and required repository gates.
No live consumer, provider, device or rendered dashboard result is claimed by this guidance change.

## Implementation and evidence — 2026-11-02

Source `6bb7283` implements this scoped guidance change. Independent critic Spec and
Standards review accepted it without findings. Scenario evidence is recorded below as manual
review, not automated agent-compliance proof. `node --test scripts/skill-syntax.test.mjs`
passed 10/10, no skips. Docs consistency passed for 50 skills. Root pre-merge with syntax
fixtures and agent-guidance explicitly included passed 3/3 (0.3/1.1/1.9 s; dashboard-contract
selected by scope). The push hook passed 5/5. `node scripts/deploy.mjs check` and default
deployment passed, installing 50 skills; the optional logo notice is informational.
No global policy, adopter runtime, provider, device or rendered-dashboard state changed.
Temporary ticket helpers/indexes are recycled after closure/publication; the current
deployment package is retained until the next deployment. Prior platform evidence keeps its
separate documented lifecycle. Broader #149/#146/#164 remain open.

## Resolution (2026-11-03)

done: accepted retro prevention guidance implemented in its existing owner, independently reviewed, verified, pushed and deployed. Manual scenario review is distinguished from runtime evidence; no duplicate repair ticket or new approval gate.

### Verification
1. ✓ Routine dashboard updates record unavailable rendering as an evidence limitation without creating an unsolicited user review task — "Dashboard guidance preserves existing 4ff0c84 no-solicitation rule and distinguishes routine status/content refresh from new owner-review gates. Unavailable checks are limits in details, not unsolicited asks."
2. ✓ Explicit required UI acceptance remains pending when its needed evidence is missing — "Receipt guidance retains explicitly required project/ticket UI acceptance as pending when captures or critic evidence are unavailable; no fabricated receipt or human report substituted for tool observation."
3. ✓ Reviewed scenarios preserve answered feedback preferences and distinguish routine metadata updates from actual UI acceptance — "Manual scenarios reviewed: unchanged renderer with blocked browser and feedback-during-use preference; explicitly required phone capture missing; answered ask after entry regeneration. Critic accepted all; no rendered review or browser workaround was run."

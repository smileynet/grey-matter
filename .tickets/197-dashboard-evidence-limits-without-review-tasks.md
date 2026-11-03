---
id: "197"
title: "Keep dashboard evidence limits separate from unsolicited user review tasks"
status: in_progress
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

- [ ] Routine dashboard updates record unavailable rendering as an evidence limitation without creating an unsolicited user review task.
- [ ] Explicit required UI acceptance remains pending when its needed evidence is missing.
- [ ] Reviewed scenarios preserve answered feedback preferences and distinguish routine metadata updates from actual UI acceptance.

## Verification

Independent critic review of the guidance and scenario outcomes; syntax fixtures and required repository gates.
No live consumer, provider, device or rendered dashboard result is claimed by this guidance change.

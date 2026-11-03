---
id: "196"
title: "Reconcile original outcomes before treating residual tickets as delivery blockers"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Reconciliation compares original outcomes and acceptance with observed delivered behavior before counting remaining tickets"
  - "Independent follow-ups retain their acceptance criteria and activation conditions without becoming false blockers"
  - "Reviewed examples distinguish a true unmet acceptance criterion from an independent deferred follow-up"
tags: ["stream:tooling", "type:chore"]
---

# Reconcile original outcomes before treating residual tickets as delivery blockers

## Intent source

User requested on 2026-11-02: file tickets and address the current session retrospective findings.
See [delivery and wrap evidence](../docs/agents/research/test-verification-delivery-20261102.md).
This is prevention work; native parser/fixture and ephemeral-citation repairs are already landed.

## What to build

Put outcome-first closeout in the existing reconciliation owner. State delivered behavior, unmet required acceptance, and independent follow-ups separately. Preserve explicit owner decisions, real dependencies and unresolved evidence. A blanket all-tickets-done requirement must not keep a delivered core open; conversely do not relabel required acceptance as a tail to force closure. No new scoring tool or board schema.

## Context

Read skills/meta/reconcile-tickets/SKILL.md, current local-gates guidance and the originating session findings.
Related open work #149/#146/#164 retains its broader original scope and is not closed by this task.

## Acceptance criteria

- [ ] Reconciliation compares original outcomes and acceptance with observed delivered behavior before counting remaining tickets.
- [ ] Independent follow-ups retain their acceptance criteria and activation conditions without becoming false blockers.
- [ ] Reviewed examples distinguish a true unmet acceptance criterion from an independent deferred follow-up.

## Verification

Independent critic review of the guidance and scenario outcomes; syntax fixtures and required repository gates.
No live consumer, provider, device or rendered dashboard result is claimed by this guidance change.

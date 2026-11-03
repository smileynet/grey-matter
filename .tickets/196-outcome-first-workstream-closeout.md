---
id: "196"
title: "Reconcile original outcomes before treating residual tickets as delivery blockers"
status: done
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

- [x] Reconciliation compares original outcomes and acceptance with observed delivered behavior before counting remaining tickets.
- [x] Independent follow-ups retain their acceptance criteria and activation conditions without becoming false blockers.
- [x] Reviewed examples distinguish a true unmet acceptance criterion from an independent deferred follow-up.

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
1. ✓ Reconciliation compares original outcomes and acceptance with observed delivered behavior before counting remaining tickets — "Reconcile owner compares original requested outcome and required acceptance against observed behavior before interpreting ticket counts. Critic Spec and Standards review accepted source 6bb7283."
2. ✓ Independent follow-ups retain their acceptance criteria and activation conditions without becoming false blockers — "Independent follow-ups preserve their own criteria, status and activation conditions; required unmet or unverified acceptance cannot be relabeled, weakened or closed merely to clear the frontier."
3. ✓ Reviewed examples distinguish a true unmet acceptance criterion from an independent deferred follow-up — "Manual scenarios reviewed: original required evidence missing remains unresolved; evidenced core with optional later Mac check is delivered with independent follow-up; genuine prerequisite still blocks. These are guidance scenario reviews, not runtime agent-compliance tests."

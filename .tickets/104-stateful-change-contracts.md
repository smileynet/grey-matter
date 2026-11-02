---
id: "104"
title: "Acceptance for stateful changes names ownership and terminal behavior"
status: done
blocked_by: []
validation_criteria:
  - "`to-spec` and `to-tickets` ask stateful work for ownership and terminal-behavior criteria"
  - "`tdd` says to assert final state, counts and error identity at the public seam for stateful changes"
  - "`node scripts/gate.mjs pre-merge` passes"
priority: medium
tags: ["kind:enhancement","stream:test-verification"]
---

# Acceptance for stateful changes names ownership and terminal behavior

## What to build

Intent: recommendation 4 (high confidence for stateful and resource changes). Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main).
The Caddy repairs hinged on who may close, retry or replace a body; Query needed separate
public-type checks because runtime tests can't see erased exports.

In `to-spec`, `to-tickets` and `tdd`: when a change is stateful or owns a resource,
acceptance criteria name who may read, close, replace, retry, cancel or retain it, and the
tests assert counts, error identity and final state at the real public seam, not only a
private helper. Keep it conditional; reversible edits don't need an integration campaign.

## Acceptance criteria

- [x] `to-spec` and `to-tickets` ask stateful work for ownership and terminal-behavior criteria
- [x] `tdd` says to assert final state, counts and error identity at the public seam for stateful changes
- [x] `node scripts/gate.mjs pre-merge` passes

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: add conditional ownership/terminal-state criteria to to-spec, to-tickets and TDD. Reuse the
shipped #105 oracle procedure and #119 environment ladder; do not reopen their completed scope. The
historical source commit was unavailable locally during #105; this brief remains self-contained.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

Worker commit ee118e6 implemented only to-spec, to-tickets and TDD guidance. Critic independently reviewed Spec and Standards and found no blocking issue. Root merged it and forced the main pre-merge checks: ticket-graph 0.4 s, syntax fixtures 0.3 s, guidance 1.0 s (3/3 commands). Main pre-push completed 5/5 selected commands. Worker direct syntax fixtures passed 10/10 and docs consistency passed. Its snapshot-only missing-yaml infrastructure error was resolved by the main-checkout runs, not called a product failure. Conditional ownership actions, relevant counts/error identity and final state were reviewed at the real public seam; no device test was claimed.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

## Resolution (2026-11-02)

done: worker implemented, critic accepted, root merged/pushed/deployed. Evidence and dashboard path recorded in ticket. Recycled clean merged worker104 worktree10250077bytes; shared orchestration helpers retained only while this stream is active, deployment package until next deploy. Dashboard strict/source review passed; rendered laptop/phone acceptance remains explicitly pending under browser policy, not claimed by this guidance ticket.

### Verification
1. ✓ `to-spec` and `to-tickets` ask stateful work for ownership and terminal-behavior criteria — "Worker ee118e6 adds conditional resource ownership and applicable terminal behavior to to-spec/to-tickets; independent critic Spec and Standards review accepted the final diff."
2. ✓ `tdd` says to assert final state, counts and error identity at the public seam for stateful changes — "TDD requires final state, relevant counts and contract error identity at the public seam, reusing the lowest faithful environment; no broad campaign for reversible changes. Worker syntax fixtures10/10, docs consistency50skills pass."
3. ✓ `node scripts/gate.mjs pre-merge` passes — "After root merge, main pre-merge forced3/3 checks (ticketgraph/syntaxfixtures/guidance) and tracked prepush5/5 passed; canonical deploy check/default deployment passed50skills. Worker snapshot missing-yaml infrastructure issue was resolved by root verification."

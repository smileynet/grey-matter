---
id: "104"
title: "Acceptance for stateful changes names ownership and terminal behavior"
status: open
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

- [ ] `to-spec` and `to-tickets` ask stateful work for ownership and terminal-behavior criteria
- [ ] `tdd` says to assert final state, counts and error identity at the public seam for stateful changes
- [ ] `node scripts/gate.mjs pre-merge` passes

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: add conditional ownership/terminal-state criteria to to-spec, to-tickets and TDD. Reuse the
shipped #105 oracle procedure and #119 environment ladder; do not reopen their completed scope. The
historical source commit was unavailable locally during #105; this brief remains self-contained.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

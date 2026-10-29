---
id: "104"
title: "Acceptance for stateful changes names ownership and terminal behavior"
status: open
blocked_by: []
priority: medium
tags: ["kind:enhancement"]
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
- [ ] `node scripts/check-repo.mjs` passes

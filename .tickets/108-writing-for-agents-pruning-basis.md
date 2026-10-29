---
id: "108"
title: "writing-for-agents ties pruning to observed navigation failures"
status: open
blocked_by: []
priority: low
tags: ["kind:enhancement"]
---

# writing-for-agents ties pruning to observed navigation failures

## What to build

Intent: recommendation 11 (moderate). Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main). A shorter entry point showed no
correctness or cost gain in S7, with length, placement and conflict salience changing
together.

`skills/productivity/writing-for-agents/SKILL.md` treats sprawl as attention thinning
across the excess. Reword it so pruning and restructuring answer an observed navigation
problem or a missed instruction, keeping its single-source and relevance rules. Owner
reviews the wording before it lands, because this is a core reference.

## Acceptance criteria

- [ ] The sprawl passage ties restructuring to an observed failure, not an assumed gain
- [ ] Owner approved the wording
- [ ] `node scripts/check-repo.mjs` passes

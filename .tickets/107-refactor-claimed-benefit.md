---
id: "107"
title: "improve-codebase-architecture names the next real change a seam simplifies"
status: open
blocked_by: []
priority: medium
tags: ["kind:enhancement"]
---

# improve-codebase-architecture names the next real change a seam simplifies

## What to build

Intent: recommendation 8 (moderate). Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main). In the Textual and Query studies, prepared
seams showed no payback, which is not proof that deep modules are harmful.

In `improve-codebase-architecture`, each deepening opportunity names the ownership problem
and the next real change it would simplify, and what would show payback. When no
defensible next change exists, the skill recommends keeping the current structure.

## Acceptance criteria

- [ ] Each opportunity the skill reports names the next real change it simplifies
- [ ] The skill says to keep the current structure when no such change exists
- [ ] `node scripts/check-repo.mjs` passes

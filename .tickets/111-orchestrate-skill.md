---
id: "111"
title: "Build the orchestrate skill (proposal 17): conductor over the ticket frontier with reviewer gate and per-harness references"
status: open
blocked_by: []
tags: ["stream:tooling", "type:enhancement"]
---

# Build the orchestrate skill (proposal 17): conductor over the ticket frontier with reviewer gate and per-harness references

## What to build

A user-invoked `skills/engineering/orchestrate/` skill per
[proposal 17](../docs/agents/proposals/17-orchestrator-skill.md): one session acts as orchestrator over
the tkt frontier, admits open/unblocked/disjoint tickets, dispatches workers in worktrees,
gates each on an independent reviewer, merges serially, closes with evidence, answers worker
questions and escalates only by checklist, and posts a dashboard entry with a visual per close.
Role briefs (worker, reviewer, escalation) and per-harness references (Claude Code, Codex,
kiro-cli, Kiro Crew, agy) load on demand.

Evidence: `docs/agents/research/kirocrew-orchestration.md`,
`docs/agents/research/harness-orchestration-primitives.md`. Resolve the proposal's three open
questions with the user first.

## Acceptance criteria

- [ ] Skill with SKILL.md, three role briefs and five harness references; passes writing-for-agents and review-skill.
- [ ] compass, engineering README and orient route to it; `node scripts/check-repo.mjs` and syntax fixtures pass.
- [ ] Ticket 95's placement decision recorded as "harness reference", citing proposal 17.
- [ ] Live dry run in Claude Code over two disjoint low-priority tickets shows claim-before-dispatch, one worktree each, a reviewer verdict before close, one dashboard entry per close, and a worker QUESTION answered without escalation.

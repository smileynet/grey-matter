---
id: "111"
title: "Build the orchestrate skill (proposal 17): conductor over the ticket frontier with reviewer gate and per-harness references"
status: open
blocked_by: ["124", "125", "126", "127", "128", "129"]
tags: ["stream:tooling", "type:enhancement"]
priority: medium
---

# Build the orchestrate skill (proposal 17): conductor over the ticket frontier with reviewer gate and per-harness references

## What to build

A user-invoked `skills/engineering/orchestrate/` skill per
[proposal 17](../docs/agents/proposals/17-orchestrator-skill.md): one session acts as orchestrator over
the tkt frontier, admits open/unblocked/disjoint tickets, dispatches workers in worktrees,
reviews each at risk depth (own spec check, or a reviewer agent if consequential), lands it per the
project's landing mode, closes with evidence, answers worker
questions and escalates only by checklist, and posts a dashboard entry plus a chat update with a
visual per close.
Role briefs (worker, reviewer, escalation) and per-harness references (Claude Code, Codex,
kiro-cli, Kiro Crew, agy) load on demand.

Evidence: `docs/agents/research/kirocrew-orchestration.md`,
`docs/agents/research/harness-orchestration-primitives.md`. The open questions were decided on 2026-10-31 (see the proposal).
Write each harness reference from its spike (124-129).

## Acceptance criteria

- [ ] Skill with SKILL.md, three role briefs and five harness references; passes writing-for-agents and review-skill.
- [ ] compass, engineering README and orient route to it; `node scripts/check-repo.mjs` and syntax fixtures pass.
- [ ] Ticket 95's placement decision recorded as "harness reference", citing proposal 17.
- [ ] Harness references are written from spikes 125-129; any probe that failed names the fallback the loop uses there.
- [ ] A live dry run on the spike fixture in Claude Code and kiro-cli shows: claim before dispatch, one worktree each, a spec check (or a reviewer verdict for consequential changes) before close, one dashboard entry plus a chat update with a visual per close, the landing mode chosen per project, the T2 QUESTION answered without escalation, and only T5 escalated.

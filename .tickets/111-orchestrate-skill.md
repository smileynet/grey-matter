---
id: "111"
title: "Build the orchestrate skill (proposal 17): conductor over the ticket frontier with reviewer gate and per-harness references"
status: done
blocked_by: ["124", "125", "126", "127", "128", "129"]
tags: ["stream:orchestration", "kind:enhancement"]
priority: high
validation_criteria: 
  - "Structure and routing pass syntax, invocation, and documentation checks plus independent Standards and Spec reviews."
  - "Live Claude Code and kiro-cli fixture runs evidence claims, isolated worktrees, review before close, per-ticket dashboard/chat visuals, T2 question handling, contextual landing, and T5-only escalation."
  - "Fresh pre-merge and pre-push gates pass for the shipped change; deployed validator resources and artifact disposition are recorded."
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

- [x] Skill with SKILL.md, three role briefs and five harness references; passes writing-for-agents and review-skill.
- [x] compass, engineering README and orient route to it; `node scripts/gate.mjs pre-merge` and syntax fixtures pass.
- [x] Ticket 95's placement decision recorded as "harness reference", citing proposal 17.
- [x] Harness references are written from spikes 125-129; any probe that failed names the fallback the loop uses there.
- [x] A live dry run on the spike fixture in Claude Code and kiro-cli shows: claim before dispatch, one worktree each, a spec check (or a reviewer verdict for consequential changes) before close, one dashboard entry plus a chat update with a visual per close, the landing mode chosen per project, the T2 QUESTION answered without escalation, and only T5 escalated.

## Field report — 2026-11-01

Implementation: `703a64c`. [Live evidence](../docs/agents/research/orchestrate-skill-dry-runs-20261101.md)
records the two harness runs, independent checks/reviews, deployment and artifact
retention. Kiro required a resumed session and supplemental question probe; exact
status protocol compliance remains partial and is input to ticket 162.

Lessons for orchestrate from planning parallel work in philippines-trip:

- Define worker streams by the files they own (content, screens, accounts) and name the shared files that force ordering (one large Android activity file, a shared home screen).
- The schema owner is the only stream that changes generated content or its format; other streams consume new fields.
- Critic: a fresh agent with the ticket, the diff and the project's critic rubric; two failed rounds, then escalate to the owner.
- One device (simulator) handed to one worker at a time, with the device ID and owner recorded.
- Merge in feature order even when workers finish out of order; rebase open branches after a schema change merges.
- Before merging, look upstream: other sessions may be committing to the same branch.

## Inputs added 2026-11-01

- [Provider switching](../docs/agents/provider-switching.md): read the project's `## Provider fallback` section at orient. Without an opt-in, never move work to another provider when a limit runs out.
- [Models and usage](../docs/agents/harness-surfaces/models-and-usage.md): pick worker and reviewer tiers by task class, and check usage headroom before a fan-out.
- [Harness surfaces](../docs/agents/harness-surfaces/README.md): the headless flags per harness. GUIs are the watch layer (ticket 173).

## Resolution (2026-11-02)

Shipped user-invoked orchestrate skill, three role contracts, five observed harness references and routing rows in 703a64c; recorded #95 harness-reference placement. Live evidence and limitations promoted in fc16e1a. Claude and resumed Kiro core fixture workflows accepted; Kiro status-protocol compliance is partial, with supplemental question-path evidence and follow-up input on #162. Deployed 50 skills. Retained private t111 evidence/support until #162 closes and existing AGY output until next deployment refresh; no peer artifacts deleted.

### Verification
1. ✓ Structure and routing pass syntax, invocation, and documentation checks plus independent Standards and Spec reviews. — "Structure, routing, writing-for-agents/review-skill, and independent Standards/Spec reviews pass for 703a64c; syntax fixtures 10/10. See docs/agents/research/orchestrate-skill-dry-runs-20261101.md (fc16e1a)."
2. ✓ Live Claude Code and kiro-cli fixture runs evidence claims, isolated worktrees, review before close, per-ticket dashboard/chat visuals, T2 question handling, contextual landing, and T5-only escalation. — "Claude and Kiro fixtures each finish T1-T4 with 4/4 tests, four checked dashboard entries plus chat visuals, claims/worktrees/spec review/trunk landing, T5 open and README present. Kiro question transport passed a separate read-only native-subagent probe; full-loop pre-answer and missing DONE statuses remain explicitly partial, carried to #162."
3. ✓ Fresh pre-merge and pre-push gates pass for the shipped change; deployed validator resources and artifact disposition are recorded. — "On fc16e1a: gate.mjs pre-merge with fixed base and syntax-fixture include passed 2 selected checks; pre-push passed doc-links/home-path, earlier skill push passed all 5 selected checks. deploy.mjs installed 50 skills; validator present in bare roots. Private t111 fixtures/logs/support retained below 2 MiB until #162 completes; existing 8.54 MB AGY build retained for shared deployment; no peer artifacts deleted."

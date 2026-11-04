---
id: "225"
title: "Explore an over-engineering convergence check for review-fix loops"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Check whether implement + #152's rule already prevent this in practice: look at 2-3 past multi-round sessions for diff growth."
  - "Define a cheap signal (lines added per round, new files/flags/abstractions per round) and test it on those sessions; does it flag the bad cases without false alarms?"
  - "If adopted: one proportionality rule for code fixes (exception: reachable crash, security hole, data loss), referenced, not restated; the orchestrator is the first decision-maker per escalation.md."
  - "Resolution records adopt/adapt/reject."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent", "epic:outcome-orchestration"]
assignee: "codex"
---

# Explore an over-engineering convergence check for review-fix loops

## Finding

Kiro Crew (prior art) found the review-fix loop's biggest waste was over-engineering: each round adds a mechanism for an edge case, and a 10-line fix grows into a subsystem. They added a retrospective after repeated rounds (stop, revert or simplify, subtracting first), a proportionality check on each fix, and a conductor agent that makes the first call.

grey-matter already has a proportionality rule for gate changes (#152, local-gates.md), and implement says fix only blocking findings. The open question is whether code fixes inside a loop need an explicit growing-vs-converging signal.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [x] Check whether implement + #152's rule already prevent this in practice: look at 2-3 past multi-round sessions for diff growth.
- [x] Define a cheap signal (lines added per round, new files/flags/abstractions per round) and test it on those sessions; does it flag the bad cases without false alarms?
- [x] If adopted: one proportionality rule for code fixes (exception: reachable crash, security hole, data loss), referenced, not restated; the orchestrator is the first decision-maker per escalation.md.
- [x] Resolution records adopt/adapt/reject.

Related: #152, #224, retro skill.

## Accepted orchestration retro amendment (2026-11-04)

Sam approved applying and implementing these retro proposals after #179. Include
qualification/debugging loops alongside review-fix loops. At reassessment,
distinguish new diagnostic information, repaired behavior and repeated preparation
without progress. Replay this session and a legitimately complex repair so useful
reassessment does not become an arbitrary retry cap. The parent's missed-wake
admission lacks an exact independently proved prior-idle/tool-call sequence.
#251 owns initial intervention choice; this ticket owns progress inside a loop.

- [ ] Qualification/debugging examples distinguish diagnostic progress, repaired behavior and preparation churn.
- [ ] Before/after replay includes necessary multi-step repair without prescribing a global retry limit.

## Resolution (2026-11-04)

done: ADAPT convergence guidance for review and qualification/debug loops; reject numeric diff/round thresholds as a qualified gate. Independent offline comparison supports bounded written guidance, not a live behavior or speed improvement claim. Source, case report and independent review promoted in docs/agents/research/retro-amendments-delivery-20261104.md and linked evidence. Parent-owned new raw logs/packets/preparation helpers kept through this batch wrap disposition; promote useful proof before recycling owned scratch. Existing reused-worktree evidence and private171 ancestry remain protected. No model probe/provider switch/global hook added.

### Verification
1. ✓ Check whether implement + #152's rule already prevent this in practice: look at 2-3 past multi-round sessions for diff growth. — "Compared current implement/local-gates guidance and three retained orchestration sequences; source/case report docs/agents/research/retro-intervention-and-convergence-20261104.md and independent full-criteria review evidence/retro-amendments-20261104/225-251-review.md."
2. ✓ Define a cheap signal (lines added per round, new files/flags/abstractions per round) and test it on those sessions; does it flag the bad cases without false alarms? — "Independent offline before/after written-guidance application distinguishes diagnostic progress, repaired behavior and preparation churn. Necessary complex Claude repair is a counterexample to raw size thresholds; no live prompt trial, measured speedup or historical session reexecution is claimed."
3. ✓ If adopted: one proportionality rule for code fixes (exception: reachable crash, security hole, data loss), referenced, not restated; the orchestrator is the first decision-maker per escalation.md. — "One convergence reference linked from retro, implement and orchestrate; first proportionality decision stays with parent/escalation. No numeric growth/round cap, no new validator/global hook; crash/security/data-loss complete-repair boundary preserved."
4. ✓ Resolution records adopt/adapt/reject. — "Research decision ADAPT qualitative reassessment and REJECT a qualified numeric validator. Final reviewed worker5e7d225 integrated51c1c0c; current explicit syntax fixture gate, docs/invocation and actual push checks PASS; deployed50skills. Durable full verification and disposition docs/agents/research/retro-amendments-delivery-20261104.md."

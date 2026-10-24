---
id: "54"
title: "Add spike-options: spike every meaningful option, then review with user to form an integration plan"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "SKILL.md exists at skills/engineering/spike-options/ with a model-invokable description"
  - "Trigger is the combined gate: load-bearing + empirically cheap + uncertainty-dominated (reasoning won't settle it)"
  - "Spikes every meaningful option (no fixed count); each spike is a throwaway prototype stopped when it answers the shared deciding question"
  - "Composes prototype, grilling, report-format.md, domain-modeling, to-tickets by pointer -- restates none of them"
  - "Review via grilling lands a verdict context-pointer (winner/losers/why + spike branch names) + integration ticket(s); ADR only when the three-part gate is met"
  - "improve-codebase-architecture gains a see-also to spike-options for empirical-not-paper choices"
  - "compass and cheat-sheet and the engineering bucket README list spike-options; check-repo.mjs passes"
tags: ["kind:enhancement"]
---

# Add spike-options: spike every meaningful option, then review with user to form an integration plan

## What to build

A new skill `skills/engineering/spike-options/` (`SKILL.md`, model-invokable) that
orchestrates a **spike run**: spike **every meaningful option** (no fixed count) against one
shared **deciding question**, each spike a throwaway `prototype` stopped the instant it
answers that question. Then review the run with the user via `grilling` and land a decision
plus an integration plan.

Design settled in this session's grill:
- **Intent source:** this session's grilling + **`docs/adr/0003-spike-options-and-delivery-dashboard-boundaries.md`** (the Decision + Why).
- **Vocabulary:** `GLOSSARY.md` -> "spike-options terms" (spike homonym, meaningful option, deciding question, verdict) and the `spike` ruling under "Ambiguities resolved".
- **Trigger (combined gate):** load-bearing (hard to reverse) + empirically cheap to spike + uncertainty-dominated (reasoning alone won't pick the winner). Deliberate-invocation intent survives as a usage signal in prose, but the skill is model-invokable.
- **Compose, don't restate:** `prototype` (each spike is a throwaway prototype; reuse its throwaway/capture discipline), `grilling` (review step), `report-format.md` (comparison format: markdown skim vs full-bodied HTML when visuals warrant), `domain-modeling` (the ADR three-part gate), `to-tickets`/`docs/agents/tkt-conventions.md` (verdict pointer + integration tickets).
- **Outcome:** a **verdict** context-pointer on the originating ticket (winner/losers/why + spike branch names) + integration ticket(s); ADR only when the three-part gate is met.
- **Wiring:** add a see-also from `improve-codebase-architecture` (empirical-not-paper choices) to this skill; register in `compass`, `cheat-sheet`, and the engineering bucket README.

Build to the `writing-for-agents` rules. Keep indexes honest in the same change (set-equality lint).

## Acceptance criteria

- [x] SKILL.md exists at skills/engineering/spike-options/ with a model-invokable description
- [x] Trigger is the combined gate: load-bearing + empirically cheap + uncertainty-dominated (reasoning won't settle it)
- [x] Spikes every meaningful option (no fixed count); each spike is a throwaway prototype stopped when it answers the shared deciding question
- [x] Composes prototype, grilling, report-format.md, domain-modeling, to-tickets by pointer -- restates none of them
- [x] Review via grilling lands a verdict context-pointer (winner/losers/why + spike branch names) + integration ticket(s); ADR only when the three-part gate is met
- [x] improve-codebase-architecture gains a see-also to spike-options for empirical-not-paper choices
- [x] compass and cheat-sheet and the engineering bucket README list spike-options; check-repo.mjs passes

## Resolution (2026-10-24)

done: ship model-invoked spike-options, compose existing decision/prototype workflows, wire discovery, retain the skill license, and make deploy tests derive skill counts. One portfolio deploy refreshed supported targets; strict audit exposed the separately tracked Claude active-folder inventory issue 75.

### Verification
1. ✓ SKILL.md exists at skills/engineering/spike-options/ with a model-invokable description — "skills/engineering/spike-options/SKILL.md exists with model-facing Use when description; quick_validate.py reports Skill is valid."
2. ✓ Trigger is the combined gate: load-bearing + empirically cheap + uncertainty-dominated (reasoning won't settle it) — "Step 1 explicitly requires load-bearing, empirically cheap and uncertainty-dominated together; fresh independent review reports CLEAN."
3. ✓ Spikes every meaningful option (no fixed count); each spike is a throwaway prototype stopped when it answers the shared deciding question — "Steps 2-3 enumerate every meaningful option with no fixed count, use one deciding question and stop when answered."
4. ✓ Composes prototype, grilling, report-format.md, domain-modeling, to-tickets by pointer -- restates none of them — "Seven checked links compose prototype, grilling, report-format, domain-modeling, to-tickets and ticket conventions; owners retain their rules."
5. ✓ Review via grilling lands a verdict context-pointer (winner/losers/why + spike branch names) + integration ticket(s); ADR only when the three-part gate is met — "Steps 4-5 require user review, a durable winner/rejections/why/branch-evidence verdict and integration tickets; ADR follows the linked three-part gate."
6. ✓ improve-codebase-architecture gains a see-also to spike-options for empirical-not-paper choices — "improve-codebase-architecture closing pointer names the empirical combined gate and links spike-options."
7. ✓ compass and cheat-sheet and the engineering bucket README list spike-options; check-repo.mjs passes — "Fresh check-repo passes all 12 invariants with 45 skills; bucket README and compass include spike-options; cheat-sheet live-frontmatter traversal includes it. Source commit f8465ae; Claude source-observation audit follow-up is separately tracked by 75."

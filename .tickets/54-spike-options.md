---
id: "54"
title: "Add spike-options: spike every meaningful option, then review with user to form an integration plan"
status: open
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

- [ ] SKILL.md exists at skills/engineering/spike-options/ with a model-invokable description
- [ ] Trigger is the combined gate: load-bearing + empirically cheap + uncertainty-dominated (reasoning won't settle it)
- [ ] Spikes every meaningful option (no fixed count); each spike is a throwaway prototype stopped when it answers the shared deciding question
- [ ] Composes prototype, grilling, report-format.md, domain-modeling, to-tickets by pointer -- restates none of them
- [ ] Review via grilling lands a verdict context-pointer (winner/losers/why + spike branch names) + integration ticket(s); ADR only when the three-part gate is met
- [ ] improve-codebase-architecture gains a see-also to spike-options for empirical-not-paper choices
- [ ] compass and cheat-sheet and the engineering bucket README list spike-options; check-repo.mjs passes

---
id: "51"
title: "Pilot adopt-project (subsume) on decksmith and feed findings back into adopt-project"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "decksmith adopted in one reviewable commit (.memory migrated, AGENTS.md reconciled, board triaged)"
  - "Findings filed as grey-matter tickets or applied to adopt-project"
tags: ["type:research", "stream:migration"]
---

# Pilot adopt-project (subsume) on decksmith and feed findings back into adopt-project

## What to build

Run grey-matter's `adopt-project` (**from this repo**, not the crew-research skill of the same name
still installed globally) against `~/code/decksmith`. decksmith is a "mature bespoke" archetype
(subsume-semantics): its own AGENTS.md (10 KB), `.memory/` (CONTEXT.md, adr/, specs/,
research/), `.tickets/` (73), and its own `skills/` and `steering/`.

**Precondition:** adopt-project requires a clean tree. As of 2026-10-22 decksmith has 107
uncommitted files (+6.5k/-2.9k) and 1 unpushed commit, which looks like an in-flight session.
The owner must land or park that work first.

Feed what breaks or is awkward back into adopt-project (or file tickets) before the machine cutover.

## Acceptance criteria

- [ ] decksmith adopted in one reviewable commit: .memory migrated, AGENTS.md reconciled, board triaged.
- [ ] Findings applied to adopt-project or filed as tickets.

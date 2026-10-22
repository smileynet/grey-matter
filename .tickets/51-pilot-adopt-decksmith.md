---
id: "51"
title: "Pilot adopt-project (subsume) on decksmith and feed findings back into adopt-project"
status: in_progress
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

## Pilot record (2026-10-22)

decksmith adopted (subsume): `519cb08` adoption commit (relocation of 707 refs, GLOSSARY.md
with 9 migrated + 12 code-checked terms, AGENTS.md 10.2 to 5.5 KB, CLAUDE.md, tkt block,
`.references` rehydration index, Git LFS, customer deck untracked, safe fixes S1/S2);
`daf070e` evidence; decksmith tickets 73-82 seeded with plan rows. Verified: full
`mise run conformance` pass before and after, 0 broken links before and after, fresh clone
smudges LFS images, `tkt sync-plan PLAN.md --check` pass.

Findings fed back as [proposal 05](../docs/agents/proposals/05-adopt-project-pilot-revisions.md)
(R1-R9), pending review before they're applied to adopt-project / conformance-audit.

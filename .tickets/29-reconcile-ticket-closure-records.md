---
id: "29"
title: "Make completed ticket records match their delivered and deferred scope"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "tkt validate --strict exits 0 with no unchecked acceptance criteria on done tickets"
  - "Ticket 03's completion record accurately distinguishes completed active-skill review from deferred beta and frozen scope"
  - "Ticket 07's supersession by ticket 14 is recorded without bypassing closure rules"
tags: ["type:chore", "stream:skills-review"]
---

# Make completed ticket records match their delivered and deferred scope

## What to build

The ticket board must represent what was actually completed, what was deliberately split
or deferred, and why completed tickets satisfy the configured closure rules.

## Context

Found during the 2026-10-19 repository review. `tkt validate --brief` reports four
unchecked acceptance criteria on done ticket 07, despite the documented `tkt close
--check-all` rule. Ticket 14 later completes the superseding probe work. Ticket 03 marks
the review of active, beta, and frozen upstream skills complete, while its resolution
defers beta/frozen work to ticket 21 and the review index retains eleven TBD rows.

Read first: `.tickets/03-per-skill-review-walkthrough.md`,
`.tickets/07-verify-harness-frontmatter.md`,
`.tickets/14-spike-harness-behavior-proofs.md`, `.tickets/21-review-beta-frozen-skills.md`,
and `docs/agents/skill-reviews/README.md`.

## Out of scope

Do not perform ticket 21's beta/frozen reviews as part of this record-reconciliation work.

## Acceptance criteria

- [ ] `tkt validate --strict` reports no unchecked acceptance criteria on a done ticket.
- [ ] Ticket 07 records its supersession by ticket 14 through a closure state that the tracker accepts.
- [ ] Ticket 03 accurately scopes its completed work and links the deferred beta/frozen scope to ticket 21.
- [ ] The skill-review index's incomplete rows and their owning ticket agree.

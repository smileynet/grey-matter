---
id: "11"
title: "Revisit triage: make GitHub adapter first-class once dependency work lands"
status: backlog
blocked_by: ["10"]
priority: medium
validation_criteria:
  - "triage's external path uses the tracker-abstraction contract (ticket 10) rather than inline gh scripting, OR a recorded decision that inline gh is sufficient"
  - "If tkt import --github (tkt 86) landed, triage mints the referencing ticket through it instead of a hand-built tkt new"
  - "triage:/kind: tags validated by native tkt label namespaces (tkt 193/198) if landed; interim discipline otherwise noted"
tags: ["type:enhancement", "stream:skills-review"]
---

# Revisit triage: make GitHub adapter first-class once dependency work lands

## What to build

Revisit the `triage` skill once the dependency work it was authored around has landed,
so the GitHub adapter becomes first-class instead of inline `gh` scripting.

`triage` ships today (per the standing build-against-current-state rule) using `gh`
directly to read a GitHub issue/PR, a hand-built `tkt new` to mint the referencing
ticket, and interim tag discipline for `triage:`/`kind:`. That is deliberate interim
wiring. When the dependencies land, tighten it:

- **Ticket 10 (tracker-abstraction):** route triage's external surface through the
  tracker contract rather than hardcoded `gh` calls, so the same skill drives GitHub or
  another surface by binding, not by edit. OR record a decision that inline `gh` is the
  right level for this skill.
- **tkt ticket 86 (`tkt import --github`):** if landed, mint the referencing ticket
  through it (pulling issue/PR body, author, labels) instead of a hand-built `tkt new`.
- **tkt tickets 193/198 (native label namespaces):** validate `triage:*` and `kind:*`
  as single-select namespaces via `tkt validate` instead of by discipline.

Blocked by ticket 10; the tkt-side pieces (86, 193, 198) are tracked in `D:\code\tkt`
and are not grey-matter blockers, so this can start when 10 is done and fold in whichever
tkt features exist by then.

## Acceptance criteria

- [ ] triage's external path uses the tracker-abstraction contract (ticket 10) rather than inline gh scripting, OR a recorded decision that inline gh is sufficient
- [ ] If `tkt import --github` (tkt 86) landed, triage mints the referencing ticket through it instead of a hand-built `tkt new`
- [ ] `triage:`/`kind:` tags validated by native tkt label namespaces (tkt 193/198) if landed; interim discipline otherwise noted

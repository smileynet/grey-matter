---
id: "25"
title: "Consider a session-start orient skill (adapt tkt's tkt-orient as the bookend to reconcile-tickets)"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "A decision recorded: adapt tkt-orient into a grey-matter session-start skill (bookend to reconcile-tickets), or not, with reasoning"
  - "If adapted: the skill reads frontier + in-progress + session context and proposes a next step, drops the docs/plan.md + sync-plan reads (grey-matter is plan-less; the frontier is the plan), and keeps stale-WIP flag-and-offer (never auto-release)"
  - "The handoff overlap is resolved: whether orient absorbs resume-from-handoff or pairs with the existing handoff skill (we have no read-handoff)"
  - "Naming decided (e.g. orient-session) consistent with reconcile-tickets dropping the tkt- prefix; inlined tkt commands kept (per wrap-skills-not-commands), covered by verify-tkt-usage"
tags: ["type:decision", "stream:skills-review"]
---

# Consider a session-start orient skill (adapt tkt's tkt-orient as the bookend to reconcile-tickets)

## What to build

Decide whether to add a **session-start orient skill** to grey-matter, adapted from tkt's
`tkt-orient` (at `D:\code\tkt\skills\tkt-orient`). It is the start-of-session bookend to
`reconcile-tickets` (which we adapted from tkt's `tkt-reconcile`): read the frontier +
in-progress threads + session context, detect stale WIP, apply the ordering rubric, and
**propose** a concrete next step, without reconciling (session-end) or claiming-and-working.

### Why it's a candidate

We already adapted the session-*end* half (`reconcile-tickets`); orient is the session-
*start* twin, the "where were we / what's next / pick up where we left off" pickup, a real
recurring need. Symmetry argues for the pair.

### Adaptation points to resolve (same shape as reconcile-tickets)

- **Plan-less reframe**: tkt-orient reads `docs/plan.md` and `tkt sync-plan --check`
  heavily, but grey-matter is plan-less, **the frontier (`tkt ready`) is the plan**. Drop
  the plan-doc reads; orient against `tkt ready` + `tkt query --status in_progress` +
  session/`handoff` context directly.
- **Stale-WIP handling**: keep the flag-and-offer (classify in_progress as live vs stale
  via recent commits; never auto-release another session's claim, offer `tkt edit <id>
  --status open`).
- **Handoff overlap**: tkt-orient complements a prose `read-handoff` skill we don't have.
  Decide whether orient absorbs "resume from a `handoff` doc" or stays ticket-oriented and
  pairs with our existing `handoff`.
- **Wrap-skills-not-commands**: tkt-orient is a tkt *internal* skill (not deployed), so
  this is an **adapt**, not a wrap. Inlined tkt commands (`ready`, `query`, `validate`,
  `context`) are fine, kept honest by `verify-tkt-usage`.
- **Naming**: likely `orient-session` (or `orient`), consistent with `reconcile-tickets`
  dropping the `tkt-` prefix for a grey-matter-owned adapted skill. Meta bucket,
  user-invoked.

Low priority: a convenience bookend, not blocking. Decide (and author if yes) when the
session-pickup friction is worth it.

## Acceptance criteria

- [ ] A decision recorded: adapt tkt-orient into a grey-matter session-start skill, or not, with reasoning
- [ ] If adapted: reads frontier + in-progress + session context and proposes a next step; drops the `docs/plan.md` + `sync-plan` reads (plan-less); keeps stale-WIP flag-and-offer
- [ ] The handoff overlap is resolved (absorb resume-from-handoff, or pair with `handoff`)
- [ ] Naming decided (e.g. `orient-session`); inlined tkt commands kept, covered by `verify-tkt-usage`

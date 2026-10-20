---
id: "25"
title: "Consider a session-start orient skill (adapt tkt's tkt-orient as the bookend to reconcile-tickets)"
status: done
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

- [x] A decision recorded: adapt tkt-orient into a grey-matter session-start skill, or not, with reasoning
- [x] If adapted: reads frontier + in-progress + session context and proposes a next step; drops the `docs/plan.md` + `sync-plan` reads (plan-less); keeps stale-WIP flag-and-offer
- [x] The handoff overlap is resolved (absorb resume-from-handoff, or pair with `handoff`)
- [x] Naming decided (e.g. `orient-session`); inlined tkt commands kept, covered by `verify-tkt-usage`

## Resolution (2026-10-20)

Decided: adapt tkt-orient into a new grey-matter skill 'orient' (meta, user-invoked) rather than fold into the legacy frontier-work steering. Authored skills/meta/orient/SKILL.md + Codex sidecar, scoped as the session-start twin of compass: reads frontier + in-progress + .scratch/ handoff, flags stale WIP (flag-and-offer, never auto-release), proposes a next step naming a skill/flow. Dropped docs/plan.md + sync-plan (plan-less). Absorbed the handoff read-side (no read-handoff exists). Routing is a fast-path signal table that indexes INTO compass with an explicit call-compass trigger list + a 'does NOT route' boundary, to prevent table overfit. Ordering rubric deferred to reconcile-tickets. Registered in compass, meta README, maintenance-skills, skill-reviews index + review doc; cross-linked reconcile-tickets/retro/handoff. Legacy global frontier-work rule traced to ~/.kiro/steering (user-global, plan-centric, contradicts frontier-is-the-plan); orient supersedes its start-of-session role for this repo; its retirement spun out as ticket 32.

### Verification
1. ✓ A decision recorded: adapt tkt-orient into a grey-matter session-start skill (bookend to reconcile-tickets), or not, with reasoning — "Decision recorded: adapt (not fold), name 'orient', with reasoning in skill-reviews/orient.md and this resolution"
2. ✓ If adapted: the skill reads frontier + in-progress + session context and proposes a next step, drops the docs/plan.md + sync-plan reads (grey-matter is plan-less; the frontier is the plan), and keeps stale-WIP flag-and-offer (never auto-release) — "skills/meta/orient/SKILL.md reads tkt ready + tkt query --status in_progress + .scratch/ handoff, keeps stale-WIP flag-and-offer, drops docs/plan.md + sync-plan; installer dry-run lint passes, tkt validate clean (only pre-existing t07 warning)"
3. ✓ The handoff overlap is resolved: whether orient absorbs resume-from-handoff or pairs with the existing handoff skill (we have no read-handoff) — "Handoff overlap resolved by absorption: orient reads the .scratch/ handoff (no read-handoff skill exists; handoff is write-only); cross-reference added to handoff SKILL.md"
4. ✓ Naming decided (e.g. orient-session) consistent with reconcile-tickets dropping the tkt- prefix; inlined tkt commands kept (per wrap-skills-not-commands), covered by verify-tkt-usage — "Named 'orient' (drops tkt- prefix per reconcile-tickets precedent); inlined tkt commands (context/ready/query/validate/edit/claim) all confirmed live in tkt 0.4.0 via verify-tkt-usage earlier this session"

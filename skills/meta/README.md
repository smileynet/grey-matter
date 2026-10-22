# meta

Skills that build and tend the skill set and the repo itself, not feature work. They are
the toolkit's own upkeep: set up a repo for the other skills, review and adapt a skill,
curate the docs, and route over the whole set.

The map over the whole set is [`compass`](./compass/SKILL.md). This list is kept in sync by
[`curate-docs`](./curate-docs/SKILL.md). See
[`docs/agents/maintenance-skills.md`](../../docs/agents/maintenance-skills.md) for the
strategy behind this bucket.

## User-invoked

- [init-project](./init-project/SKILL.md): the precondition, configure a repo's tkt tracker, triage tags, and doc layout for the other skills.
- [review-skill](./review-skill/SKILL.md): review an upstream skill and decide keep/adapt/drop/new when adapting it in.
- [curate-docs](./curate-docs/SKILL.md): promote mature notes into skills, move docs into a skill's `references/`, prune stale docs.
- [conformance-audit](./conformance-audit/SKILL.md): audit a repo's skills/scripts/agent-guidance/docs against current grey-matter standards and apply the mechanically-safe fixes (gated).
- [cheat-sheet](./cheat-sheet/SKILL.md): list every skill by category with a one-line description (the quick reference card).
- [orient](./orient/SKILL.md): session-start pickup, read the frontier + WIP + handoff and propose the next step and skill (pairs with reconcile-tickets).
- [changelog](./changelog/SKILL.md): maintain `CHANGELOG.md` with user-facing entries.
- [readme](./readme/SKILL.md): keep `README.md` honest and current.
- [release](./release/SKILL.md): cut a tagged release (orchestrates changelog + readme + version + tag/publish).
- [reconcile-tickets](./reconcile-tickets/SKILL.md): end-of-session ticket-board hygiene pass (wraps the `tkt-core` skill; pairs with retro).
- [wrap-session](./wrap-session/SKILL.md): end-of-session closing bookend, runs reconcile-tickets then retro then lands the cheap mechanical findings (pairs with orient).
- [verify-tkt-usage](./verify-tkt-usage/SKILL.md): validate the skills' inlined tkt commands against the live `tkt capabilities` manifest.
- [sync](./sync/SKILL.md): pull current and re-synchronize the coupled pieces (deployed skills, tkt command surface, ticket IDs, repo invariants), then redeploy to the harnesses (the inbound twin of release; report-don't-gate).

## Model-invoked

- [compass](./compass/SKILL.md): the router/index over the whole set, for a human choosing a tool or an agent unsure which to reach for.

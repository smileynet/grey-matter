# domain-modeling

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (keep the DDD core, scope it to app/backend, strict ADRs, spin
  out a game sibling).

## What it is

The active discipline of building a project's domain model: challenge terms against
`GLOSSARY.md`, sharpen overloaded words to one canonical term (+ an "avoid" list),
stress-test with edge-case scenarios, cross-check against the code, update the
glossary inline (implementation-free, "define what it IS"), and offer an ADR only
when hard-to-reverse AND surprising AND a real trade-off. Single- vs multi-context
(bounded contexts via `GLOSSARY-MAP.md`).

## What it does for the user

Builds a shared language between human and agent, cutting verbosity, keeping naming
consistent, and spending fewer agent tokens decoding jargon. grey-matter's own
`GLOSSARY.md` (the tkt/skills crosswalk) is this skill's output.

## Prior art (why these adjustments)

- The ubiquitous-language core is faithful DDD (Evans/Fowler): challenge, sharpen,
  evolve-by-use. Keep.
- Single/multi-context maps correctly onto bounded contexts, but multi-context is
  **premature for small/solo projects**; the real trigger is a polyseme or
  subdomain split, not repo size.
- The code cross-check is the **accuracy mechanism** that stops the glossary rotting
  (living-documentation practice); treat it as mandatory, not one option of five.
- **DDD is app/business-software modeling.** Practitioner consensus: it misfits a
  game's real-time/gameplay core (ECS/data-oriented, not aggregates) and fits the
  backend/meta/economy half. Ubiquitous language is the one DDD idea that transfers
  to games wholesale.
- ADR format/gate: mainstream practice (Nygard/MADR) is less strict than this
  skill's three-part gate. **We keep it strict anyway** (user ruling): for an
  autonomous agent the failure mode is over-production, so the strict gate is a
  feature, not a bug.

## Decision

**Adapt.** Changes applied in the authored skill:

1. **Scope it honestly.** Added a scope note: this is the app/backend/business-
   software modeling discipline (including a game's economy/meta); for a game's
   real-time systems and design model, use `game-modeling`. The DDD aggregate
   framing belongs to the business-software half.
2. **Cross-check against code = mandatory**, named as the accuracy mechanism.
3. **Multi-context trigger sharpened** to polyseme/subdomain split, default
   single-context.
4. **ADR gate kept strict** (all three conditions), per user ruling; format stays
   tiny with an optional consequences/alternatives line when the rejection is
   non-obvious.

Not done (user ruling): no "propose borderline / re-litigated" ADR relaxation; no
code-reference metadata in the glossary (keeps it implementation-free, avoids
staleness).

The game counterpart is a separate skill, `game-modeling` (ticketed), built on game
design frameworks (pillars, core loop + progression arc, a mechanics/systems glossary
= ubiquitous language retained, Machinations-style economy models, state machines)
with a design-decision record as the ADR analog. Not folded into this skill.

## Cross-skill dependencies

Paired with `grilling` by `grill-with-docs` (which now routes to this OR
`game-modeling` OR both by project type). Produces `GLOSSARY.md` + ADRs read
passively by tdd, diagnosing-bugs, and others.

## Web-app bias

**This is the bias.** The skill is DDD, an app-modeling frame. Rather than lens it,
we scoped it to the half of a game that is business software and spun out
`game-modeling` for the rest. The ticket-02 game-native philosophy's two-regime rule
(deep modules/DDD for services; data-oriented + game frameworks for the sim) is the
same split, applied to modeling.

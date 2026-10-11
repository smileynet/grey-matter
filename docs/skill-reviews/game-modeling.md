# game-modeling

- Bucket: engineering. Invocation: model-invoked. **New skill** (no upstream origin).
- Verdict: **new** (the game-native counterpart to domain-modeling).

## What it is

The active discipline of building a game's design model: name the mechanics
(ubiquitous language, aligned to engine symbol names), pin the core loop(s) + arcs,
cross-check against the running build, reach for state machines / Machinations only
when the game needs them, and record design decisions under a strict gate. Pillars
are a named, stack-ranked input, not a churned artifact.

## Why it exists

`domain-modeling` is Domain-Driven Design, an app/business-software frame. Research
(primary sources) confirmed DDD misfits a game's real-time design model and belongs
only to the backend/economy/meta half. Ubiquitous language is the one DDD idea that
transfers; the rest is replaced by game design frameworks. This skill is the sibling
`grill-with-docs` routes to for a game; together they implement the two-regime split
from proposal 02 (deep modules/DDD for services; data-oriented + game frameworks for
the sim and design model).

## Design decisions (credible-source grounded)

- **Spine = glossary + core-loop(s)/arcs + gated decision record**, mirroring
  domain-modeling's shape (active behaviours + one maintained artifact + one gated
  record), not a textbook of frameworks.
- **"Core loop(s) + arcs/progression," not core loop alone.** The one real
  overfitting risk: loop-only elevation misfits narrative/puzzle/sandbox. Fixed with a
  genre hedge; Cook's primary "Loops and Arcs" agrees.
- **Pillars named, not maintained** (stack-ranked, mostly-fixed experience filter;
  mutable in pre-production, locked in production, per named AAA design leads).
- **MDA invoked as kernel only** ("design experience-backward to the mechanic"),
  named as lineage with the M/D/A taxonomy flagged as critiqued (DDE). No faddish
  taxonomy adopted.
- **Decision record** framed honestly: rationale-logging is native to the living GDD;
  only the ADR *format* (gated, one decision per entry) is borrowed. Strict gate kept
  (agent over-production is the failure mode).
- Machinations / state machines named one line each as "reach for when," not taught.
- Held to the depth bar: 51 lines, in the upstream envelope.

## Cross-skill dependencies

Routed to by `grill-with-docs` (game branch, or both branches for a game with a
backend). Pairs with `grilling`. Hands the backend/economy half to `domain-modeling`.
Produces a mechanics glossary + design-decision records read passively by other
skills. Sits under the proposal-02 `game-native-design` philosophy as its modeling
companion.

## Web-app bias

None, this skill is the game-native correction *to* the web/app bias in
domain-modeling. Engine-neutral; names engine symbol alignment generically
(node/actor/component).

## Sources

Daniel Cook, "Loops and Arcs" (Lost Garden); the Felder/Riot design-pillars
roundtable; Hunicke/LeBlanc/Zubek MDA + Walk's "From MDA to DDE" critique; Dormans /
Machinations; Juul on emergence vs progression. Secondary SEO sources used only as
corroboration. Content from external sources rephrased for licensing compliance.

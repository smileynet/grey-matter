---
id: "05"
title: "Author game-modeling: game-native counterpart to domain-modeling"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "A game-modeling SKILL.md exists capturing: design pillars, core loop + progression arc, a mechanics/systems glossary (ubiquitous language retained), and a design-decision-record ADR analog"
  - "It names when Machinations-style economy models and state machines apply, and defers the backend/economy half to domain-modeling (two-regime split)"
  - "grill-with-docs's game branch resolves to it; held to the upstream depth bar"
tags: ["type:decision", "stream:game-lens"]
---

# Author game-modeling: game-native counterpart to domain-modeling

## Context

`domain-modeling` is Domain-Driven Design: an app/business-software modeling frame.
Research (captured in the ticket-03 `domain-modeling` review) found DDD misfits a
game's real-time/gameplay core and belongs only to the backend/economy/meta half. The
game design layer has its own mature frameworks that play DDD's role. This skill is
the game-native counterpart, the sibling `grill-with-docs` routes to for a game.

The one DDD idea that transfers wholesale is **ubiquitous language** (a canonical
glossary), re-rooted here in mechanics/systems/"verbs" and aligned to the engine's
node/actor/component names.

## Design decisions (from credible-source research)

The lean cut, validated against primary sources (Cook's "Loops and Arcs"; the
Felder/Riot design-pillars roundtable; Hunicke/LeBlanc/Zubek MDA + Walk's DDE
critique; Dormans/Machinations; Juul on emergence/progression):

- **Spine (actively maintained):** (1) a mechanics/verbs/systems **glossary** =
  ubiquitous language retained, aligned to engine symbol names; (2) the **core
  loop(s) + arcs/progression** as the central structural artifact; (3) a gated
  **design-decision record** (strict gate, same as domain-modeling), framed as the
  rationale log native to a living GDD, with the ADR *format* borrowed.
- **Correction:** not "core loop" alone, "core loop(s) + arcs/progression," with a
  one-clause genre hedge (loop-heavy vs arc/progression-heavy varies by genre). This
  is the one real overfitting risk, and Cook's primary source agrees.
- **Name-only, one line each (reach-for-when, not elaborated):** design pillars (a
  stack-ranked, mostly-fixed experience *filter*, an input the spine serves, not a
  churned artifact); Machinations-style economy models (the specialization for
  economy-driven games, and where domain-modeling re-enters); state machines.
- **MDA:** invoke only its kernel, framework-agnostic ("tie each mechanic to an
  intended player experience; design experience-backward to mechanic"), name MDA as
  lineage and flag the M/D/A taxonomy as critiqued (DDE). Do not adopt M/D/A as
  structure.
- **Depth bar:** match the upstream skills (terse, principle-dense); mirror
  domain-modeling's shape (active behaviours + one maintained artifact + one gated
  record), not a textbook of frameworks.

## What to build

A `game-modeling` SKILL.md (and any disclosed siblings), held to the upstream depth
bar (terse, principle-dense; see proposal 02 section 7). Candidate content, to be
settled in its own one-at-a-time discussion:

- **Design pillars** (3-4 experience statements): the scope/focus filter and the "why".
- **Core loop + progression arc**: the central structural model (the game's load-
  bearing "domain model" artifact).
- **Mechanics / systems / verbs glossary**: ubiquitous language retained, shared with
  engine symbol names.
- **Machinations-style economy/feedback models**: only when the game has resource
  flows / feedback worth simulating (this is also where DDD backend thinking
  re-enters).
- **State machines** for entity/game-flow state.
- **Design-decision record** (the ADR analog): a short dated note on why a mechanic/
  tuning choice was made, what was rejected, which pillar / MDA aesthetic it serves.

Framing to carry: analytical lenses (MDA, Schell's Elemental Tetrad, Fullerton's
formal elements, Koster) are how to *think*; the artifacts above are what to *write
down*. Defer the backend/economy half to `domain-modeling` (the two-regime split from
proposal 02).

Fits under the ticket-02 `game-native-design` philosophy: this is the *modeling*
companion to that proposal's *architecture* stance.

## Acceptance criteria

- [x] A game-modeling SKILL.md exists capturing: design pillars, core loop + progression arc, a mechanics/systems glossary (ubiquitous language retained), and a design-decision-record ADR analog
- [x] It names when Machinations-style economy models and state machines apply, and defers the backend/economy half to domain-modeling (two-regime split)
- [x] grill-with-docs's game branch resolves to it; held to the upstream depth bar

## Resolution (2026-10-19)

game-modeling authored at skills/engineering/game-modeling/SKILL.md: design pillars (name-only filter), core loop(s) + progression arcs as the central artifact with the genre hedge, mechanics/systems/verbs glossary as retained ubiquitous language, and a gated design-decision record (ADR analog). Names when Machinations-style economy models + state machines apply and defers the backend/economy half to domain-modeling (two-regime split, bidirectional pointer). grill-with-docs routes game systems to it. Held to the upstream depth bar. Review note at docs/agents/skill-reviews/game-modeling.md.

### Verification
1. ✓ A game-modeling SKILL.md exists capturing: design pillars, core loop + progression arc, a mechanics/systems glossary (ubiquitous language retained), and a design-decision-record ADR analog — "skills/engineering/game-modeling/SKILL.md contains design pillars, core-loop+arcs, mechanics glossary, and the design-decision-record gate"
2. ✓ It names when Machinations-style economy models and state machines apply, and defers the backend/economy half to domain-modeling (two-regime split) — "SKILL.md names Machinations economy models + state machines as reach-for-when, and defers backend/economy to domain-modeling (the re-entry boundary stated on both sides)"
3. ✓ grill-with-docs's game branch resolves to it; held to the upstream depth bar — "grill-with-docs routes a game's design model to game-modeling; depth matches the upstream bar"

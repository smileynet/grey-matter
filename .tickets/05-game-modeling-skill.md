---
id: "05"
title: "Author game-modeling: game-native counterpart to domain-modeling"
status: in_progress
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

- [ ] A game-modeling SKILL.md exists capturing: design pillars, core loop + progression arc, a mechanics/systems glossary (ubiquitous language retained), and a design-decision-record ADR analog
- [ ] It names when Machinations-style economy models and state machines apply, and defers the backend/economy half to domain-modeling (two-regime split)
- [ ] grill-with-docs's game branch resolves to it; held to the upstream depth bar

---
name: game-modeling
description: Build and sharpen a game's design model, mechanics, systems, and the core loop. Use when discussing game mechanics or terminology, writing a mechanics glossary, or recording a design decision. For a game's backend/economy/meta (business software), use domain-modeling instead.
---

# Game Modeling

Actively build and sharpen the game's design model as you design: name the mechanics,
pin the core loop, and write decisions down the moment they crystallise. This is the
game-native counterpart to `domain-modeling`: Domain-Driven Design fits a game's
backend/economy/meta (business software), but not its real-time design model. The one
piece shared with DDD is **ubiquitous language** (a canonical glossary); the rest is
game-shaped.

Design mechanics for the experience you want, and reason **experience-backward**: start
from how you want the player to feel, then find the mechanic that produces it, not the
other way round. (This is the durable core of MDA; its mechanics/dynamics/aesthetics
taxonomy is widely critiqued, see DDE, so take the kernel, not the labels.)

## During the session

- **Name the mechanics (ubiquitous language).** Give each verb/mechanic/system one
  canonical name (dash, stagger, pickup, wave) and use that same word in design talk
  *and* in the engine's node/actor/component names, so design-speak and code-speak
  never diverge. Challenge and sharpen fuzzy terms exactly as `domain-modeling` does
  for a glossary.
- **Pin the core loop(s) and arcs.** The central structural artifact: the small set of
  actions the player repeats (engage -> earn -> upgrade, or whatever the game's is),
  plus the longer **progression arcs** (one-shot content: levels, story, missions).
  The balance of loops vs arcs is **genre-dependent**, loop-heavy for roguelike/idle/
  live-service, arc/progression-heavy for narrative/puzzle, so model whichever carries
  the game, and say which it is. Keep the loop honest against what the prototype
  actually does.
- **Cross-check against the build (mandatory).** When a mechanic is described, check
  the running game/prototype agrees; surface contradictions. Feel is validated by
  play, not assertion, so the prototype is the source of truth the model orbits.
- **Reach for a deeper model only when the game needs it:** a **state machine** for
  entity/game-flow state; a **Machinations-style pools-and-flows** model when the game
  has a real resource economy or feedback loops worth simulating (that economy layer is
  also where `domain-modeling` legitimately re-enters).

## Pillars (a named input, not a churned artifact)

A game has 3-5 **design pillars**: short statements of the experience it must deliver.
Stack-rank them so conflicts have a winner, and treat them as a mostly-fixed tie-break
filter, mutable in pre-production, locked in production. The glossary and loop serve
the pillars; this skill names them and checks decisions against them, it does not
re-litigate them each session.

## Design-decision records

Games have always logged design rationale in the living design doc; borrow the ADR
*format* to make it disciplined. Record a decision only when **all three** hold:

1. **Hard to reverse**: meaningful cost to change your mind later.
2. **Surprising without context**: a future reader will ask "why this way?"
3. **A real trade-off**: genuine alternatives existed and you chose one.

Keep it tiny: a title and 1-3 sentences on context, decision, and why, and tie the
*why* to the pillar or intended player experience it serves (not a business rule).
Number them under `docs/adr/` like any decision record. The strict gate is deliberate:
an agent's failure mode is recording trivia.

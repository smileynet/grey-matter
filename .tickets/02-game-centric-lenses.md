---
id: "02"
title: "Create a parallel set of game-centric lenses for the skills"
status: in_progress
blocked_by: []
priority: medium
env: personal
validation_criteria:
  - "A written analysis exists of where the mattpocock skills assume web-app development and break down for game development (tdd, seams, prototype, deep modules, etc.)"
  - "A proposed lens model is documented: what a game-centric lens is, how it attaches to or overrides a base skill, and which skills need one"
  - "At least one worked lens example drafted (e.g. a game-centric take on tdd) to prove the model"
---

# Create a parallel set of game-centric lenses for the skills

> Proposals (draft for review):
> - [`docs/agents/proposals/02-game-native-development.md`](../docs/agents/proposals/02-game-native-development.md) **(current: reframed around the real intent, a game-native design philosophy)**
> - [`docs/agents/proposals/02-game-centric-lenses.md`](../docs/agents/proposals/02-game-centric-lenses.md) (superseded framing; its web-bias analysis + determinism spine are carried forward)
>
> Reframe: the intent is not a per-skill `tdd` lens but "what is the right approach
> to building games that avoid feeling like web applications." Engine-portable:
> **Godot default, Unreal second anchor**, neutral core + per-engine appendices.
> AC1 (web-bias) and AC2 (model) are satisfied across both proposals; AC3's worked
> example is **drafted**: `skills/engineering/game-native-design/` (neutral `SKILL.md` +
> `review-rubric.md` + `godot.md` + `unreal.md`), held to the upstream depth bar.
> Left in_progress for review before closing.

## Context

The upstream `mattpocock/skills` set is strongly web-application focused. Many of
its core assumptions do not translate cleanly to game development:

- **tdd**: assumes behaviour testable through public interfaces at clean seams.
  Games are heavy on real-time loops, frame-dependent state, physics, rendering,
  and feel/juice, much of which is not naturally unit-testable.
- **prototype**: assumes an HTML single-file artifact or toggleable UI routes,
  which is a web-page notion, not an engine/scene notion.
- **codebase-design / setup-ts-deep-modules**: deep-module + dependency-cruiser
  boundaries assume a TypeScript package layout, not an engine's component /
  entity / system or scene-graph structure.
- **to-spec / to-tickets / implement**: "vertical slice, demoable" maps awkwardly
  onto game features that are often systemic or feel-driven.

We want a **parallel set of lenses**: game-centric perspectives that reinterpret
or override the base skills rather than forking them wholesale. This is a
research-and-discuss task first; we will go deeper later.

## What to build

1. **Web-bias analysis.** Go skill by skill (coordinate with ticket 03) and name
   where each skill assumes web-app development and how it breaks for games. The
   per-skill walkthrough should flag these as it goes so this ticket can collect
   them.
2. **Lens model.** Define what a "lens" is: a document or skill-fragment that
   attaches to a base skill and shifts its assumptions for a domain. Decide how a
   lens attaches (overlay, override, companion skill) and which skills need one.
3. **Worked example.** Draft at least one real lens (a game-centric take on `tdd`
   is the obvious first) to prove the model works and surfaces the right tensions
   (what IS testable in a game: deterministic sim steps, state machines, save/load,
   economy math vs. what is not: feel, timing, rendering).

Research and discussion precede authoring; capture findings as committed docs.

## Acceptance criteria

- [ ] A written analysis exists of where the mattpocock skills assume web-app development and break down for game development (tdd, seams, prototype, deep modules, etc.)
- [ ] A proposed lens model is documented: what a game-centric lens is, how it attaches to or overrides a base skill, and which skills need one
- [ ] At least one worked lens example drafted (e.g. a game-centric take on tdd) to prove the model

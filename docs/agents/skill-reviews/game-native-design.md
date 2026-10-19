# game-native-design

- Bucket: engineering. Invocation: **model-invoked** (no `disable-model-invocation`).
- Verdict: **new** (grey-matter original, no upstream origin). Authored from proposal
  [`02-game-native-development.md`](../proposals/02-game-native-development.md).

## What it is

The game-native philosophy skill: the reference that keeps the agent reasoning about a
game as a **continuous simulation**, not a request/response app. Engine-neutral core
(SKILL.md) plus per-engine appendices in `references/` (Godot default, Unreal second
anchor), loaded on engine detection. Eight tenets (there is always a loop; fixed step for
sim, variable for render; mutable sim state not a store; determinism is a feature; the
frame is a budget; feel is built in the loop; decouple with events/state machines not
re-renders; simulate continuously, tick selectively), the two-regime rule, a testing
split, and a web-ism smell rubric. "A reference to consult, not a session to run."

## What it does for the user

Stops an agent trained mostly on web/app code from building games that feel like web apps
(dead between inputs, re-render-driven, frame-tied, non-deterministic). It is the always-on
game lens the other skills point at when the project is a game.

## Why it exists / prior art

Authored from proposal 02 after the user's intent clarification: the goal was "the right
approach to building games that avoid feeling like web apps", a philosophy, not a tdd
lens. Grounded in: the game loop + fixed-timestep pattern (Gaffer on Games "Fix Your
Timestep", Game Programming Patterns); **data-oriented design** (Mike Acton CppCon 2014,
Richard Fabian) as the deliberate opposite of encapsulation for the hot path;
**determinism** as the spine of replay/networking/reproducible bugs; **game feel / juice**
(Swink, "Game Feel") as engineering that runs over time. Godot is the default engine
anchor, Unreal the second, with a neutral core so the philosophy is engine-portable.

## Decision

**New.** Design decisions recorded:

- **Philosophy, not a method**: tenets + a reference posture, not a red-green loop (that's
  `tdd`, which this skill points at for the loop itself and supplies only what changes for
  games).
- **Engine-portable**: engine-neutral core, per-engine appendices (`references/godot.md`,
  `references/unreal.md`), engine names confined to a mapping table in the core. Godot
  default, Unreal second anchor.
- **The two-regime rule** (the load-bearing idea, shared verbatim with `codebase-design`):
  deep modules for deterministic **sim services** (pathfinder, economy resolver, save
  system, procgen), data-oriented systems for the **frame-loop** layer. Don't force either
  regime on the other. `codebase-design`'s depth/seam/leverage vocabulary is explicitly
  conceded for sim services.
- **Determinism decides testability**: test-first the deterministic core (sim steps, state
  machines, save/load, economy/combat math, pathfinding, seeded-procgen golden outputs,
  replay); do not unit-test feel/timing/rendering/"fun", those are validated by play.
- **Web-ism smell rubric** (`references/review-rubric.md`): the nine ways a game drifts
  into feeling like a web app, the game counterpart to the Fowler baseline `code-review`
  carries.
- **Where web idioms still fit**: HUD/menu UI, meta/backend, tooling, platform-owned loops.
  The boundary is the simulation.

**As shipped vs proposal**: the proposal named the appendices `appendices/godot.md` etc.;
the skill ships them as `references/godot.md` per the agentskills convention, and the skill
was promoted from `docs/lenses/` to a proper model-invokable skill at
`skills/engineering/game-native-design/` during the docs reorganization. This note is the
authoritative record of the final layout.

## Cross-skill dependencies

The game half of the app/game split, paired bidirectionally with `codebase-design`
(two-regime rule stated from both ends; the "locality" homonym disambiguated: comprehension
locality in codebase-design, cache locality here). Pointed at by `code-review`
(rubric-game), `diagnosing-bugs`, `improve-codebase-architecture` (frame-loop regime),
`tdd` (game seam), `prototype` (GAME branch), `to-spec`, `implement`, `grill-with-docs`
(routes game systems here via game-modeling), and `compass` (vocabulary layer). Calls `tdd`
for the red-green loop. Siblings `game-modeling` (the game design/domain model) and this
(the architecture philosophy).

## Self-sufficiency

SKILL.md is self-sufficient: the eight tenets, the two-regime rule, and the testing split
are all inline. `references/godot.md` / `references/unreal.md` / `references/review-rubric.md`
are additive, one hop from SKILL.md, and linked explicitly with relative paths
(appendices back-link `../SKILL.md`). An agent that never opens an appendix still reasons
game-native from the core.

## Web-app bias

This skill *is* the correction for web-app bias in game code. Domain: games. No lens
pointer needed, it is the lens.

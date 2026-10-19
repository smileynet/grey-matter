---
name: game-native-design
description: Build games that feel like games, not web apps. Use when designing or reviewing game code: the loop, simulation state, performance, feel, or when another skill needs the game-native vocabulary. Reach for the matching engine appendix once the engine is known.
---

# Game-Native Design

A game is a **continuous simulation**, not a request/response app. Something advances
every frame, within a hard budget, whether or not input arrived. Web habits default to
the opposite (react to an event, then idle), which produces games that feel dead
between inputs. This is the reference that keeps the agent reasoning game-native. It is
a reference to consult, not a session to run.

Vocabulary is engine-neutral here; the engine's real names live in the appendix (read
the one for the detected engine: `project.godot` -> [godot.md](references/godot.md);
`*.uproject` -> [unreal.md](references/unreal.md)).

## Tenets

1. **There is always a loop.** The simulation advances every frame; it does not wait
   for input. Logic that lives only in event handlers leaves the world dead between
   inputs, with no motion and no feel.
2. **Fixed step for the sim, variable step for the render.** Advance gameplay/physics
   on a fixed timestep (stable, tunable, reproducible); render as fast as you can and
   interpolate between sim steps. Don't tie simulation to frame rate.
3. **Mutable simulation state, not a store.** The sim is updated in place for speed. A
   view-store-as-source-of-truth (snapshots, per-frame reallocation) is a frame-budget
   and GC hazard. Keep stores for meta/UI, not the live sim.
4. **Determinism is a feature.** Same inputs produce the same state: fix the timestep,
   seed every RNG. It unlocks replay, networking, and reproducible bugs, and is the
   spine of game testing (see Testing).
5. **The frame is a budget (~16.7ms at 60fps).** No blocking calls and no per-frame
   heap allocation in the hot path; pool and reuse. Performance is a feature, not a
   later pass.
6. **Feel is built in the loop.** Every input earns cascading per-frame feedback:
   easing, screenshake, hit-stop, particles, layered audio-visual. Juice is engineering
   that runs over time, which is why only a loop can deliver it.
7. **Decouple with events and state machines, not re-renders.** Notify via
   commands/events/observers; model entity state as state machines. Never let a UI
   framework's re-render drive the simulation step.
8. **Simulate continuously, tick selectively.** "Always a loop" is not "tick
   everything." Tick only what participates in the simulation; event-drive the rest.
   Over-ticking is its own cost.

## Deep modules vs data-oriented systems (the two-regime rule)

The `codebase-design` skill says: deep module, a lot of behaviour behind a small
interface. That holds for the **deterministic sim services**: a pathfinder, economy
resolver, save system, procedural generator. These are the deepest, most testable
seams in a game, and `codebase-design`'s depth / seam / leverage vocabulary applies to
them unchanged.

It does **not** hold for the **frame-loop systems layer**, the hot, large-N update code.
There, data-oriented design deliberately separates plain data from the systems that
transform it, the opposite of encapsulation, for cache locality and the "multiple
case." Apply it where the data access pattern justifies it (many entities, hot loops),
not as a cargo cult. So: **deep modules for sim services; data-oriented systems for the
frame loop.** Don't force either regime on the other.

## Testing

Determinism decides what is testable. Test-first the deterministic core: simulation
steps, state machines, save/load round-trips, economy/combat math, pathfinding,
seeded-procgen golden outputs, and replay (recorded inputs reproduce identical state).
Do **not** unit-test feel, frame-dependent behaviour, rendering, input timing, or
"fun", those are validated by play, not assertion. Re-point a test's seam at a sim
service (a deep module) or at the engine's unit of behaviour; the appendix names it.

For the red-green loop itself, call the Skill tool with `tdd`; this skill supplies only
what changes for games.

## Web-ism smells

When reviewing game code, apply the web-ism smell rubric in
[review-rubric.md](references/review-rubric.md): the nine ways a game drifts into feeling like a
web app, each with its fix. It is the game-architecture counterpart to the Fowler
smell baseline `code-review` already carries.

## Where web idioms still fit

Game-native applies to the real-time simulation. Outside it, use the best web
engineering you have: HUD/menu/overlay UI (genuinely retained-mode-ish), meta and
backend (save data, accounts, networking plumbing, analytics, store), tooling and build
pipelines, and platform-owned loops (in a browser you call the platform's frame
callback rather than own the loop). The boundary is the simulation.

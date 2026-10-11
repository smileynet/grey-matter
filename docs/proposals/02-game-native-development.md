# Proposal: building games that feel like games, not web apps

Status: draft for review
Ticket: 02 (game-centric-lenses)
Supersedes: the lens-first framing of
[`02-game-centric-lenses.md`](./02-game-centric-lenses.md). Keeps that proposal's
web-bias analysis, determinism spine, domain-detection rule, and vertical-slice
ruling; demotes "lens" from the headline idea to one delivery tactic among three.
Revised 2026-10-10 to make the guidance explicitly engine-portable: **Godot is the
default engine, Unreal is the second concrete anchor**, with a neutral core and
per-engine appendices (section 6).
Date: 2026-10-10

## The reframe

Ticket 02 was first framed as "a parallel set of game-centric lenses," with a
worked `tdd` lens as the proof. That is too small. The real question is an
engineering **philosophy**:

> What is the right approach to building games so they feel like games, and avoid
> feeling like web applications built in a game engine?

"Feel like a game" is a concrete architectural property, not a vibe. Game feel is
"real-time control of virtual objects in a simulated space, with interactions
emphasised by polish" (Swink). Every load-bearing word there is an engineering
constraint: **real-time** (a hard frame budget), **continuous** (something runs
every frame, between and after inputs), **polish** (screenshake, easing, hit-stop,
particles, delivered per-frame over time). A request/response web app provides the
exact opposite: nothing happens unless an event fires.

So this is not a `tdd` problem. It is a cross-cutting stance that must shape how
the agent designs, decomposes, builds, reviews, and tests game code. The lens idea
survives, but as one tactic. The headline deliverable is a **game-native design
philosophy** the agent reasons with, backed by a review rubric that catches
web-isms, with per-skill overlays only where a specific skill needs re-pointing.

## 1. Why web-trained habits produce games that feel wrong

The misfit is structural, not stylistic. Each web habit has a game-native counter.

| Web-app habit | Why it misfits a game | Game-native counter |
| --- | --- | --- |
| **Request/response, event-handler-only** logic (click -> handler -> done) | nothing happens between inputs, so no continuous motion, no juice, no life | a **game loop**: simulate every frame regardless of input |
| **Re-render-driven** simulation (setState/signal per frame) | ties the sim to the view's render cadence; choppy, wasteful, stale-closure bugs | **update/render separation**: fixed-timestep sim, variable-rate render with interpolation |
| **State-store-as-source-of-truth** (Redux/db snapshots, immutable) | per-frame allocation of new state is a GC-hitch disaster at 60fps | **mutable simulation state** updated in place; the store is for meta/UI, not the sim |
| **OO/DDD deep modeling** (entities-with-methods, inheritance) | pointer-chasing wrecks cache locality in hot loops; crosscutting changes become fragile | **data-oriented design / ECS** in hot, large-N systems: arrays of plain components, behaviour in systems |
| **No frame budget** (web has no hard deadline) | ~16.7ms/frame is hard real-time; blow it and the game visibly stutters | **performance is a feature**: no blocking, no per-frame heap allocation, pool instead |
| **Non-deterministic by default** | breaks physics tuning, networking, and reproducible bugs | **determinism**: fixed timestep + seeded RNG + lockstep/replay |

The through-line: web architecture is **reactive and discrete** (do work in response
to an event, then idle); game architecture is **continuous and real-time**
(advance a simulation every tick within a budget, forever). An agent trained on web
work will reach for the reactive shape by default. The philosophy's job is to make
the continuous shape the agent's default *for the simulation*, while leaving web
idioms where they genuinely fit.

## 2. Where web practices legitimately transfer (so this isn't dogma)

The stance is "game-native for the simulation," not "web is wrong." Keep web idioms
for:

- **Menu / HUD / overlay UI**, which is genuinely retained-mode-ish; a reactive UI
  framework is a fine home for static, event-driven screens.
- **Meta / backend / live-ops**: save data, accounts, networking plumbing,
  analytics, store, content delivery, all normal request/response engineering.
- **Tooling and build pipelines**: editors, asset pipelines, CI.
- **Platform-owned loops**: in a browser you call `requestAnimationFrame` rather
  than own the loop; adapt to it rather than fight it.

The boundary is the real-time simulation. Inside it: game-native. Outside it: use
the best web engineering you have.

## 3. The central tension: deep modules vs ECS

The adapted `codebase-design` skill is the single biggest collision. It says
"design deep modules: a lot of behaviour behind a small interface" and explicitly
tells the agent to *avoid* the words "component" and "service", which are ECS's
primary nouns. ECS / data-oriented design deliberately does the opposite:
**separate** plain-data components from behaviour-in-systems, exposing data rather
than hiding it.

This is not "deep modules are wrong for games." The honest resolution, which the
philosophy must state outright:

- **Deep modules still govern the deterministic sim *services***: a pathfinder, an
  economy resolver, a save system, a procedural generator. These are the deepest,
  most testable seams in a game, and `codebase-design`'s depth / seam / leverage
  vocabulary applies to them unchanged.
- **The ECS data/behaviour split governs the frame-loop *systems* layer**: the hot,
  large-N update code where cache locality and the "multiple case" dominate.
  Encapsulation is relaxed here on purpose; "component" and "system" are
  first-class nouns.
- `codebase-design` therefore needs a **data-oriented note**, not a rewrite: name
  the two regimes and when each applies. Apply DOD/ECS where the data access
  pattern justifies it (hot paths, many entities), not as a cargo cult, which is
  itself a point practitioners stress.

## 4. The form: how to encode this for the agent

Cross-cutting, opinionated guidance that influences many tasks has a known best
form: split by **load cost and conditionality**. Always-on rules stay tiny;
everything conditional loads on relevance (Anthropic Agent Skills / steering
practice). The upstream repo offers exactly three precedents, and the right answer
uses all three at different scopes.

| Mechanism | Upstream precedent | Scope here | Why |
| --- | --- | --- | --- |
| **Reference skill** (model-invoked, single source of truth other skills defer to) | `codebase-design`, `domain-modeling` ("run beneath the other skills") | **primary**: a `game-native-design` reference skill holding the tenets + the two-regime (deep-module vs ECS) resolution | cross-cutting principles many skills share belong in one model-invoked reference, reached by a Skill-tool call, not duplicated |
| **Review rubric** (a fixed smell baseline pasted into review) | `code-review`'s Fowler smell baseline | **enforcement**: a game-feel/web-ism anti-pattern checklist the game-aware review applies | the generative pass drifts under pressure; a rubric audits the output. Analogous to the Fowler baseline but for game architecture |
| **Per-skill overlay** (conditionally-loaded doc co-located with a base skill) | the `GLOSSARY.md` passive-pointer idiom | **specifics**: overlays only where a skill needs concrete re-pointing (`tdd` seam, `prototype` artifact, work-decomposition) | skill-specific assumption shifts don't belong in the shared reference |
| **Always-on pointer** (one line in `CLAUDE.md`/steering) | the `## Agent skills` block setup writes | **trigger**: when `project-type: game` is declared or an engine marker is found, one line points at the reference skill | keeps the always-on cost to a single line; the body loads on relevance |

Recommendation: **primary = a model-invoked `game-native-design` reference skill**
(the tenets, the web-vs-game table from section 1, the deep-module/ECS resolution,
determinism as the spine), **plus** a game-aware **review rubric** (section 5),
**plus** thin **per-skill overlays** for `tdd` / `prototype` / work-decomposition,
**plus** a one-line always-on pointer gated on domain detection. This is a strict
superset of the old lens model: the overlay is still there, but it no longer
carries the whole philosophy.

### Engine neutrality

Keep the reference skill and rubric **engine-neutral** (the game loop, fixed
timestep, DOD, pooling, determinism, and the pattern catalog are substrate-
independent) with **engine-specific appendices** loaded by path scope (editing
`*.gd` -> Godot appendix naming `_physics_process`; Unity `*.cs` -> `FixedUpdate`;
Unreal). One caveat to state: idiomatic Unity `MonoBehaviour` / Unreal `AActor`
object models partly conflict with a pure-DOD stance, so frame DOD as "apply in hot
paths / large-N systems," which is how ECS is positioned even inside those engines.

### Domain detection (kept from the prior proposal)

Auto-detect engine marker files (`project.godot`, Unity
`ProjectSettings/ProjectVersion.txt`, Unreal `*.uproject`) or a declared
`project-type: game` to load the philosophy; it states the assumption it is applying
and lets the user veto. One active domain stance at a time; nearest-marker wins in a
mixed repo.

## 5. Seed content

### Game-native tenets (for the reference skill)

1. A game is a continuous simulation, not request/response: there is always a loop.
2. Separate a fixed-timestep update from a variable-rate render; accumulate time,
   interpolate on render, clamp max frame time.
3. Design around data and the multiple case; prefer arrays of components over
   object graphs in hot, large-N systems.
4. Determinism is a feature: same inputs produce the same state (seed RNG, fix the
   timestep); it unlocks replay, networking, and reproducible bugs.
5. The frame is a budget (~16.7ms at 60fps): no blocking, no per-frame heap
   allocation; pool instead.
6. Feel is built in the loop: every input earns cascading per-frame feedback
   (screenshake, easing, hit-stop, particles, layered audio-visual).
7. Decouple via commands / events / observers and state machines, not framework
   re-renders.
8. Deep modules for sim services; data-oriented systems for the frame loop (the
   two-regime resolution).

### Web-ism anti-pattern rubric (for the game-aware review)

Each is a judgement-call smell, like the Fowler baseline:

- Simulation logic lives only in event handlers; no `tick()` / `update(dt)`.
- A UI framework's re-render (setState/signal) drives the simulation step.
- Game state is held in a view store (Redux/Zustand/useState) as the source of truth.
- No fixed-timestep accumulator; physics tied to frame rate.
- Per-frame heap allocation in the hot loop (no pooling -> GC stalls).
- Blocking / synchronous I/O inside the loop.
- Deep inheritance where a component/data-oriented layout fits a large-N system.
- Stale-closure capture in a `requestAnimationFrame` loop.
- No update/render separation.

### The `tdd` specifics (kept, now an overlay under the philosophy)

The determinism spine and the testability split from the prior proposal stand, now
framed as the testing *consequence* of the philosophy rather than its center:
test-first the deterministic core (sim steps, state machines, save/load round-trips,
economy/combat math, pathfinding, seeded-procgen golden tests, lockstep state-hash,
recorded-input replay); do not unit-test feel/juice/rendering/timing (validate by
play). Re-point `tdd`'s seam at a sim service (deep module) or a system/node/actor.

## 6. Engine portability: Godot default, Unreal second anchor

The philosophy is substrate-independent (the game loop, fixed timestep, data-oriented
design, determinism, frame budget, and game feel are taught cross-engine), but an
agent cannot act on a purely abstract principle: it needs the engine's real API. So
the guidance is a **neutral core + per-engine appendices**, following the Diataxis
split of *explanation* (the stable why/what, neutral) from *reference* (the per-engine
which-API). **Godot is the default and the primary appendix; Unreal is the second
anchor** so the structure is proven against two genuinely different engine models
(an OO scene tree vs an OO actor model with an opt-in ECS). A third engine later
slots in as another appendix without touching the core.

### Doc structure (the anti-drift discipline)

- **The core is the authority.** Each principle lives once in the neutral core as
  prose, in role-named vocabulary that smuggles in no engine (say "the simulation's
  update step", not `_physics_process` or `Tick`; "the simulated thing", not node /
  actor / entity; "frame budget" is already neutral).
- **Each principle carries one mapping table**, concept -> Godot -> Unreal, with a
  **match-quality column** (exact / close / partial / none). Honesty rule from
  controlled-vocabulary crosswalk practice (SKOS): where an engine lacks a concept,
  the cell says "no native X; achieved via Y", never a fabricated equivalent.
- **Appendices mirror the core 1:1** by stable anchor id: `godot.md` and
  `unreal.md` repeat the same principle headings, cite *up* to the core, and never
  redefine it. A lint can assert every core principle id exists in every appendix.
- **Progressive disclosure:** the agent always loads the neutral core; it loads an
  appendix only when it detects the engine (`project.godot` -> Godot;
  `*.uproject` -> Unreal). Inlining all engines wastes tokens on the wrong one.

### The per-principle concept map (the heart of the portable doc)

Each row is a tenet from section 5; the match column is honest about how closely
the two engines' idioms line up.

| Principle (neutral) | Godot (default) | Unreal | Match |
| --- | --- | --- | --- |
| Fixed-timestep simulation step | `_physics_process(delta)`, rate = `Engine.physics_ticks_per_second` (default 60), `max_physics_steps_per_frame` floor | fixed step only via **physics substepping** (`bSubstepping`, experimental) or `FApp::UseFixedTimeStep`; gameplay `Tick` is variable by default | **partial**: Godot has a first-class fixed gameplay step; Unreal's fixed step is confined to the physics layer |
| Variable-rate render / presentation | `_process(delta)`; visual smoothing via `physics_interpolation` (4.3+) | per-frame `Tick`; interpolation is manual | close |
| The simulated thing (unit of behaviour) | `Node`; reusable module = a **scene** (`.tscn`); data = `Resource` | `AActor` + `UActorComponent`; service = a `USubsystem` | close |
| Decoupling (events, not re-render) | **signals** ("signal up, call down"), groups, autoload event bus, `call_deferred` | dynamic multicast **delegates** / Blueprint event dispatchers, `UInterface`, **Subsystems** as service locators | exact (both are observer/event models) |
| Data-oriented design for large-N | **no native ECS**; drop to the **Servers** (`RenderingServer`/`PhysicsServer`) + `MultiMesh` + packed arrays | **Mass Entity** (Fragments + `UMassProcessor`); else Actors/Components | **partial**: Unreal ships an ECS (Mass); Godot has no native ECS, uses servers/MultiMesh |
| Determinism | fixed `_physics_process` + seeded `RandomNumberGenerator`; float determinism not guaranteed; lockstep/replay is community practice | `FRandomStream` seeded RNG; Chaos physics **not** bit-deterministic; authoritative-server replication, not lockstep | partial (neither guarantees cross-platform float determinism) |
| Frame budget / allocation | ref-counting (no tracing GC) but node churn costs; **object pooling**, static-typed GDScript, escalate to C#/GDExtension | **UObject GC** pressure; avoid per-frame `SpawnActor`; pooling; C++ over Blueprint in hot paths | close (different memory model, same "pool, don't churn" rule) |
| Game feel / juice | `create_tween()` easing, `AnimationPlayer`, `GPUParticles2D/3D`, `Camera2D` offset shake, hit-stop via `Engine.time_scale` | Timelines/`UCurveFloat`, Niagara, `UCameraShakeBase`, hit-stop via `SetGlobalTimeDilation` | exact (equivalent toolsets) |
| Testing: off-world vs needs-runtime | GUT / GdUnit4; pure logic + `Resource` + seeded sim test off-tree; nodes/physics need a running scene (GdUnit4 Scene Runner) | Automation (low-level, no world) / Functional (needs PIE level) / Gauntlet (session) | close |

### The one divergence to teach explicitly

The sharpest engine difference, and a trap for an agent, is the **fixed-timestep
default**. In Godot, `_physics_process` *is* a first-class fixed gameplay step: the
engine hands you the continuous-simulation shape for free, and the neutral tenet
"simulate in the fixed step" lands directly. In Unreal, gameplay `Tick` is
**variable by default and disabled on new actors**, and a true fixed step exists
only at the physics-substepping layer. So the same tenet requires *different work*
per engine: in Godot, put sim logic in `_physics_process`; in Unreal, either accept
`DeltaTime`-scaled variable tick for most gameplay and reserve substepping for
physics, or build an explicit accumulator. The appendix must say this out loud, or
an agent will assume a Godot-shaped fixed loop exists in Unreal when it does not.

Related nuance the Unreal appendix must carry: Unreal culture **warns against
over-ticking** (Tick is opt-in and costly), so the neutral "always simulate every
frame" tenet is not "tick everything", it is "the simulation advances every frame;
tick only what participates in it, event-drive the rest". Godot's `_physics_process`
is likewise opt-in per node (`set_physics_process`). Both engines agree: continuous
for the simulation, event-driven for the rest, never tick for tick's sake.

### Where this lives

The neutral core is the `game-native-design` reference skill (section 4). The
appendices are `appendices/godot.md` (default, authored first) and
`appendices/unreal.md`, co-located with that skill, loaded on engine detection.
Engine-specific project settings and class names never appear in the core except
inside a mapping table.

## 7. Depth bar: match the upstream skills, don't overfit

The game-native artifact must have the **same depth as the existing Pocock skills,
just from a games perspective**, not more. The upstream skills are deliberately lean
(measured): `tdd/SKILL.md` is 23 lines, `codebase-design` 78, `diagnosing-bugs` 84,
`prototype` 18 plus two ~40-70 line disclosed files, `code-review` 57. Depth there
is in *judgment* (the right few seams and anti-patterns), not in *coverage*.

Hold the artifact to that bar:

- **`game-native-design/SKILL.md`: roughly 25-45 lines.** The tenets as terse,
  reasoning-first principles (the shape of `tdd`'s "what a good test is / seams /
  anti-patterns / rules of the loop"), the two-regime deep-module/ECS resolution in
  a sentence or two, determinism as the spine. It names the discipline and is "a
  reference to consult, not a session to run."
- **The web-ism rubric** mirrors `code-review`'s Fowler smell baseline: a flat list,
  one line per smell (what it is, then the fix), not paragraphs.
- **Engine appendices (`godot.md`, `unreal.md`): roughly 30-60 lines each**, like
  `prototype`'s `LOGIC.md`/`UI.md`. Carry the *mapping* (neutral principle -> the one
  or two real primitives) and the single divergence that bites. Not an engine
  tutorial.

What to leave out, because it overfits and dates fast:

- Collapse the "exact/close-match" principle rows (decoupling, game feel, frame
  budget) to one line each; spend the room only on the two real divergences
  (fixed-timestep, data-oriented/ECS).
- No version-by-version API archaeology (Godot 3.x vs 4.x, Unreal substepping's
  experimental status): name the current primitive and move on.
- Community-only recipes (hit-stop, pooling patterns, GDScript speed figures) get
  one word, "idiom", not an explanation.
- No tenet-per-nuance. Eight tenets is the ceiling; the agent generalizes from
  principle, as the upstream skills trust it to.

The maxim: **deep in judgment, shallow in prose.** The research in sections 1-6 is
the quarry; the artifact ships only the load-bearing stone.

## Net effect vs the prior proposal

| Aspect | 02 (lens-first) | 02 reframed (philosophy-first) |
| --- | --- | --- |
| Headline unit | per-skill lens overlay | a game-native design philosophy |
| Primary artifact | `GAME-LENS.md` beside each skill | a model-invoked `game-native-design` reference skill |
| Enforcement | (none specified) | a web-ism anti-pattern review rubric |
| Lens overlays | the whole model | one tactic, for skill-specific re-pointing only |
| Deep-module/ECS tension | noted in a table row | resolved explicitly (two-regime: sim services vs frame-loop systems) |
| Web transfer | implicit | explicit "where web idioms still fit" section |
| Determinism spine | kept | kept (now the testing consequence of tenet 4) |
| Domain detection | kept | kept |
| Vertical-slice ruling | kept | kept |

## Decisions this proposal records

1. The deliverable is a **game-native design philosophy**, not primarily a set of
   per-skill lenses. "Lens" is demoted to one of three delivery mechanisms.
2. Encode it as: a model-invoked **`game-native-design` reference skill** (primary),
   a **web-ism anti-pattern review rubric** (enforcement), **per-skill overlays**
   for `tdd`/`prototype`/work-decomposition (specifics), and a **one-line always-on
   pointer** gated on domain detection (trigger).
3. The boundary is the real-time simulation: game-native inside it; web idioms are
   legitimate for HUD/menu UI, meta/backend, tooling, and platform-owned loops.
4. Resolve the deep-module/ECS tension with the **two-regime** rule: deep modules
   for deterministic sim services; data-oriented/ECS for frame-loop systems. Add a
   data-oriented note to `codebase-design` rather than rewriting it.
5. Keep the philosophy **engine-neutral** with path-scoped engine appendices; frame
   DOD as "hot paths / large-N," not a blanket mandate.
6. **Godot is the default engine and primary appendix; Unreal is the second anchor.**
   The core stays neutral (role-named vocabulary, no engine terms outside mapping
   tables); each principle carries a concept -> Godot -> Unreal table with an honest
   match-quality column; appendices mirror the core 1:1 by anchor and load on engine
   detection (`project.godot` / `*.uproject`).
7. Teach the **fixed-timestep divergence** explicitly: Godot's `_physics_process` is
   a first-class fixed gameplay step; Unreal's fixed step is physics-substepping only
   and gameplay `Tick` is variable and opt-in. "Simulate every frame" means the
   simulation advances continuously and you tick only what participates, not "tick
   everything" (both engines penalise over-ticking).
8. Keep from the prior proposal: determinism spine, domain-detection rule,
   one-active-stance, and the `tdd` testability split (now an overlay).
9. Add the **"vertical slice" false-friend** ruling and a **"game feel / juice"**
   entry to `GLOSSARY.md`, plus the neutral core vocabulary (simulation update step,
   fixed timestep, the simulated thing) with each engine's word as a translation.
10. **Match the upstream skills' depth, don't overfit** (section 7): core skill
    ~25-45 lines, appendices ~30-60 each, the rubric one line per smell; principle
    density over API coverage; collapse the non-divergent engine rows; no
    version-by-version API detail. Deep in judgment, shallow in prose.

## Follow-ups

- [ ] AC1 (web-bias analysis): section 1 table + the per-skill table carried from
      the prior proposal. **Done across both proposals.**
- [ ] AC2 (model documented): sections 3-4. **Done.**
- [ ] AC3 (worked example): the choice is now **draft the `game-native-design`
      reference skill** (tenets + two-regime + rubric) as the proof, with the `tdd`
      overlay as a secondary artifact, rather than only `tdd-game-lens.md`. Commit
      under `docs/lenses/` (or `skills/.../game-native-design/` when authored as a
      real skill). Author the **Godot appendix first** (default engine), then the
      **Unreal appendix** to prove the portable structure against two engines.
- [ ] Add the "vertical slice" ruling and a "game feel / juice" entry to `GLOSSARY.md`.
- [ ] Coordinate with ticket 03: per-skill web-bias flags feed the rubric and the
      overlay list.
- [ ] Engine target decided: **Godot default, Unreal second anchor.** Keep the core
      neutral so a third engine (e.g. Unity) is a later appendix, not a rewrite.

## Sources

Game-feel and the continuous-loop argument: Steve Swink's *Game Feel*, the Vlambeer
"Art of Screenshake" talk, and the DiGRA/arXiv juice survey. Architecture: Robert
Nystrom's *Game Programming Patterns* (Game Loop, Update Method, Object Pool,
Component, Observer, Command, State), Glenn Fiedler's "Fix Your Timestep!" and
"Deterministic Lockstep," Mike Acton's data-oriented-design talks, and Unity GC /
frame-budget guidance. The web-misfit failure modes drew on practitioner accounts of
building games in React (setState-per-frame, stale RAF closures, state-store-as-game-
state). The encoding-form recommendation drew on Anthropic Agent Skills / steering
best practices and this repo's own `invocation.md`, `codebase-design`, and `tdd`.
Existing grey-matter decisions (lens model, determinism spine, GLOSSARY homonym
rulings, doc layout) were read directly from `docs/proposals/02-*`,
`docs/tkt-conventions.md`, and `GLOSSARY.md`. Content from external sources was
rephrased for compliance with licensing restrictions.

The engine-portability revision (section 6) drew on: Godot official docs
(`_process`/`_physics_process` and physics ticks, physics interpolation, scene
organization, the Servers API and `MultiMesh`, signals, `Tween`/`AnimationPlayer`,
GDScript static typing, random number generation, and GUT/GdUnit4); Unreal official
docs (Actor ticking and tick groups, physics substepping, the Gameplay Framework and
Subsystems, Mass Entity, delegates/event dispatchers, Niagara and camera shake and
`SetGlobalTimeDilation`, UObject GC, `FRandomStream`, and the Automation / Functional
/ Gauntlet testing tiers); and documentation-structure practice (the Diataxis
explanation-vs-reference split, SKOS match-quality mappings for honest crosswalks,
.NET/MAUI portable-core-plus-platform-callout patterns, and Agent-Skills progressive
disclosure). Community-only practices (hit-stop, camera shake, object pooling,
lockstep/replay, GDScript speed figures) are flagged as idiom-by-convention, not
official guidance.

# Proposal: game-centric lenses for the skills

Status: draft for review
Ticket: 02 (game-centric-lenses)
Date: 2026-10-10

## Summary

The adapted skill set is web-app shaped. This proposal defines a **lens**: a thin,
conditionally-loaded overlay that shifts a base skill's domain assumptions for game
development without forking the skill. It gives (1) a web-bias analysis per skill,
(2) the lens model and attachment mechanism, and (3) a worked example (a
game-centric `tdd` lens) to prove the model. It is research-and-decide; authoring
the full lens set is follow-on work.

The spine of every game lens is **determinism**. Fixed-timestep simulation, seeded
RNG, and lockstep/replay are what make a game testable, designable, and
decomposable in the first place, so the lenses all push the agent toward the
deterministic core and are honest that feel, timing, and rendering live outside it.

## 1. Web-bias analysis

Where the base skills assume web-app development and how each breaks for games.

| Skill | Web-app assumption | How it breaks for games | Lens needed |
| --- | --- | --- | --- |
| **tdd** | behaviour testable through public interfaces at clean seams; red-green per vertical slice | the frame loop, rendering, input timing, and "feel" resist unit tests; the testable core is the deterministic sim (fixed-timestep steps, state machines, save/load round-trips, economy/combat math, seeded procgen, replay) | **yes (worked below)** |
| **codebase-design** | deep module: a lot of behaviour behind a small interface (encapsulation) | ECS/data-oriented design deliberately *separates* data (components) from behaviour (systems), the opposite of encapsulation; the seam unit is a system / node (Godot) / actor (Unreal), not a package | **yes** |
| **setup-ts-deep-modules** | TypeScript packages, dependency-cruiser enforced boundaries | engines enforce boundaries via assemblies (Unity), modules (Unreal), or scene composition (Godot); not a TS package graph | **yes (or N/A per engine)** |
| **prototype** | single-file HTML artifact or toggleable UI routes answers a design question | game prototyping is greybox/blockout, a single mechanic, a playable build, or an in-engine debug/tuning panel; the question is often "how does it feel", answered by play, not a shareable HTML page | **yes** |
| **to-spec / to-tickets / implement** | "vertical slice": a thin path through every layer, demoable | in games "vertical slice" is a *false friend*: it means a small chunk built to near-final polish. Game work is often systemic/emergent/feel-driven, not demoable end-to-end in one slice; "done" for a feel feature is a tuning milestone judged by playtest, not a passing assertion | **yes (shared "game work decomposition" lens)** |
| **diagnosing-bugs** | tight, deterministic, fast feedback loop; red-capable repro | strongly compatible, and *better* in games: a seeded, fixed-timestep replay is the ideal deterministic repro. Non-deterministic bugs map onto the determinism work directly | light lens (determinism-repro notes) |
| **pr / code-review / research / grilling / domain-modeling / handoff / wait-what / triage / wayfinder** | mostly domain-neutral | no material game bias; `code-review`'s Fowler smell baseline is OO-centric and slightly mismatched with data-oriented design, a minor note | no / minor |

Cross-cutting theme the analysis keeps hitting: the base skills optimise for
**encapsulated, unit-testable, demoable-in-a-slice** work. Games invert all three
(data-oriented, play-validated, systemic). The lenses re-point the same workflows
at the part of a game where the web assumptions *do* hold (the deterministic sim)
and name explicitly where they do not.

## 2. The lens model

### What a lens is

A **lens** is a thin overlay doc that adjusts one base skill's assumptions for a
domain (here: games). It is not a fork. It names the base, states what changes, and
leaves the base canonical. Precedence is overlay-wins (the lens overrides the base
where they conflict).

Prior art for the shape: Kustomize overlays (base + a thin declarative patch, base
stays deployable alone), Spring profiles (one active domain profile layered over
defaults), and composition-over-inheritance. All share one lesson: **one canonical
base + a small, explicitly-attached delta**, and one failure mode: the delta
references the base by a handle that can silently drift when the base changes.

### How it attaches (decision)

Four options were considered: (a) a companion skill (`tdd-game`), (b) an
overlay/context doc the base loads when the project is a game, (c) a parameter on
the base, (d) a wholesale fork.

**Decision: (b), an overlay/context doc, co-located with the base skill.** It is
the only option that drops into the existing conventions with no new mechanism: the
base skills already load `GLOSSARY.md` via a one-line passive prose pointer, so
"when this is a game project, also read `GAME-LENS.md` for how these assumptions
change" is the same move. It keeps the base canonical (lowest drift), costs context
tokens only in game projects (progressive disclosure), and handles a mixed repo
cleanly (web areas load nothing extra).

Rejected: (a) companion skill, except where the game variant is a genuinely
different *workflow* worth autonomous model invocation (then wire it as a
model-invoked Skill-tool call, never user-invoked, per `invocation.md`). (c)
parameter bloats the base with `if game/if web` branches (fragile base,
unexercised branches rot). (d) fork guarantees drift.

### Where lenses live

- A lens for skill `X` lives as a sibling file in that skill's folder, e.g.
  `skills/engineering/tdd/GAME-LENS.md`, consistent with "shared reference lives in
  the skill that owns it" (no deep cross-folder links, per `invocation.md`).
- The base skill gains one conditional pointer: "If this is a game project (see
  Domain detection), also read `GAME-LENS.md`; its assumptions override this
  skill's where they differ."
- A shared `docs/lenses/README.md` indexes which skills have a game lens and
  records the model (this doc's descendant).

### Domain detection

Detection *proposes*, the user *disposes*.

- **Signal (strong -> weak):** engine marker files (`project.godot`, Unity
  `ProjectSettings/ProjectVersion.txt`, Unreal `*.uproject`) are near-unambiguous;
  a declared `project-type: game` in `CLAUDE.md`/steering is explicit; an explicit
  user invocation is unambiguous but relies on the human remembering.
- **Rule:** auto-detect the engine marker to *load* the lens, but the lens's first
  act is to state the assumption it is applying and let the user veto. For a mixed
  repo, prefer the nearest marker to the work, not one repo-wide verdict.

### One lens at a time

Support a single active domain lens. Do not design for stacking web+game+mobile
lenses: multi-overlay precedence turns ambiguous (the one point where the prior-art
sources diverge, so we avoid the ambiguity entirely).

### Which skills get a game lens

- **Full lens:** `tdd`, `codebase-design`, `prototype`, and a shared
  **game-work-decomposition** lens covering `to-spec` / `to-tickets` / `implement`.
- **Light lens:** `diagnosing-bugs` (determinism-repro notes), a one-line note on
  `code-review` (Fowler baseline is OO-centric; relax Feature Envy / Middle Man
  for data-oriented systems).
- **Engine-specific setup:** `setup-ts-deep-modules` is TS-only; the game analog is
  a separate per-engine boundary-setup concern, not an overlay on the TS skill.
- **No lens:** the domain-neutral skills (`research`, `grilling`, `domain-modeling`,
  `handoff`, `wait-what`, `pr`, `triage`, `wayfinder`).

## 3. Worked example: the game-centric `tdd` lens

Proves the model. Drafted in full as `docs/lenses/tdd-game-lens.md` (a standalone
artifact); summarised here.

### What the lens overrides

The base `tdd` says: write a failing test at a clean seam, red-green-refactor one
vertical slice at a time. The game lens keeps red-green-refactor but **re-points the
seam** at the deterministic core and reclassifies what is testable.

### The testability split (the heart of the lens)

- **Test first, red-green (the deterministic core):** pure simulation steps under a
  fixed timestep; state machines; save/load serialization round-trips;
  combat/economy/number math; pathfinding correctness; procedural generation with a
  **seeded** RNG (golden-output tests); multiplayer via **lockstep state-hash**
  comparison; regressions via **recorded-input replay** (deterministic sim -> same
  inputs reproduce byte-identical state).
- **Do not unit-test (validate by play, not assertion):** feel/juice,
  frame-dependent behaviour, rendering output, input timing, "fun." Rendering can
  use golden-image snapshots but they are flaky (GPU/driver nondeterminism, late
  assets); treat as re-blessable regression snapshots, not truth.

### The seam re-pointing

The base skill's "clean seam" becomes, in a game: a **system** (ECS) operating on a
component set, a **node/scene** (Godot), an **actor** (Unreal), or best of all a
self-contained **service** (pathfinder, economy resolver, save system), which is
the deepest, most testable seam and where the base `codebase-design` "deep module"
idea still holds. The lens tells the agent to drive logic *out* of the frame loop
and MonoBehaviour/node update methods into such a seam precisely so it becomes
testable: the architecture pressure and the test pressure point the same way.

### Determinism is the enabling move

The lens's leading instruction: **establish determinism first** (fixed timestep,
seed every RNG, isolate the sim from wall-clock and frame rate). Without it there is
no red-capable loop; with it, most of the base `tdd` discipline and the
`diagnosing-bugs` loop transfer directly. Caveat the lens carries: floating-point
results vary across compiler/platform, so cross-platform determinism needs real
engineering (fixed-point or controlled FP), which is itself a thing to decide, not
assume.

### Engine hooks (named, not prescribed)

Unity Test Framework EditMode (pure logic) vs PlayMode (runtime); Unreal
Automation (outside UObject) / Functional (test actor in a level) / Gauntlet
(session); Godot GUT / GdUnit4 with unit vs integration tests in separate dirs. The
lens names these so the agent reaches for the right tier; it does not hardcode one
engine.

## Decisions this proposal records

1. A **lens** is a thin, conditionally-loaded overlay doc that overrides a base
   skill's domain assumptions; not a fork.
2. Attachment: overlay doc co-located with the base skill, loaded via a conditional
   prose pointer (the existing `GLOSSARY.md`-pointer idiom). Overlay-wins precedence.
3. Domain detection: auto-detect engine marker files to load the lens; the lens
   states its assumption and lets the user veto; nearest-marker wins in a mixed repo.
4. One active domain lens at a time; no stacking.
5. Lens coverage: full for `tdd`, `codebase-design`, `prototype`, and a shared
   game-work-decomposition lens over `to-spec`/`to-tickets`/`implement`; light for
   `diagnosing-bugs` and `code-review`; none for the domain-neutral skills.
6. Determinism (fixed timestep, seeded RNG, lockstep/replay) is the spine of the
   game lenses, the `tdd` lens especially.
7. "Vertical slice" is renamed in the game decomposition lens to avoid the
   web/game false-friend collision (add the ruling to `GLOSSARY.md`).

## Follow-ups (satisfying ticket 02 ACs, and beyond)

- [ ] AC1: this web-bias analysis (section 1). **Done in this proposal.**
- [ ] AC2: the lens model (section 2). **Done in this proposal.**
- [ ] AC3: draft the worked `tdd` game lens as `docs/lenses/tdd-game-lens.md`
      (section 3 is the outline; the committed artifact is the deliverable).
- [ ] Coordinate with ticket 03: as each skill is reviewed, flag its web-bias so
      the lens set stays grounded in the per-skill findings.
- [ ] Later tickets: author `codebase-design`, `prototype`, and
      game-work-decomposition lenses; add the "vertical slice" ruling to `GLOSSARY.md`.

## Sources

Game-dev engineering reality (testing pyramid shape, deterministic-core
testability, lockstep/replay, ECS vs encapsulation, greybox prototyping, the
"vertical slice" false friend, playtest-driven "done") researched against engine
testing docs (Unity Test Framework, Unreal Automation/Functional/Gauntlet, Godot
GUT/GdUnit4), Nystrom's Game Programming Patterns, data-oriented-design material,
Gaffer On Games on floating-point determinism, and practitioner writing on juice
and playtesting. The attachment-mechanism decision was researched against Kustomize
overlays, Spring profiles, CSS cascade, composition-over-inheritance, and
Anthropic's Agent Skills progressive-disclosure model, and checked against this
repo's own `invocation.md` / `writing-docs.md` conventions. Content from external
sources was rephrased for compliance with licensing restrictions.

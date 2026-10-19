# prototype

- Bucket: engineering. Invocation: **model-invoked** (no `disable-model-invocation`), so
  other skills call it (wayfinder's `prototype` ticket type, triage).
- Verdict: **adapt**: keep both web branches; add divergence scaffolding to the UI branch;
  add a new GAME branch (Godot substrate); generalise the liftable-core rule; repoint
  capture to tkt.

## What it is

Build **throwaway code that answers a design question**; the question picks a branch.
Upstream has two: LOGIC (a single self-contained HTML file a non-developer drives by
clicking, logic isolated as a liftable pure module) and UI (N radically-different web-route
variants switchable by `?variant=` + a floating bar). Shared rules: throwaway + marked,
trivial to run, no persistence, skip polish, surface state, capture to a throwaway branch
as a primary source.

## What it does for the user

Answers a design question cheaply and concretely before committing to a build: feel the
state model, see real layout options, or (new) feel whether a mechanic is fun, then lift
the validated decision into the real code and discard the rest.

## Prior art (agent-filtered)

Research grounded the throwaway core and flagged two agent issues:

- throwaway-vs-evolutionary = **Boehm spiral** (decide up front; the classic failure is a
  throwaway becoming production); single-question discard = **XP spike**; clickable state
  model = **lo-fi prototyping** (Rettig/Nielsen) + **statecharts** (Harel); the N-variants
  branch = **parallel prototyping** (Dow et al., Stanford TOCHI 2010: parallel alternatives
  beat serial iteration, more divergent, less anchoring). Tracer bullet and walking
  skeleton are the *keep-it* axis, cited as the scope boundary, not modes here.
- **Parallel-divergent generation is a known LLM weak spot.** Generating N is trivial;
  generating N *structurally* divergent is not, LLMs collapse to near-duplicates (the
  "wallpaper" failure the skill already names). The Dow benefit does not transfer for
  free. Counter: name a structural archetype per slot, draft concepts and confirm
  divergence before rendering, fix the cosmetic variables, generate independently, de-dup
  check.
- **The two branches are web-specific.** For a game (Godot default) the verb differs,
  *play/feel* not *click/inspect*. Right substrate: a throwaway **Godot scene + script**
  (has the loop/input/rendering for free, F6-runnable), **greyboxing**, **`@export` /
  debug-panel tuning sliders** (feel prototyping is parameter tuning), the **"find the
  fun" vertical slice**, and **determinism** (fixed timestep + seeded RNG + recorded
  input) for reproducible scenario replay. The **liftable-pure-module principle survives
  and matters more**, recast as a pure **`step(state, input, dt)`** simulation step
  decoupled from nodes/rendering. HTML re-enters only as a Godot HTML5/WASM *export target*
  for sharing, never as the authoring substrate.

## Decision

**Adapt.** Repointing: capture's "context pointer on the issue" becomes a **tkt context
pointer** (throwaway branch + the answer recorded on the ticket), per
`docs/agents/tkt-conventions.md`; the LOGIC HTML file and UI variants align with
`docs/agents/report-format.md` (HTML as the full-bodied communicative artifact). Kept
model-invocable (the sidecar has no policy block), since wayfinder/triage call it.

Adaptations:

1. **Divergence scaffolding on the UI branch** (step 2 rebuilt): assign a named structural
   archetype per variant first, confirm the set is divergent, fix cosmetic degrees of
   freedom, generate independently, run a de-dup check. Upgrades the existing "redo one if
   too similar" hope into a procedure, which is what makes the Dow benefit actually pay off
   for an agent.
2. **New GAME branch** (`GAME.md`): throwaway Godot scene, greybox art, `@export`/debug-panel
   tuning controls, the loop isolated as a pure `step()` sim module, optional determinism
   for scenario replay, playable/HTML5-export handoff, points at `game-native-design`. This
   is the apps/games split applied at the branch level (one artifact differs -> add the
   sibling branch).
3. **Generalised the liftable-core rule** into a shared SKILL rule (rule 6): the reducer/
   machine (logic) and the pure sim step (game) are the same principle; UI variants have no
   such core.
4. **Reinforced the Boehm throwaway contract**: an explicit "throwaway from the outset,
   always; decide throwaway-vs-evolutionary up front" up top, plus a dedicated
   don't-promote-to-production section.

Kept: both existing branches, the single-question discipline, no-persistence/no-polish/
surface-state rules, the floating-switcher spec with the `NODE_ENV` prod-leak guard, and
capture-as-primary-source.

## Cross-skill dependencies

Called *by* `wayfinder` (prototype ticket type) and reachable from `triage`/`grilling`
when a question needs a concrete artifact. The GAME branch points at `game-native-design`
(determinism, feel). Capture records a tkt context pointer. The LOGIC/GAME liftable core is
what later `implement`/`tdd` work absorbs.

## Web-app bias

The original two branches assume a web target (HTML shell; web-route variants). Addressed
by the new GAME branch rather than a bare pointer, because the *verb* differs (play/feel vs
click/inspect) and a pointer alone would leave the agent without the concrete Godot
substrate. The web branches stay as-is for web/app targets; the branch selector routes by
target and verb.

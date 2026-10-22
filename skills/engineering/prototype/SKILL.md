---
name: prototype
description: Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, explore what a UI should look like, or find whether a game mechanic is fun.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

**Throwaway from the outset, always.** Decide up front whether you're building something to *learn from and discard* (a prototype) or something to *keep and grow* (an evolutionary slice, a walking skeleton, a tracer bullet). This skill is only ever the first kind. The classic failure is a throwaway silently becoming production; everything below guards against it.

## Pick a branch

Identify which question is being answered, using the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** -> [LOGIC.md](LOGIC.md). A single shareable HTML file (free-play buttons plus tabbed guided walkthroughs) that pushes the state machine through cases hard to reason about on paper, drivable by a non-developer.
- **"What should this look like?"** -> [UI.md](UI.md). Several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar. The variants must diverge in **structure** (a different organising principle each: linear flow vs. master/detail vs. dashboard), not in colour or copy; near-duplicate layouts forfeit the whole point.
- **"Does this mechanic / loop feel right (is it fun)?"** -> [GAME.md](GAME.md). A throwaway Godot scene with greybox art and tuning controls, run and *played* to feel the mechanic, with the loop isolated as a pure simulation step.

The branches produce very different artifacts, so getting this wrong wastes the whole prototype. The **verb** is the tell: *click/inspect* a state model (logic), *look at* a layout (UI), *play/feel* a mechanic (game). If the question is genuinely ambiguous and the user isn't reachable, default by target: a backend module -> logic; a page or component -> UI; anything real-time, loop-driven, or feel-dependent -> game. State the assumption at the top of the prototype.

## Rules that apply to all branches

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype close to where it will actually be used (next to the module, page, or scene it's prototyping for) so context is obvious, but name it so a casual reader can see it's a prototype, not production. Obey whatever structure the project already uses; don't invent a new top-level layout.
2. **Trivial to run.** One command or one action, no thinking required: a UI prototype starts from the project's task runner (`pnpm <name>`, `bun <path>`, ...); a logic demo is a single HTML file the user double-clicks; a game prototype is a scene the user runs directly (Godot: F6 on the scene).
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it depends on. If the question explicitly involves a database or save system, hit a scratch store with a clear "PROTOTYPE, wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes it _runnable_, no abstractions, no "what if we need X later". The point is to learn something fast.
5. **Surface the state.** After every action (logic/game) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Isolate the liftable core.** The bit that actually answers the question, the reducer/state-machine (logic), or the pure simulation step (game), is written as a small pure module with no DOM, no engine nodes, no rendering reaching into it. The shell around it is throwaway; this module isn't. It's what lifts into the real codebase once the question is answered. (UI variants have no such core; their output is the chosen structure, not a module.)
7. **Judging a render with a model?** State the intended style as intended ("hard cel-shadow edges are deliberate, not aliasing") and phrase criteria as yes/no checks, or vision judges report stylization as defects. Trust a judge's description of the symptom more than its guess at the cause.
8. **Capture it when done.** Fold the validated decision into the real code, then capture the prototype itself as a **primary source**: commit it to a throwaway branch, out of main, and leave a **context pointer** on the tkt ticket (branch name + the answer: the verdict and the question it settled). The main branch keeps only the validated decision; variant/shell/switcher code left in main rots fast and confuses the next reader. See `docs/agents/tkt-conventions.md` for recording the pointer.

## Don't promote the prototype to production

The core module lifts; the *shell* does not. Variant components, the HTML page, the switcher bar, the Godot throwaway scene, all were written under prototype constraints (no tests, minimal error handling). Rewrite the validated decision properly when you fold it in. Promoting prototype code directly to production ships code that was never meant to survive.

---
name: compass
description: Find which skill or flow fits your situation. A router over the skills in this repo. Use when you (or the agent) are unsure which skill to reach for, want to see how the skills fit together, or ask "what should I use for X".
---

# Compass

You don't remember every skill, so ask. This is the map over the set, for a human choosing a tool and for an agent unsure which skill a task calls for.

Before stating what a skill does or recommending a step be skipped, read that skill's SKILL.md: the summaries here are for orientation only, and they can drift from what a skill now does.

A **flow** is a path through the skills. Most paths run along one **main flow**, and on-ramps merge onto it. Everything else is standalone, a vocabulary layer underneath, or part of maintaining the set itself.

## The main flow: idea -> ship

The route most work travels. You have an idea and want it built. The tracker throughout is **tkt** (`tkt ready` for the frontier, `tkt new`/`claim`/`close`, `blocked_by` for edges); see `docs/agents/tkt-conventions.md`.

1. **grill-with-docs** sharpens the idea by interview. Start here whenever you are **working in a working directory**: it's stateful, retaining what it learns in `GLOSSARY.md` and ADRs. (No working directory? Use **grill-me** instead, under Standalone. Both run the same **grilling** primitive; grill-with-docs is the one that leaves a paper trail, which makes it the better of the two whenever a repo is there to leave it in.)
2. **Branch: can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see, a game mechanic you have to feel), detour through a prototype, bridged by **handoff** in both directions:
   - **handoff** out, then open a fresh session against that file,
   - **prototype** to answer the question with throwaway code (logic demo, UI variants, or a Godot game-feel scene),
   - **handoff** back what you learned, and reference it from the original idea thread.
3. **Branch: is this a multi-session build?**
   - **Yes** -> **to-spec** (turn the thread into a spec), then **to-tickets** to split it into tracer-bullet tkt tickets, each declaring its **blocking edges**. Then work the tickets one of two ways:
     - **implement** per ticket, clearing context between each one. `tkt ready` surfaces the frontier (any ticket whose blockers are done); each ticket is self-contained, so the last one's context is disposable.
     - **implement-spec** for the whole spec in one run. It reads the tickets as a **task graph**, runs implementer subagents across the ready **frontier** in parallel, and lands everything on one **integration branch**. Reach for it when you'd rather orchestrate the build than drive each ticket yourself.
   - **No** -> **implement** right here, in the same context window.

   Either way, the code gets built by driving **tdd** (one red-green slice at a time) and closes out with **code-review**, a two-axis review (Standards + Spec) of the diff that **files its findings as tkt tickets**. Reach for **tdd** on its own to build a concrete behaviour test-first without a full spec, and **code-review** on its own to review a branch or PR against a fixed point.

   When the work goes up as a pull request, **pr** shapes the body: the smallest visual that shows the change, before/after evidence, and a one-way or two-way door call. It's model-invoked, so the agent reaches for it whenever it writes a PR.

4. **retro** closes the loop. After a build, especially one that went sideways, it reads the session from a **fresh context** and suggests changes to the agent's **environment**, not the code: navigation pointers, automated checks, the coding standards code-review enforces, steering, tooling. Mechanical mistakes become deterministic checks; judgement calls become coding standards.

### Context hygiene

Keep steps 1-3 in **one unbroken context window** (don't compact or clear until after to-tickets) so the grilling, spec, and tickets build on the same thinking. Each implement then starts fresh from its ticket. Run retro in the session it looks back on, or point it at that session's log.

The limit is the **smart zone** (~150k tokens on current models) within which the model still reasons sharply. If a session approaches it before to-tickets, compact at the nearest phase boundary and carry on (see Phase boundaries).

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and external requests piling up** -> **triage**. It adapts an external request (a GitHub issue/PR) into a tkt ticket, moves it through triage roles, and produces agent-ready tickets that **implement** later picks up. Triage is for work you **didn't create**; tickets that to-tickets produced are already agent-ready, so don't triage them.
- **Something's broken** -> **diagnosing-bugs**. For the hard ones: the resistant bug, the intermittent flake, the regression between two known-good states. It refuses to theorise until it has a **tight feedback loop** (one command that already goes red on this bug), then fixes with a regression test. After the fix, run **retro** to ask what would have prevented it; if the real finding is there's no good seam to lock it down, that's a job for **improve-codebase-architecture**.
- **A huge, foggy effort: a greenfield project or a build too big for one session** -> **wayfinder**, the most demanding flow here. When the way to the destination isn't visible yet, it charts a **shared map** of **decision tickets** (a tkt epic) and resolves them one at a time, producing **decisions, not deliverables**, until the way is clear. When the map clears it **hands off, it doesn't build**: merge onto the main flow at **to-spec**.

## Codebase and docs health

Not feature work, just upkeep.

- **improve-codebase-architecture** keeps the codebase good for agents to operate in. It surfaces **deepening opportunities** (classified by regime: deep modules for services, data-oriented for a game's frame loop); picking one _generates an idea_ you take into the main flow at grill-with-docs. **codebase-design** is the bench you design the chosen one on.
- **curate-docs** keeps the knowledge base tended: promote a mature note into a skill, move a skill's private reference into its `references/`, prune stale docs. (It also owns keeping this map honest.)

## Vocabulary underneath

References that run *beneath* the other skills, each the single source of truth for its vocabulary. Reach for them when the **words**, not the process, are the problem; or let the skills above pull them in. The pair splits by regime, app vs game:

- **domain-modeling** / **game-modeling**: sharpen the project's *domain* language (DDD-style for apps; the game-domain counterpart for game systems). The active discipline grill-with-docs drives to keep `GLOSSARY.md` clean.
- **codebase-design**: the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for a module's *shape*. **game-native-design**: the game-native philosophy (the loop, simulation state, determinism, feel) that keeps game code from feeling like a web app. tdd and improve-codebase-architecture speak both, routed by project type.

## Phase boundaries

A **phase** is a chunk of work inside a session. At the **boundary** between two you have five options, and picking between them is the fuzziest decision in this map: **Continue**, **clear**, **handoff**, **subagent**, **compact** (the default, at the bottom of the tree, not the first reach). Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree and why the primary-source cost makes Continue the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Session bookends

A session has a start and an end, and two skills bracket it. At the **start**, `orient`
reads the frontier, any in-progress thread, and the last session's `.scratch/` handoff,
flags stale WIP, and proposes a next step (using this map for the routing). At the **end**,
`reconcile-tickets` grooms the board and `retro` grooms the environment, and `handoff`
writes the pickup doc that `orient` reads next time. The loop closes: handoff writes →
orient reads; reconcile sets the order → orient reads it.

## Standalone

Off the main flow entirely.

- **grill-me**: the same relentless interview as grill-with-docs, but **stateless** (saves nothing, builds no `GLOSSARY.md`). For when you're **not in a working directory** (a plan, a design, a piece of writing). In a repo, prefer grill-with-docs.
- **grilling**: the interview primitive itself (rounds, the frontier; facts are the agent's job, decisions are yours). grill-me and grill-with-docs are the named ways in; triage, wayfinder, and improve-codebase-architecture run it internally.
- **prototype**: throwaway code that answers one design question, by branch: a logic demo (shareable HTML), UI variants (radically different layouts), or a game-feel scene (Godot, greybox, tuning sliders). The answer folds into real code; the prototype is kept as a primary source on a throwaway branch, pointed at from its ticket.
- **research** / **research-audit**: research delegates reading legwork to a **background agent** that investigates **primary sources** and leaves a cited markdown file in `docs/agents/research/`. research-audit is the fresh-context validator that re-checks those citations and scores them. The findings feed the main flow at grill-with-docs.
- **to-questionnaire**: when what's blocking you is in **someone else's** head, it writes them a questionnaire aimed at the gap. What comes back is material for grill-with-docs or to-spec.
- **wizard**: for the steps only a **human** can take (provisioning, credentials, CI secrets, clicking an unfamiliar dashboard, a one-off migration). It generates an interactive bash script that walks the human through and writes captured values to a **sink** (`.env`, CI secret). Model-invoked, for where a human is genuinely in the loop.
- **writing-for-agents**: the reference for writing documents agents consume (skills, `AGENTS.md`, pointed-at docs).

- **teach**: learn a topic over multiple sessions in a stateful workspace, the agent tutors you, grounding lessons in trusted fetched sources and gating mastery on demonstrated retrieval. For acquiring a skill or concept, not shipping code.
- **wait-what**: a mid-conversation corrective when a message didn't land. Fire it inside any other skill and the agent re-pitches with the context it assumed, in plain active-voice sentences, using the `GLOSSARY.md` vocabulary.

## Maintaining this set

Meta skills that build and tend the skill set itself, not feature work. They live in the `meta` bucket (`skills/meta/`); see `docs/agents/maintenance-skills.md` for the strategy.

- **init-project**: the **precondition**, run before your first flow to configure the tkt tracker, triage tags, and doc layout the other skills assume.
- **review-skill**: the method for reviewing an upstream skill and deciding keep/adapt/drop/new when adapting it into this set.
- **curate-docs**: promote/move/prune agent-facing docs (also listed under health above).
- **cheat-sheet**: list every skill by category with a one-line description, the quick reference card. (This map, `compass`, is the fuller router; cheat-sheet is the flat index.)
- **release** (+ **changelog**, **readme**): cut a tagged release. `release` orchestrates, composing `changelog` (user-facing CHANGELOG entries) and `readme` (keep the README honest), picking the version, and running the gated tag/push/publish. Each is also invokable alone.
- **reconcile-tickets**: end-of-session ticket-board hygiene, make open tickets current, capture untracked work, set the frontier ordering. Pairs with `retro` (board vs environment).
- **orient**: the start-of-session bookend, read the frontier + in-progress threads + the last session's `.scratch/` handoff, flag stale WIP, and propose a concrete next step naming the skill or flow that fits. The session-start twin of this router: `compass` routes by situation mid-session, `orient` routes by session state at the start and defers here when the pick isn't obvious.
- **verify-tkt-usage**: check the tkt commands the skills inline against the live `tkt capabilities` manifest; run it after a tkt upgrade to catch drift.

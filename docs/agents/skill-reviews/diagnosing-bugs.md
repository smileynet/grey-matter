# diagnosing-bugs

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (barely): game-lens pointer + a spike-backed Phase 2 strengthening.

## What it is

A 6-phase disciplined loop for hard bugs: build a tight/red-capable/deterministic/fast/
agent-runnable feedback loop (the core, with a hard gate: no loop, no hypothesis) ->
reproduce + minimise -> 3-5 ranked falsifiable hypotheses -> instrument one variable at
a time -> fix with a regression test (if a correct seam exists; no seam is itself the
finding) -> cleanup. Ships a `scripts/hitl-loop.template.sh` for human-in-the-loop
repros.

## What it does for the user

Stops the agent theorising or fixing before it can reproduce, the exact place agents
fail. The feedback loop is the product; everything else consumes it.

## Prior art (agent-filtered)

The most agent-appropriate skill in the set. Research against Zeller (scientific
debugging, delta debugging), Agans (Debugging's 9 Rules), record/replay (rr), and
recent LLM-bug-fixing studies found: the spine is strongly grounded, and its guardrails
map almost one-to-one onto documented agent failures:

- reproduce-first / "make it fail" before theorising: strong (Agans Rules 2-3, Zeller);
  for agents, a class of bugs is "solvable only through dynamic reproduction".
- scientific hypotheses + one-change-at-a-time: strong; agent-protective (failing agent
  trajectories run ~3.5x longer).
- minimisation = delta debugging: strong.
- determinism + raise-repro-rate for flaky bugs: strong (rr).
- **agent-failure mapping is the standout**: a 150-instance study's taxonomy
  ("Superficial Matching" = jump to fix; "Validation Retreat" = edit the test to force
  green; thrashing; "Reproduction Output Misreading" = declare done unverified) is
  exactly what this skill's gates prevent. The study's own fix (external verification
  gating reasoning before commit) is structurally this skill's phase gates.

Skill's own (reasonable, not canon): "3-5 hypotheses up front" (counters agent
fixation), "no correct seam is itself the finding" (counters Validation Retreat).

## Decision

**Adapt**, minimally. Kept the 6-phase structure, the hard gate, the 10 loop methods,
and the hypothesis/instrument/cleanup discipline verbatim, the research says these are
the earned keep.

1. **Phase 2 minimise strengthening (spike 08).** Replaced the flat "cut one at a time"
   with: linear for a few variables, **bisect (ddmin) for large inputs**, `git bisect
   run` for the commit axis, and the critical guard, **re-assert the original symptom
   after every cut** (don't minimise into a different bug). This uses the agent's cheap
   iteration without making bisection-first (riskier for an agent to botch). See
   `docs/agents/research/spike-agent-delta-debugging.md`.
2. **Game-lens pointer.** For a game, the fixed-timestep seeded sim is the deterministic
   loop and a recorded-input replay is the repro, see `game-native-design`. The research
   confirmed determinism <-> debuggability: a deterministic sim is a built-in
   record/replay substrate, so a game gets the ideal oracle for free.
3. **HITL script kept** under `scripts/` (sanctioned by the standard), with a one-line
   note that Windows runs it under Git Bash / WSL.

## Cross-skill dependencies

Pairs with `retro` after a fix (what would have prevented it). Hands off to
`improve-codebase-architecture` when the finding is "no correct seam". Forward-points to
`game-native-design` for the game loop. Reads `GLOSSARY.md`/ADRs passively.

## Web-app bias

Low. The loop methods lean web (curl, headless browser) but are a menu, not a mandate.
The game case is handled by the lens pointer: same loop, deterministic sim as the
oracle. The bash HITL script is cross-platform-noted.

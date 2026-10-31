---
name: tdd
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development

The red → green loop that gives an agent a tight feedback loop and leaves durable tests
behind. This skill is the reference that makes the loop produce tests worth keeping:
what a good test is, where tests go, the anti-patterns, and the rules of the loop.
Design is settled upstream (grilling, to-spec); cleanup and refactoring are surfaced
afterwards by `code-review` (which files them as tickets to fix). This skill owns the
middle: make it work, test-first, and leave tests that survive the cleanup.

When exploring the codebase, read `GLOSSARY.md` (if it exists) so test names and
interface vocabulary match the project's domain language, and respect ADRs in the area
you're touching.

**For a game**, the testable seam is the deterministic simulation core (fixed-timestep
sim steps, state machines, save/load, economy/combat math, pathfinding, seeded-procgen,
replay); feel, rendering, and input timing are validated by play, not asserted. Call
the Skill tool with `game-native-design` for how the loop re-points for games. The loop
below is the same; only the seam and what's off-limits differ.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can
change entirely; tests shouldn't. A good test reads like a specification: "user can
checkout with valid cart" tells you exactly what capability exists, and it survives
refactors because it doesn't care about internal structure. (This is why tests mock
only at system boundaries, never internal collaborators: a test coupled to internals
breaks when `code-review` later refactors them, defeating the point.)

See [references/tests.md](references/tests.md) for worked good/bad examples when a test's shape is unclear, and [references/mocking.md](references/mocking.md) when the change touches a system boundary (external API, DB, time, filesystem) and you need to decide what to mock.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior
without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under
test and confirm them with the user. No test is written at an unconfirmed seam. You
can't test everything, so agreeing the seams up front is how testing effort lands on
the critical paths and complex logic. Lower-risk areas still get lightweight coverage,
they aren't left untested, just not tested exhaustively.

Ask: "What's the public interface, and which seams should we test?" Give each proposed
seam a one-line note on what it catches and what it misses.

When the shape of that interface is itself in question (how deep the module is, where
the seam belongs, what the interface should expose), call the Skill tool with
"codebase-design" for the vocabulary. It is the shared source of the module, interface,
depth, seam, adapter, leverage and locality terms, and it is a reference to consult, not
a session to run.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or
  verifies through a side channel (querying the database instead of using the
  interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does
  (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant
  asserted equal to itself), so it passes by construction and can never disagree with
  the code. Expected values must come from an independent source of truth: a known-good
  literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests
  verify _imagined_ behavior: you test the _shape_ of things rather than user-facing
  behavior, the tests go insensitive to real changes, and you commit to test structure
  before understanding the implementation. Work in **vertical slices** instead: one test
  → one implementation → repeat, each slice a **tracer bullet** that responds to what
  the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it.
  Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Leftmost tier.** Run the loop at the cheapest tier that observes the seam, in seconds;
  climb only for what that tier cannot see. Tiers: the
  [test-environment ladder](../../../docs/agents/test-environment-ladder.md).
- **Refactoring is not part of this loop.** Making it work and making it clean are
  separate stages here: the red → green loop makes it work, and `code-review` surfaces
  cleanup as tickets to fix. Keeping cleanup out of the loop is why the tests above must
  survive refactors.

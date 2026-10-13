# tdd

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (reframe the purpose; add the app/game seam split; two tightenings).

## What it is

The red -> green loop reference: what a good test is (behavior through public
interfaces, survives refactors), where tests go (seams, pre-agreed with the user),
anti-patterns (implementation-coupled, tautological, horizontal slicing), and the loop
rules. Siblings: `tests.md` (good/bad examples), `mocking.md` (DI, mock at boundaries).

## What it does for the user

Gives an agent a tight, high-signal feedback loop that leaves durable, behavior-level
tests behind. Design is settled upstream (grilling, to-spec); cleanup/refactoring is
downstream in `code-review`. This skill owns the middle: make it work, test-first.

## Purpose vs traditional TDD (why the "flags" dissolve)

Research against credible sources (Beck, Fowler, Ian Cooper, the pyramid/trophy and
classicist/mockist debates) first flagged two "contested" positions. On reading the
skill for *what it is*, both evaporate:

- **"Refactoring is not in the loop" is not a departure to apologise for.** Beck's
  red-green-refactor is *design-TDD*, a personal design loop. This skill is an **agent
  feedback loop** in an architecture where cleanup is a separate skill (`code-review`).
  So refactor-out-of-loop is correct *for this skill's purpose*. We name the purpose
  rather than label it a "variant of Beck."
- **The classicist/mockist debate is the wrong altitude for this skill.** That debate
  is about whether interaction-tests should *drive object design* (design-TDD). This
  skill isn't design-TDD, so it takes no side. Its rule, "behavior through public
  interfaces, survives refactors, mock only at boundaries", falls out directly from its
  own purpose (durable tests + a separate refactor stage); mocking internals couples to
  structure and breaks on the later refactor. We state it as plain good practice and
  **deliberately do not invoke, name, or re-litigate classicism/mockism.** (Recorded
  here so a future reader doesn't reopen a debate the skill doesn't engage.)

Everything else is mainstream-to-strong: test-first/red-before-green, behavior-level
tests, mock-at-boundaries + DI, risk-based seam scoping, the tracer-bullet/vertical-
slice framing.

## Decision

**Adapt**, structurally not doctrinally:

1. **Name the purpose** (agent feedback loop; design upstream, cleanup in
   `code-review`), so refactor-out-of-loop and no-internal-mocking read as intent.
2. **App/game seam split.** Added a pointer: for a game the testable seam is the
   deterministic simulation core, and feel/rendering/timing are validated by play, see
   `game-native-design`. The loop is shared; only the seam and what's off-limits
   differ. This mirrors domain-modeling -> game-modeling, but here a *pointer*, not a
   sibling skill, because the loop itself is identical across domains (a whole
   `game-tdd` would duplicate red-green for no gain).
3. **Tightenings:** "each **slice** is a tracer bullet" (not "each test", a tracer
   bullet is an end-to-end slice); lower-risk areas get lightweight coverage, not zero.

Siblings `tests.md` / `mocking.md` kept as-is (mainstream).

## Cross-skill dependencies

Calls `codebase-design` for seam/interface vocabulary. Hands cleanup to `code-review`.
Driven by `implement` / `implement-spec`. Forward-points to `game-native-design` for
the game seam. Reads `GLOSSARY.md`/ADRs passively.

## Web-app bias

Base assumptions (clean public-interface seams, behavior tests survive refactor) hold
for apps and partially break for a game's real-time code, confirmed by game-testing
practice. Handled by the game-native-design lens (ticket 02), which this skill now
points to. No change needed beyond the pointer.

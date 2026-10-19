# implement

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (tkt lifecycle; code-review-closeout reconciliation; sharpen cadence).

## What it is

A deliberately thin orchestrator for implementing one ticket: fetch it, state its
title, drive `tdd` at pre-agreed seams, run checks, close out with `code-review`, commit.
The discipline lives in tdd and code-review; implement just sequences them around a
single unit.

## What it does for the user

Turns a ticket into committed, tested, reviewed code in one session, without the
orchestrator re-specifying how to test or review (those are their own skills).

## Prior art (agent-filtered)

Grounded in the adjacent reviews (tdd, code-review, diagnosing-bugs) rather than a fresh
dispatch, those already covered the relevant agent-failure and verification literature:

- **One-ticket-per-session, state-the-title, ask-if-ambiguous**: matches Spec Kit
  `/implement` and Kiro's one-task-at-a-time; "state the title" is a cheap anti-amnesia /
  wrong-ticket guard. Sound.
- **Delegate discipline to tdd/code-review**: correct skill design (single source of
  truth; orchestrator sequences, called skills hold the discipline).
- **Check cadence** (fast local checks often, full suite at end): standard tight-loop /
  CI-cost practice.
- **Close out with review before done**: the Expert-Executor / verify-before-commit
  pattern from the diagnosing-bugs research, the counter to "declared done but wrong".

Two issues examined:

- **"where possible" / "regularly" are soft for an agent** (the "defines regularly as
  never" failure; writing-for-agents' vague-bound lesson). Sharpened to checkable
  triggers.
- **code-review now files findings as tickets** (our adaptation), so "run code-review at
  the end" produces follow-up tickets, not inline fixes. This is cleaner, it resolves a
  scope-discipline risk: implement shouldn't balloon one ticket into fixing everything
  review surfaces.

## Decision

**Adapt.** Changes:

1. **tkt repoint + wire the lifecycle.** Fetch via tkt (read the ticket file / `tkt
   query`); **`tkt claim`** at the start (visible in-progress); **`tkt close`** at the
   end with resolution + AC checks. The upstream had no claim/close (abstract tracker);
   ours is tkt, so fetch -> claim -> work -> close is the natural home for the lifecycle.
2. **code-review closeout reconciliation.** Findings become follow-up tickets; fix only
   the findings that block *this* ticket's acceptance criteria before committing, file
   the rest. Keeps the current unit scoped without losing findings.
3. **Sharpened cadence.** "typecheck + the relevant test file after each slice; full
   suite before you commit", checkable triggers instead of "regularly".
4. Kept thin, kept **commit-to-current-branch** (multi-ticket integration-branch/PR is
   `implement-spec`'s job). Game seam is inherited from tdd's pointer, no redundant
   pointer here.

## Cross-skill dependencies

Calls `tdd` (build) and `code-review` (closeout, which files tickets). Consumes tickets
from `to-tickets`/`to-spec`. Lifecycle via tkt (`claim`/`close`, see tkt-conventions).
Pairs with `implement-spec` (the multi-ticket orchestrator) which it deliberately leaves
alone.

## Web-app bias

None of its own. The one domain-sensitive step (the test seam) is delegated to `tdd`,
which already points at `game-native-design` for a game, so implement inherits the game
behaviour without carrying a lens.

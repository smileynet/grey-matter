# implement-spec

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (tkt repoint; two under-guard fixes; explicit sequential fallback; code-review closeout).

## What it is

The multi-ticket orchestrator: implement a whole spec on one integration branch by
running the ticket task-graph's ready frontier through implementer subagents (each in
its own git worktree, each calling `tdd`), merging via a merger subagent, re-fanning the
frontier, closing out with `code-review`, cleaning up worktrees. The heavyweight sibling
`implement` defers to this.

## What it does for the user

Builds an entire spec in one orchestrated run, parallelising independent tickets, so a
large spec lands on one branch without the user driving each ticket by hand.

## Prior art (agent-filtered)

Research (Anthropic multi-agent research system + context engineering, git-worktree
practitioner sources, parallel-agent coding writeups, arXiv on semantic merge conflict)
confirmed the architecture is well-grounded and mostly portable:

- **Orchestrator + parallel worker subagents on a task graph**: canonical. Big benefit,
  big token cost ("maximum concurrency" is a tradeoff, not free). Strong.
- **Git worktrees for isolation**: table stakes, and plain git, fully portable. Strong.
- **Integration branch + merge coordination + frontier recompute**: sound. Strong.
- **Context pointers / sparse inter-agent comms**: Anthropic just-in-time retrieval.
- **The worktree-base check**: validated by a real Claude Code bug (worktrees forking
  the wrong base). Well-targeted.

Two genuine under-guards it flagged (both agent-failure counters):

1. **No executable gate per merge.** The most-cited defense against *semantic* conflict
   (slices that pass alone, break merged) is building/testing the integration branch
   after each merge, not a final-only review. The upstream reviews only at the end.
2. **Completion-honesty.** Nothing cross-checked that each ticket's acceptance actually
   passed on the integration branch; it trusted subagent self-reports.

Plus a portability finding: the sequential degrade (work the frontier one ticket at a
time on the integration branch) is sound and loses nothing structural, it is simpler and
*safer* (no concurrent conflict), just slower. And a notes-location nuance: shared notes
must live outside any single worktree, so `.scratch/` (per-worktree) is wrong here;
out-of-repo or the main checkout is right (confirmed correct for the worktree design).

## Decision

**Adapt.** Changes:

1. **tkt repoint.** Frontier = `tkt ready`; "resolve each ticket the way the tracker
   closes work" = `tkt close`; implementers `tkt claim`. The draft-PR path is optional
   and off by default (PRs aren't a request surface here; close via `tkt close`). Dropped
   the setup-skill pointer.
2. **Executable gate per merge** (under-guard #1): after every merge, the integration
   branch build + full suite must be green before proceeding. The headline fix.
3. **Verify before closing** (under-guard #2): confirm each ticket's ACs pass on the
   integration branch before `tkt close`, don't trust self-reports.
4. **Explicit sequential fallback**: parallel subagents where the harness supports real
   background agents; otherwise work the frontier one ticket at a time on the integration
   branch. Stated as a first-class path, not improvised.
5. **code-review closeout reconciliation**: findings become tickets; fix spec-blocking
   ones now, file the rest (consistent with `implement`).
6. **Notes-location conditional**: shared subagent notes go outside any single worktree,
   not a per-worktree `.scratch/`.

Kept: the worktree-base check, context-pointer comms, merger step, and the cleanup step
(now noting squash-merge detection, a documented cleanup trap).

## Cross-skill dependencies

Calls `tdd` (per ticket) and `code-review` (closeout, files tickets). Consumes the task
graph from `to-tickets`/`to-spec`. Lifecycle via tkt (`ready`/`claim`/`close`). The
multi-ticket counterpart to the single-ticket `implement`.

## Web-app bias

None of its own; the test seam is delegated to `tdd` (which points at
`game-native-design` for a game). The orchestration (task graph, worktrees, integration
branch, executable gate) is domain-neutral.

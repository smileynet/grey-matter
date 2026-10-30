---
name: implement-spec
description: "Implement the result of to-spec and to-tickets in code, a whole spec on one integration branch."
disable-model-invocation: true
---

You have been provided a spec with tickets describing how to implement it. The goal is the entire spec implemented on a single **integration branch**, with every ticket closed via `tkt close`.

The tickets are a **task graph** with blocking edges, not a list of steps, so there is always a **frontier** of ready tickets (`tkt ready`). Work the frontier until it's empty.

**Parallel or sequential.** Where the harness supports real background subagents, run ready tickets in parallel (one implementer subagent per ticket, each in its own git worktree) for concurrency. Where it doesn't, work the frontier **sequentially**: one ready ticket at a time, directly on the integration branch. Same structure either way; sequential is simpler and avoids concurrent conflicts, it just takes longer. Everything below describes the parallel case; drop the worktree/merger machinery for the sequential one.

Communicate between agents sparsely, via **context pointers** (spec-slug, ticket id, commit sha, notes-file path), not duplicated content. Shared notes must live where every worktree can reach them: outside any single worktree (the main checkout or an out-of-repo dir), not a per-worktree `.scratch/`.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** for any codebase or external-doc exploration the tickets need. It saves markdown notes where all later subagents can read them (shared location per above), so implementers focus on implementation, not exploration.

3. Create the integration branch off the base branch.

4. For each ready ticket, run an **implementer subagent** in its own worktree on its own branch. Each one:
   - confirms its worktree is based on the **integration branch** tip before starting, and resets onto it if not;
   - `tkt claim`s its ticket;
   - states the ticket's observable outcome and main unresolved assumption, and checks the assumption first;
   - calls the Skill tool with `tdd` to build it;
   - merges the integration branch tip into its own branch before reporting done.

   Pass large inputs (spec excerpts, exploration notes) as file paths, not inline in the prompt. When an implementer stalls or comes back empty, inspect its worktree first (`git status`, the expected files, test output) before re-dispatching: it may have finished and only lost its report. Report a failed or partial implementer explicitly; never absorb it silently.

5. When an implementer completes, a **merger subagent** merges its branch to the integration branch. **After every merge, the integration branch build and full test suite must be green before the next merge or the next frontier ticket.** A clean textual merge is not enough: two slices can each pass alone and break together. If the gate fails, fix it before proceeding.

6. Recompute the frontier (`tkt ready`); fan out implementers for the newly-unblocked tickets (or take the next one, sequentially).

7. Once all tickets are implemented, review the integration branch at the depth its riskiest ticket calls for, per implement's [review depth](../implement/SKILL.md#review-depth): `code-review` for a consequential change, otherwise a spec check of each ticket. Expectations come from the spec and tickets, written before reading the diff. Code-review files its findings as tickets; fix the ones that block the spec now, in a single implementer subagent, and leave the rest as follow-up tickets.

8. **Verify before closing.** For each ticket, confirm its acceptance criteria actually pass on the integration branch, don't trust an implementer's self-report. Before closing, promote, keep or delete each ticket's scratch and build artifacts per [repository-artifact-hygiene](../../meta/repository-artifact-hygiene/SKILL.md#at-ticket-close). Then `tkt close` each with its resolution and ACs checked. (If this repo treats PRs as a request surface, which is off by default, mark the draft PR ready instead; see the issue-tracker doc.) Report the integration branch.

9. Clean up the implementer worktrees. Detect merged branches by content, not ancestry: a squash-merge looks unmerged by ancestry, so a naive "fully-merged only" sweep leaves worktrees (and their build artifacts) dangling.

If the project keeps a status dashboard, call the Skill tool with "delivery-dashboard" after
closing the tickets: one entry per ticket, then one Plan tab refresh.

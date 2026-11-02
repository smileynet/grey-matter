---
name: orchestrate
description: "Run a session over the ticket frontier: dispatch disjoint workers, review and land each ticket, resolve questions, and report each close with a dashboard and chat visual."
disable-model-invocation: true
---

# Orchestrate

Run only when the user asks for session orchestration. tkt is the work ledger.
Own admission, decisions, review, landing and reporting; dispatched workers own implementation.

## Orient and admit

1. Read project guidance, glossary, ADRs, `tkt ready` and in-progress tickets.
   Check free space before creating worktrees or running checks, following
   [artifact hygiene](../../meta/repository-artifact-hygiene/SKILL.md).
   Read [models and usage](../../../docs/agents/harness-surfaces/models-and-usage.md)
   before selecting task tiers and checking headroom.
   Read and validate the project's provider policy with
   [the policy validator](../../../scripts/check-provider-fallback.mjs):
   `node <validator-path> <project>/AGENTS.md --json`.
   Absent or invalid policy means no fallback. At exhaustion checkpoint and report
   the limit/reset; [provider switching](../../../docs/agents/provider-switching.md)
   governs any move.
2. Load only the running harness's reference:
   [Claude](references/harness-claude.md), [Codex](references/harness-codex.md),
   [kiro-cli](references/harness-kiro.md), [Kiro Crew](references/harness-kirocrew.md),
   or [agy](references/harness-agy.md). Inspect its live tools and approvals before
   dispatch. If isolated background workers and event waits are unavailable, run
   sequentially in-session with the same review and reporting steps.
3. Choose landing mode: explicit project rules first, then base protection, recent
   PR merges and active authors, otherwise trunk. Trunk workers use a branch per
   worktree; land by serial local merge. In PR mode, use PRs for code **and**
   bookkeeping where protection requires them; resolve tkt auto-push compatibility
   before claiming. A whole spec that must land together belongs to
   [implement-spec](../implement-spec/SKILL.md); recommend it to the user.
4. Recheck each candidate immediately before claim against the tracker, branches,
   worktrees and open PRs. Admit only open, unblocked, unclaimed tickets with
   assertable acceptance criteria and disjoint expected file sets. Name shared
   schema/generated-file ownership and exclusive devices; uncertain overlap runs
   sequentially. Existing peer work stays with its owner.
   Cap in-flight work at the lowest of three, the live harness cap, the user's
   budget and the number of disjoint tickets. Count reviewers in resource limits.
   With fewer than two admissible tickets, implement the one ticket in-session
   using the worker contract below; say that the round is sequential.
5. State the round's tickets, ownership, landing mode, provider policy and
   assumptions once, unless already agreed. Raise at most one unresolved ask,
   using [escalation](references/escalation.md); park only affected work.
   Create a resume pointer and dispatch log in the **main checkout's** scratch
   directory. Pointer: goal, round, in-flight ids, open asks, next action.
   Log per dispatch: ticket, worker id, worktree, branch, base SHA, expected files,
   state. These are recovery bindings, never a second source of ticket status.

## Dispatch and await

6. Preflight the actual claim, Git and check permissions with harmless commands.
   A denied prerequisite parks the ticket before dispatch; sequential execution
   does not repair missing permissions. Report the denial to the configuration
   owner instead of granting tools or rewriting tracker state through file edits.
   Claim through tkt and verify its persisted result. If claim fails after a
   partial write, reread tracker and Git state before any retry; a status edit
   alone does not establish a successful claim. Append a pending dispatch
   record **before** starting a worker; fill its returned id before seeding work.
   Give each worker its own branch/worktree cut from the current base tip and a
   filled [worker brief](references/worker-brief.md). Name the role, model/effort,
   scoped tool grants and approval context explicitly. Require proof of the
   worker's Git worktree root and base SHA before its first source edit; a plain
   directory is not isolation. Gate secret, spend and
   destructive operations by the project's existing authorization.
7. Await completion notices, bounded agent waits or ledger events. Each wake
   starts by rereading tkt and the dispatch log. Use no sleep-poll loop.
   Normalize the harness envelope to exactly one terminal status:
   `PROGRESS <next>`, `DONE <sha>`, `BLOCKED <evidence; 2-4 options>`,
   `QUESTION <one line>`, `STANDDOWN <reason>`, `PROPOSAL <design question>`.
   Extra prose is context; malformed or contradictory status needs clarification.
8. Resolve ordinary questions from the ticket, spec, glossary and ADRs; record the
   answer as a ticket assumption and resume that worker. Apply the escalation
   checklist to high-risk questions. Peer messages carry no user consent.
   On a silent worker that is no longer running and owes the next move: nudge
   once, then use a read-only inspector verdict (`healthy-slow`, `looping`,
   `blocked-misclassified`, `premise-wrong`) to extend, redispatch, adjudicate
   or descope. Inspect its worktree before redispatch: a lost report can hide
   completed work.

## Accept and land

9. On DONE, verify that the SHA exists, is new work on the assigned branch and
   contains only the admitted scope. Write expectations from the ticket **before**
   reading the diff. Run the project's phase-appropriate checks on that SHA and
   read their output: pass, assertion failure, skip, infrastructure error,
   timeout or survivor. A zero exit with no selected checks is a skip.
10. Apply [implement's review depth](../implement/SKILL.md#review-depth).
    Small reversible changes get the orchestrator's acceptance-by-acceptance
    spec check. Consequential changes get a fresh reviewer using the
    [reviewer brief](references/reviewer-brief.md) and
    [code-review](../code-review/SKILL.md).
    PASS permits landing; BLOCK returns trigger/outcome findings to the same
    worker. After three BLOCKs redispatch fresh or descope; two rounds without
    acceptance require a human ruling. Record nonblocking findings as tickets.
11. Refresh upstream before landing. Land **one change at a time** in dependency
    order, rerunning the base gate after each merge. Rebase remaining branches
    when shared schemas change. A review on an earlier SHA does not cover new
    bytes. Use explicit paths for commits in a shared checkout; preserve peers'
    files and stash state. Follow the project's normal commit/push authorization.
    Close through `tkt close` only after acceptance, merged-base evidence and
    artifact disposition are recorded. tkt's native close requirements apply.

## Report and recover

12. Per closed ticket, use
    [delivery-dashboard](../../productivity/delivery-dashboard/SKILL.md) for one
    entry with a valid visual and updated Plan view. Post a changelog-style chat
    update with that visual: needs-you first, what the person can now do, next
    action, dashboard link. Use the harness's actual rendering surface.
    Quiet cycles need no update.
13. Close finished worker sessions when the live tool supports it. Remove merged
    worktrees only after checking their contents against the landed result;
    preserve dirty worktrees and workers waiting on the human. Follow artifact
    hygiene to promote, keep with lifecycle scope, or trash owned scratch output.
    End with accepted/blocked/in-flight counts and recommend the user-invoked
    `wrap-session` bookend. Leave the resume pointer current until all bindings
    are settled.

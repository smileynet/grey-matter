---
name: orchestrate
description: "Coordinate an authorized outcome through scoped tickets, isolated workers, independent review and parent-owned integration. Use when asked to orchestrate a workstream or continue an agreed orchestrated session."
---

# Orchestrate

Coordinate a user-authorized outcome until its proof condition is met or no authorized
progress remains. An agent may select this skill only within authorization already given
by the user; invocation never authorizes delegation, spend, publication, settings changes
or a broader outcome. If that authorization is absent, continue work already in scope and
ask before orchestrating. tkt is the work ledger. Own admission, review, integration and
reporting; workers own only their assigned implementation.

## Outcome contract and loop

Recover one durable contract from the existing spec or plan: outcome and proof, included
and excluded scope, existing authority and restrictions, resources (including critic
slots and exclusive devices), completion/stops, and the latest user revision. Do not make
a second board or invent a budget. Treat a resume pointer as recovery data, not task truth.
Resolve routine choices from repository sources; ask only when a missing fact changes the
outcome or authorization.

Follow this loop through every batch: reconcile the live tracker and dispatch bindings;
admit only scoped, unclaimed work with verifiable acceptance and safe write/resource
separation; verify worktree, branch and base before edits; reserve reviewer capacity;
inspect candidate bytes and evidence; independently review when required; integrate
serially and verify the integrated result; then repeat until the outcome is proved or
stopped. Count reviewers in the live resource cap. One useful ticket or unavailable
isolation means sequential execution. A clarified scope supersedes prior assumptions;
update the contract and affected admission before continuing. Existing user authorization
continues through ordinary review and integration in its stated scope.

Read [the outcome and recovery protocol](references/outcome-contract.md) for stop,
resume, state dimensions and role boundaries. Use the existing
[worker](references/worker-brief.md), [reviewer](references/reviewer-brief.md),
[escalation](references/escalation.md) and only the active
[harness reference](references/harness-codex.md) (or its sibling) for details. Do not
invoke restricted implement entry points or reproduce their procedures to bypass a
refusal.

For grey-matter source-checkout tools, read the [script usage contract](references/tool-scripts.md).
When adding an operator there, update its inventory and owning guidance, then run the
coverage check from that checkout. In another project, follow its tool guidance and
document new operator commands through its conventions. Script presence grants no authority.

When a scoped task needs a durable local handoff, use the
[session-message contract](references/session-messages.md) with the exact recorded target
and generation. Bind tracked work to its ticket, candidate state and retained handoff
reference in the message context; those fields do not grant authority. Its manual
spool does not wake a native session; load the active harness reference and confirm
supported notification separately. Queued is not delivered.
Before selecting a native interface, read the
[current messaging qualification](../../../docs/agents/research/session-messaging-interfaces-20261103.md)
and recheck its live version, tool schema and caller grant. Documentation or a
visible tool does not establish permission; project profiles cannot manufacture
a trusted Gateway identity or lift a security hold.
For an existing Codex desktop collaboration agent, load the
[notification preparation contract](references/native-notification.md). It persists
one intent and prepares a fixed action; the parent still verifies the live target,
invokes the native tool and observes its receipt. Unsupported lanes use explicit
manual reporting rather than a replacement session or blind retry.

For an admitted Codex CLI worker on a parent-owned loopback app server, load the
[fixed queue-plan contract](references/codex-queue.md). It binds the executable,
exact thread UUID, endpoint and message into the intent action fingerprint. Before
execution, verify the same owned process handle/listener and current executable,
then persist attempt-start and use only its returned action. Preparation and CLI
success do not establish receipt or idle wakeup; no implicit daemon or retry is used.

When implementing an admitted native adapter with an owned subprocess, use the
[bounded process contract](references/owned-process.md). Its verified executable,
opaque child handle and finite stream/stop limits supply process observations;
they do not establish a native session receipt or permission to launch a provider.
The [Claude stream](references/claude-stream.md) and [Kiro ACP](references/kiro-acp.md)
modules require explicit owned-session admission. Their references record bounded
Windows two-turn cases and separate lifecycle/platform limits. Bind an already-held client through the
[owned input conversion](references/native-notification.md#existing-owned-client-handoff)
after persisted attempt-start; native preflight and receipt qualification remain
required. They do not attach to foreign live chats or replace manual fallback.

Before settlement, use the [scenario audit](references/scenario-audit.md) when an
evidence-backed outcome trace is available. Its consistency result checks recorded
claims and file hashes; it is not native persistence or execution proof.

## Orient and admit

Use the [technical spike decision rule](../prototype/references/technical-spikes.md)
before admitting production work with a consequential unresolved premise. Assign
the deciding observation as separate exploration when it determines admission.
Carry the evidence into the worker brief and continue independent tickets.

1. Read project guidance, glossary, ADRs, `tkt ready` and in-progress tickets.
   Check free space before creating worktrees or running checks, following
   [artifact hygiene](../../meta/repository-artifact-hygiene/SKILL.md).
   Read [models and usage](../../../docs/agents/harness-surfaces/models-and-usage.md)
   before selecting task tiers and checking headroom.
   Read and validate the project's provider policy with
   [the policy validator](../../../scripts/check-provider-fallback.mjs):
   `node <validator-path> <project>/AGENTS.md --json`.
   Absent or invalid policy means no fallback. At exhaustion checkpoint and report
   the exact limit/reset; [provider switching](../../../docs/agents/provider-switching.md)
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
   before claiming. A whole spec that must land together is outside this mode. Do not
   call restricted [implement-spec](../implement-spec/SKILL.md) or reproduce its
   procedure to bypass a refusal; ask the user to authorize that separate workflow.
4. Recheck each candidate immediately before claim against the tracker, branches,
   worktrees and open PRs. Admit only open, unblocked, unclaimed tickets with
   assertable acceptance criteria and disjoint expected file sets. Name shared
   schema/generated-file ownership and exclusive devices; uncertain overlap runs
   sequentially. Existing peer work stays with its owner.
   Cap in-flight work at the lowest of three, the live harness cap, any explicitly
   supplied budget and the number of disjoint tickets. Count reviewers in resource limits.
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
   directory is not isolation. Before acceptance, run the read-only
   [dispatch preflight](references/dispatch-preflight.md) against a packet bound
   to the registered checkout, candidate, owner, declared paths and evidence hashes;
   pass the expected base separately from the dispatch record.
   Gate secret, spend and
   destructive operations by the project's existing authorization. If a worker
   or harness handoff leaves artifacts retained, carry their retention owner,
   purpose and end condition using [artifact hygiene's lifecycle rule](../../meta/repository-artifact-hygiene/references/retention-lifecycle.md).
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
    Apply the [shared critic round budget and reassessment](../retro/references/convergence.md#critic-review-budget).
    Use the same reference to assess progress when qualification or debugging stalls.
    PASS permits landing; BLOCK returns trigger/outcome findings to the same
    worker. Route unresolved consequential decisions through escalation.
    Record nonblocking findings as tickets.
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
    End with outcome status, separate work/verification/cleanup/delivery counts and exact
    blockers. Leave the resume pointer current until every binding is settled.

## Continue and stop

After each batch, reconcile the live tracker and bindings, then continue while authorized
scoped work remains. An empty frontier is not proof of completion: classify it as
complete, dependency-blocked or intentionally deferred, and inspect for other scoped work.
When no authorized progress remains, report incomplete/blocked, the exact condition,
retained evidence and the next event that permits resumption. A user pause stops dispatch
and mutation and preserves a resumable checkpoint; cancellation ends the authorized
outcome. Usage exhaustion is a hard stop: checkpoint and report the exact limit/reset;
never retry, infer a reset, raise limits or switch providers when policy is off. Record
monitor state only after native confirmation, investigate missing monitors, and do not
recreate a possibly user-removed job. Stop owned monitors only when their purpose is
settled, obsolete or the user stops them.

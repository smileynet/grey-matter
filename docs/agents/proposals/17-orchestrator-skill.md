# Proposal 17: an `orchestrate` skill

**Status:** proposed 2026-10-31. Not yet built.

**Scope:**
- A new skill, `skills/engineering/orchestrate/`: `SKILL.md`, role briefs, and one reference per harness.
- One row each in `compass`, the engineering README and `orient`'s next-step table.
- No change to `implement` or `implement-spec`.

**Evidence:**
- [Kiro Crew orchestration](../research/kirocrew-orchestration.md): conductors and crewmates at `cbf3ecce`.
- [Harness orchestration primitives](../research/harness-orchestration-primitives.md): kiro-cli, Kiro Crew, Claude Code, Codex, agy.

Kiro Crew is prior art; grey-matter chooses what to keep.

## The need

The user's standing request for a session:

> act as the orchestrator, dispatching working agents for open, unblocked, non-overlapping tickets. Use worktrees where appropriate. Dispatch reviewer agents to check the work before accepting it and closing the ticket. Provide changelog like updates with visuals … as tickets close, and keep the dashboard up to date. Help resolve simple issues and questions that agents have, and only raise questions that are high risk or you can't resolve on your own.

`implement-spec` comes closest, but it is built for one spec landing on one integration branch. It has no:

- reviewer gate per ticket before close
- channel for worker questions
- escalation rule
- per-ticket updates to the human
- admission rule for "non-overlapping"
- per-harness mechanics

The request is a **session role** over the whole frontier, so it is a new skill rather than a mode of `implement-spec`.

## Recommendation

### 1. Name and invocation

- **Name:** `orchestrate`, in the engineering bucket.
- **User-invoked** (`disable-model-invocation: true`), like `implement` and `implement-spec`. Fanning out agents spends real money and must be asked for.
- **Description:** "Act as the session's orchestrator over the ticket frontier: dispatch workers on open, unblocked, non-overlapping tickets, gate each on an independent review, close with evidence, answer workers' questions and escalate only high-risk ones, and post an update with a visual per closed ticket."

### 2. The loop (`SKILL.md` body, harness-neutral)

1. **Orient.** Read `tkt ready`, in-progress tickets, and the dashboard path from `AGENTS.md`.
   - Write a one-line resume pointer to a state file in the main checkout's scratch directory (shared by every worktree): goal, round, in-flight tickets, open asks, next step.
   - Re-read the tracker every cycle; the pointer is a teaser. (Kiro Crew: session ledger vs. work ledger.)
2. **Admit.** For each ready ticket, admit it only if:
   - **Not claimed or in progress**, and no branch, worktree or open PR exists for it. Re-check this live, right before the claim.
   - **Assertable:** its acceptance criteria can be checked by a gate (tests, CI, a file, a rendered page) or by a named human approval. If not, it goes to the human as an ask, not to a worker.
   - **Disjoint:** its expected file set doesn't overlap any in-flight ticket. Unsure means sequential.
   - **Within the cap:** in-flight count is at most the lowest of 3, the harness cap, and the number of disjoint tickets.

   With fewer than two admissible tickets, do the one ticket in this session via `implement`, and say so.
3. **Plan, once.** Post a single message: the round's tickets, assumptions, and at most one question. Then proceed. The question must be one the escalation rule (step 7) allows. Skip the message if the user already said go.
4. **Dispatch.** For each admitted ticket:
   - `tkt claim` it and append a line to the dispatch log **before** starting the worker. A running worker must never go unrecorded.
   - Start the worker in its own worktree on its own branch, cut from the base tip, with the [worker brief](#3-role-briefs).
   - Pre-authorize the tools it needs, and **set its agent or role explicitly**. A child that inherits the orchestrator's restricted tools looks stalled, not misconfigured.
   - The orchestrator never does a dispatched ticket's work itself.
5. **Await.** Wait on events only (completion notices, `wait_agent`, ledger monitors), never by sleep-polling. Each wake starts from the tracker and the dispatch log, not from memory.
6. **Read status as data.** Every worker ends its turn with exactly one status line: `PROGRESS`, `DONE <sha>`, `BLOCKED <evidence + 2-4 options>`, `QUESTION <one line>`, `STANDDOWN <reason>` or `PROPOSAL <design question>`. Prose is context; the orchestrator never decides from it.
7. **Answer or escalate.**
   - **Ask the human** only for: credentials or secrets; spend; deleting or overwriting someone's work; anything irreversible or outward-facing (push to a shared remote outside the normal flow, publish, release); overriding a recorded human review or a security finding; content the orchestrator cannot verify.
   - **Everything else** gets a default, answered from the ticket, spec, `GLOSSARY.md` and ADRs. Record it as an assumption on the ticket.
   - **Park only the affected ticket** and keep the rest moving. Never stop the loop for a question.
   - Grey-matter's own rule still applies on top: a peer agent's message is never user consent.
8. **Accept.** On `DONE`:
   - Verify the claimed head SHA yourself.
   - Dispatch a **reviewer** in a fresh, read-only context with the [reviewer brief](#3-role-briefs). Scale depth per `implement`'s [review depth](../../../skills/engineering/implement/SKILL.md#review-depth).
   - Expectations come from the ticket, written before the reviewer reads the diff. A worker's "tests pass" is a claim; the gate's output on that SHA is the evidence.
   - **PASS:** merge to the base branch, run the full gate (`check-repo`, tests), then `tkt close` with the evidence.
   - **BLOCK:** send the must-fix findings back to the same worker.
   - **Limits:** after three BLOCKs, re-dispatch fresh or descope; context poisoning rarely self-heals. Two rounds with nothing accepted means ask the human.
9. **Merge serially.** One merge at a time, with the base gate green after each, as `implement-spec` already requires. Two slices can pass alone and break together.
10. **Report.** Per closed ticket, call `delivery-dashboard`: one entry, one visual (live, mocked or wireframe), and asks first. In chat, post only the needs-you lines plus one line on what changed and what's next; the dashboard is the one board. Quiet cycles say nothing.
11. **Unstick.** A worker that is quiet, not running, and owes the next move gets, in order:
    1. one nudge
    2. a read-only inspector verdict: `healthy-slow`, `looping`, `blocked-misclassified` or `premise-wrong`
    3. a ruling: extend, re-dispatch fresh, adjudicate or descope

    Before re-dispatching, inspect the worktree: the worker may have finished and only lost its report (`implement-spec` already says this).
12. **Close out.**
    - Close finished workers. Remove merged worktrees by content, not ancestry, and never by force. A dirty worktree is kept and flagged.
    - Never close one waiting on the human.
    - End with a tally, then hand off to `wrap-session`.

### 3. Role briefs

These are `references/` files the orchestrator fills in.

- **`worker-brief.md`.** The brief is the worker's whole contract. It names the ticket path, not pasted content, plus:
  - The **observable outcome** and the **main unresolved assumption** (from `implement`).
  - The procedure, by skill name: follow `implement`, but skip its claim (the orchestrator already claimed) and its close (the orchestrator closes after review). Not every harness matches skills to a worker's messages, so the brief names the skill.
  - A preflight: if the work is already covered → `STANDDOWN`; if the premise is disproven → `STANDDOWN` with evidence; if a design call is needed → `PROPOSAL`, not a build.
  - Its own worktree only. Never commit from the shared checkout, never `git stash`, and run targeted tests by path. If a deliberate mutation doesn't make a test fail, suspect the test is importing the wrong checkout.
  - It does not merge, close the ticket, push to `main`, or contact the human. `BLOCKED` carries evidence plus 2-4 options and stays up until a ruling arrives.
  - It ends with exactly one status line.
- **`reviewer-brief.md`:**
  - One change per clean context.
  - Write the risk list from the ticket before reading the diff.
  - Verdict is `PASS` or `BLOCK`. A BLOCK names a trigger and an observable wrong outcome.
  - Drop findings that a green gate on the exact SHA already owns. Non-blocking findings become follow-up tickets (as `code-review` already does).
  - Read-only by tools where the harness allows; by instruction otherwise.
- **`escalation.md`:** the step-7 checklist, with worked examples of "answer it yourself" vs. "ask".

### 4. Per-harness references

One file each, loaded only for the running harness. This settles ticket 95's open placement question: harness-specific steps go in a reference file, never in the portable body.

| File | Dispatch | Isolation | Wait | Must say |
|---|---|---|---|---|
| `harness-claude.md` | Agent tool (background); desktop `start_session` for user-visible sessions | `isolation: worktree` with `worktree.baseRef: "head"` when the base isn't the default branch; `.worktreeinclude` | completion notice; SendMessage to resume | parent mode overrides child; built-in `/code-review` is shadowed by ours |
| `harness-codex.md` | `spawn_agent` (agent_type `worker`); `codex exec -C <wt>` outside a session | manual `git worktree` in the CLI; app worktrees + Hand off | `wait_agent` with a timeout | cap 6, depth 1; children inherit sandbox/approvals; `codex review --base` for the reviewer |
| `harness-kiro.md` | top-level `kiro-cli chat --no-interactive --agent <a> --model <m>` per worker (pins model; native sub-agents can't) | manual `git worktree` (no flag in 2.34) | process exit / output file | `allowedTools` not inherited; V3 stricter-of-both; headless children fail fast, so trust before dispatch |
| `harness-kirocrew.md` | `work_dispatch` (or create → `session_create` with `agent` set → bind → seed) | worker makes its own from the brief's worktree pattern (no cwd param) | `monitor_start(watch="work-ledger")` | map tickets to ledger items with `pr_checks`/`file`/`human_approval` acceptance; `chat_tag` and `session_ledger_record` as guarded steps (ticket 95) |
| `harness-agy.md` | `invoke_subagent` | workspace `branch` | completion message | headless `-p` skips sub-agent questions, so workers must report `QUESTION` as status instead |

Where a harness has no real background sub-agents, the loop runs **sequentially** in-session, which is the `implement-spec` fallback. Same structure, no worktrees.

## Choices made, and alternatives rejected

- **Not a mode of `implement-spec`.** Its integration branch and "whole spec" framing don't fit a backlog in which tickets land independently. `implement-spec` stays as is. A later refactor could make it call `orchestrate`'s loop with an integration-branch target.
- **tkt is the ledger.** It needs no new store. The dispatch log, a scratch file in the main checkout, is only the in-flight binding: ticket, worker id, worktree, branch, state. Kiro Crew's lesson is "record before seed", not its MCP ledger.
- **No deterministic acceptance evaluator** in v1. The gate is the repo's tests/`check-repo` on the merged SHA plus the reviewer verdict. A `scripts/accept` helper is a possible follow-up if reviewers prove unreliable.
- **Default concurrency 3.** This follows Kiro Crew's 2-3 and keeps review and merge serial. It can be raised per session.
- **Not adopted:** nested orchestrators, depth caps, patrol budgets, context-cap numbers, board-tab mechanics. All are Kiro Crew runtime.

## Open questions for the user

1. **Landing target.** Merge each accepted ticket straight to `main` and push, which is the repo's working rhythm, or onto an integration branch the user merges?
2. **Visuals.** Is the dashboard entry enough per ticket, or should each close also post a chat update carrying the visual (an inline widget or artifact)?
3. **Reviewer for low-risk tickets.** Always a separate reviewer agent, or the orchestrator's own spec check for small reversible changes, as `implement` allows?

## Acceptance (for the build ticket)

- [ ] `skills/engineering/orchestrate/` exists with `SKILL.md`, three role briefs and five harness references, and passes `writing-for-agents` and `review-skill`.
- [ ] `compass`, the engineering README and `orient` route to it. `check-repo.mjs` and the syntax fixtures pass.
- [ ] Ticket 95's placement decision is recorded as "harness reference", citing this proposal.
- [ ] A live dry run in Claude Code over two disjoint low-priority tickets shows:
  - claim before dispatch
  - one worktree each
  - a reviewer verdict before close
  - one dashboard entry per close
  - a worker `QUESTION` answered without escalation

# Proposal 17: an `orchestrate` skill

**Status:** proposed 2026-10-31; open questions decided the same day. Validation spikes come before the build.

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
   - Pick the **landing mode** for this project ([Landing mode](#landing-mode-per-project)) and state it in the plan message.
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
   - Verify the claimed head SHA yourself, and run the gate on it.
   - Review at the depth `implement`'s [review depth](../../../skills/engineering/implement/SKILL.md#review-depth) calls for:
     - **Small, reversible change:** the orchestrator's own spec check is enough. List what each acceptance criterion requires, then check the diff against that list.
     - **Consequential change:** dispatch a **reviewer** in a fresh, read-only context with the [reviewer brief](#3-role-briefs), running `code-review`.
   - Either way, expectations come from the ticket and are written before reading the diff. A worker's "tests pass" is a claim; the gate's output on that SHA is the evidence.
   - **PASS:** land it per the project's landing mode, run the full gate on the base branch, then `tkt close` with the evidence.
   - **BLOCK:** send the must-fix findings back to the same worker.
   - **Limits:** after three BLOCKs, re-dispatch fresh or descope; context poisoning rarely self-heals. Two rounds with nothing accepted means ask the human.
9. **Merge serially.** One merge at a time, with the base gate green after each, as `implement-spec` already requires. Two slices can pass alone and break together.
10. **Report.** Per closed ticket:
    - Call `delivery-dashboard`: one entry with one visual (live, mocked or wireframe), asks first.
    - Post a **changelog-style chat update** with the same visual, rendered the way the harness can show it (see the per-harness references). Lead with the needs-you lines, then what the person can now do, then what's next, with a link to the dashboard.
    - The dashboard stays the one board, so the chat update never carries a ticket table.
    - Quiet cycles say nothing.
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
  - It does not merge, land, close the ticket, or contact the human. In PR mode it may push its own branch and open the PR. `BLOCKED` carries evidence plus 2-4 options and stays up until a ruling arrives.
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
- **No deterministic acceptance evaluator** in v1. The gate is the repo's tests/`check-repo` on the merged SHA plus the spec check or reviewer verdict. A `scripts/accept` helper is a possible follow-up if reviewers prove unreliable.
- **Default concurrency 3.** This follows Kiro Crew's 2-3 and keeps review and merge serial. It can be raised per session.
- **Not adopted:** nested orchestrators, depth caps, patrol budgets, context-cap numbers, board-tab mechanics. All are Kiro Crew runtime.

## Landing mode, per project

Landing depends on the project, so the skill picks one mode at orient and records it as an assumption in the plan message. Small projects merge to `main`; larger projects use branches.

**What the history shows** (local repos with `.tickets/`, read 2026-10-31):

- **Solo, sequential work commits straight to `main`, with no merges.** Examples: grey-matter (597 commits, 0 merges), godot-helper (631, 0), teach-me (1,170, 0), tagalog-helper (245, 0).
- **Parallel workers used one short-lived branch per ticket, merged locally into `main`, with no PR.** Examples:
  - overseer and ebb-analyzer: `tkt/NN-slug`
  - herdr-flock: `tkt-NNN-slug`
  - oni-slicer and titanops-slicer: `merge(sr): land ticket NN (worker …)`
  - tkt: 2 merges
- **Only shepherdr merged through numbered PRs** (`Merge #99: …`, 55 merges). grey-matter's only PRs are two closed Dependabot bumps.

**Modes:**

| Mode | When | How a ticket lands |
|---|---|---|
| **Trunk** (default) | Solo or small project, no PR history, `AGENTS.md` says commit and push to `main` | **Sequential:** the worker commits on `main`. **Parallel:** the worker commits on `tkt/NN-slug` in its own worktree. After review, the orchestrator merges into `main` (`merge: ticket NN`), runs the gate, and pushes. |
| **Branch / PR** | Larger project: several active authors, a protected `main`, a PR merge history, or `AGENTS.md`/`CONTRIBUTING` says so | The worker pushes `tkt/NN-slug` and opens a PR. The orchestrator reviews it, and merges if the repo lets it. A required human review is a [step-7](#2-the-loop-skillmd-body-harness-neutral) ask. |
| **Integration branch** | A whole spec or epic that must land together | Hand off to `implement-spec`. |

**How to detect the mode,** first match wins:

1. An explicit rule in `AGENTS.md` or `CONTRIBUTING`.
2. Branch protection on the base branch (`gh api repos/<o>/<r>/branches/<base>/protection`).
3. PR-merge subjects in the last 100 commits, and the number of distinct authors in the last 90 days.
4. Otherwise, trunk.

## Decisions (user, 2026-10-31)

1. **Landing:** contextual per project. Small projects merge to `main`; larger ones use branches. The history check above backs this, and [Landing mode](#landing-mode-per-project) is the rule.
2. **Visuals:** a dashboard entry **and** a chat update with the visual for each closed ticket (step 10).
3. **Review:** the orchestrator's own spec check is enough for small, reversible changes. A reviewer agent runs only for consequential ones (step 8).

## Validation spikes

These are capability probes, one per harness, to run **before** the skill is written. They test the harness, not the skill: can it do what the loop needs, and with which native mechanism? Each spike's results become that harness's reference file and update [harness-orchestration-primitives](../research/harness-orchestration-primitives.md). A capability that fails sends the loop to its sequential fallback for that harness, and the reference says so.

### Shared fixture (spike 0)

A disposable sandbox repo, made by a script and kept outside grey-matter. It has `tkt init`, a `npm test` suite of a few seconds, a dashboard copied from the `delivery-dashboard` template, and five tickets:

| Ticket | Shape | Expected handling |
|---|---|---|
| T1 | Add `a.js`, with a test | Admitted |
| T2 | Add `b.js`, with a test. One requirement is deliberately ambiguous (a name to take "from the glossary", and no glossary exists) | Admitted; the worker sends `QUESTION` and the orchestrator answers it |
| T3 | Edit `a.js` | Held: overlaps T1 |
| T4 | Blocked by T1 | Admitted only after T1 lands |
| T5 | Delete `README.md` | Admitted; the worker's deletion triggers an escalation |

It runs in two variants: trunk mode with no remote, and branch/PR mode with a throwaway private GitHub repo. The user approves creating that repo first.

### Probes, run in every spike

| # | Probe | Pass when |
|---|---|---|
| P1 | **Dispatch** two workers at once from inside a session, headless-safe | Both run concurrently; the mechanism is recorded |
| P2 | **Isolation**: each worker in its own worktree, cut from the base tip | Each sees only its own changes; a deliberate mutation makes its test fail (not the wrong checkout's) |
| P3 | **Approvals**: with pre-authorization set, then without | With it: no prompt, the run completes. Without it: whether the worker stalls, fails or bubbles a prompt up is recorded |
| P4 | **Status line** reaches the orchestrator | `DONE <sha>` arrives verbatim and the SHA exists |
| P5 | **Question round-trip** (T2) | The orchestrator answers and the same worker resumes with its context. If it can't, re-dispatching with the answer is the fallback, and the spike records which happened |
| P6 | **Await** without polling | The orchestrator idles until an event arrives; no sleep loop appears in its transcript |
| P7 | **Read-only reviewer** | A write the reviewer attempts is refused by its tools, or the spike records that only instruction stops it |
| P8 | **Model and effort per child** | The worker runs on the cheaper model asked for |
| P9 | **Cap**: dispatch past the harness cap | Whether extra workers queue, are refused, or exceed the cap silently is recorded |
| P10 | **Landing** in both modes | Trunk: a local merge into `main` with the gate green. PR: a PR opened and merged |
| P11 | **Chat visual** | The closing update shows the visual in this harness's surface (inline image, widget, artifact, or a path/link in a terminal), and the dashboard entry exists |
| P12 | **Cleanup** | Merged worktrees and branches are removed, and nothing is left locked or orphaned |
| P13 | **Escalation** (T5) | Only T5 reaches the human; T1, T2 and T4 keep moving |

### Harness-specific questions

- **Claude Code** (CLI and desktop):
  - Agent tool with `isolation: worktree`, vs. `claude --bg`, vs. desktop `start_session`. Which suits workers, and which suits user-visible sessions?
  - Does `worktree.baseRef: "head"` hold?
  - Does `SendMessage` resume a finished worker for P5?
  - Does a parent in auto mode override a reviewer pinned to read-only?
  - Do sub-agents load a skill the brief names?
  - P11 on desktop (widget or artifact) vs. the terminal CLI.
- **Codex:**
  - `spawn_agent` inside `codex exec`, versus top-level `codex exec -C <worktree>` per worker.
  - Which sandbox and approval setting lets children write their worktree without the full bypass flag?
  - `wait_agent` timeouts; the cap of 6 and depth of 1.
  - `codex review --base` as the reviewer for a consequential change.
  - Rendering in the app vs. the CLI.
- **kiro-cli:**
  - The native `subagent` tool vs. background `kiro-cli chat --no-interactive --agent <a> --model <m>` processes. Can the orchestrator start a process and await its exit without polling?
  - V3's stricter-of-both rule, and `trustedAgents`.
  - A terminal-only P11.
- **Kiro Crew:**
  - `work_dispatch` with tickets mapped to items (`file` / `pr_checks` acceptance). Does the worker make its own worktree from the brief?
  - `monitor_start` wakes.
  - The conductor has no `fs_write` and its shell is not auto-approved. So who runs `tkt close` and edits the dashboard: a worker, or an approved shell?
  - `chat_tag` and `session_ledger_record` as guarded steps (ticket 95).
  - The Board tab vs. our dashboard: one board, which one?
- **Antigravity (agy):**
  - `invoke_subagent` with the `branch` workspace.
  - The sub-agent question picker interactively vs. headless `-p`, where questions are skipped and P5 must go through the status line.
  - The Auto-mode reviewer vs. our reviewer.

Gemini CLI and Cursor are out of scope until installed.

### Running and cost

- **Order:** spike 0 first. Then Claude Code and kiro-cli (the primary harness), then Codex, Kiro Crew and agy. The spikes are independent of each other once the fixture exists.
- **Cost:** workers use each harness's cheapest capable model, and each spike is one fixture run per mode.
- **Results:** a dated section per harness in the primitives note: each probe's outcome (pass, fail, or not possible here) with the transcript excerpt or command output that shows it.
- **Cleanup:** remove the sandbox repos after the spike; the GitHub repo only with the user's go-ahead.

## Acceptance (for the build ticket)

- [ ] `skills/engineering/orchestrate/` exists with `SKILL.md`, three role briefs and five harness references, and passes `writing-for-agents` and `review-skill`.
- [ ] `compass`, the engineering README and `orient` route to it. `check-repo.mjs` and the syntax fixtures pass.
- [ ] Ticket 95's placement decision is recorded as "harness reference", citing this proposal.
- [ ] Each harness reference is written from its spike's results. A probe that failed names the fallback the loop uses there.
- [ ] A live dry run on the spike fixture, in Claude Code and kiro-cli, shows:
  - claim before dispatch
  - one worktree each
  - a spec check, or a reviewer verdict, before close
  - one dashboard entry and one chat update with a visual per close
  - the T2 `QUESTION` answered without escalation
  - only T5 escalated

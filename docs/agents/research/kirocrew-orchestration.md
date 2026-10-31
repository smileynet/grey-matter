# Kiro Crew orchestration: conductors and crewmates

**Question:** what can a harness-portable orchestrator skill learn from Kiro Crew's conductor and crewmate agents? The skill has one session pick open, unblocked, non-overlapping tickets, dispatch workers and reviewers, accept and close the work, and keep the human informed.

**Source:** `.references/kirocrew` (github.com/kirodotdev/KiroCrew, Apache-2.0), shallow clone at `cbf3ecce`, 2026-10-31. Agent configs installed locally in `~/.kiro/agents/kirocrew-*.json`. Paths below are relative to `src/kiro_crew/` unless they start with `docs/`.

**Status:** prior art, not authority. Every rule below is a candidate for grey-matter to accept or reject.

**Version mismatch:** the installed `kirocrew-conductor.json` is older than repo HEAD. Its prompt lacks the `work_dispatch` paragraph that `agent_parts/spec_prompts.py:84-88` contains. Read the repo for current behavior.

**Method:** two research subagents read the material. Every quoted snippet below was then re-read at the cited line by the session that wrote this note. Confidence markers:

| Marker | Meaning |
|---|---|
| **H** | Verbatim, re-checked at the cited line |
| **M** | Reported by a subagent with a line citation, not re-checked |
| **I** | Inferred |

## Where things live

- **System prompts.** These are Python strings in `agent_parts/spec_prompts.py`: conductor (61-365), work-ledger protocol (423-445), pipeline conductor (448-539), worker (542-599), security conductor (602-698).
- **Operating procedures.** These are builtin skills: `builtin_skills/goal-conductor/SKILL.md`, `pipeline-conductor/SKILL.md`, `security-conductor/SKILL.md` and `sage-review/SKILL.md`. `goal-ledger-conductor` is a deprecated alias.
- **Ledger server.** `mcp_work.py`. The dispatch wrapper is in `mcp_dashboard_session_tools.py:686-747`.
- **Decisions and RFCs.** `docs/decisions/`, `docs/request-for-change/rfc-conductor-*.md`, `docs/reference/ledger-conductor-sequence.md`.

## Vocabulary

| Kiro Crew term | Meaning | Closest grey-matter term |
|---|---|---|
| **conductor** | Owns one goal. Plans, dispatches, verifies, decides the next round. "Never does the work." | orchestrator |
| **worker** (crew member) | A session that owns exactly one item and reports as data | worker / implementer subagent |
| **Mate** (code: `crewmate`) | The user's standing teammate: a conductor agent plus a worker agent (`docs/decisions/2026-10-15-the-standing-teammate-agent-is-called-a-mate.md`) | (none) |
| **item** | One unit in the work ledger, with an acceptance bar | ticket |
| **work ledger** | Item store. The conductor writes some fields, the worker others, and the server derives the rest | tkt plus the orchestrator's dispatch log |
| **session ledger** | The conductor's own resume pointer: `goal`, `phase`, `next`, `tried` | handoff note |
| **patrol** | The conductor's wake loop, triggered by worker reports | the orchestrator's wait/monitor loop |
| **round** | One batch of dispatches, from the go-ahead to a round report | frontier pass |
| **acceptance evaluator** | A deterministic checker over a closed set of condition kinds | reviewer gate plus `tkt close` checks |

## Findings

### 1. The orchestrator never does an item's work (H)

- **Source:** `agent_parts/spec_prompts.py:78-80`. "Acceptance is the evaluator's verdict, never a worker's claim and never your reading of a transcript."
- **Tooling.** The goal conductor has no file-writing tool, and its shell is used only for its scripts.
- **Enforcement varies.** The mate conductor keeps its shell and file writers, so there the rule is carried by the prompt alone. A prompt rule is weighed by the model, not guaranteed (`docs/request-for-change/rfc-mate-owned-agent-config.md:239-248`, M).
- **Small goals.** With fewer than two qualifying items, the conductor does the work itself (`builtin_skills/goal-conductor/SKILL.md:78-79`, H): "Fewer than two qualifying candidates means the goal does not need you."

### 2. An item qualifies only if it is independent, assertable and long-running (H)

- **Source:** `goal-conductor/SKILL.md:56-77`.
- **Assertable** means the completion condition can be named before dispatch, as one of `pr_checks`, `pr_merged`, `file` or `human_approval`.
- "There is deliberately no 'run this command' kind." CI's verdict on the PR is the one that counts.
- An item whose completion cannot be stated as one of these is treated as needs-human, rather than inventing a condition.

### 3. "Done" is a claim; acceptance is a separate verdict (H)

- **Evaluate only items reporting `done`** (`goal-conductor/SKILL.md:431-443`). A world-state check passes early on a stub file or a PR that went green before its last commit, and "Evaluating that item returns a genuine `pass` on unfinished work."
- **Two-phase acceptance** (`:473-485`). "The worker's claimed `pr` is never read as the bar." The conductor promotes it after looking at it. Otherwise a worker "could point it at anybody's already-green pull request".
- **Verify the green independently** (`pipeline-conductor/SKILL.md:1227-1236`, H). "Never trust a worker's GREEN (workers believe their own summaries)." Check runs on the claimed head SHA, newest run per lane. "a green on yesterday's head is not green."
- **Retry limits.** Three acceptance failures close the item `rejected`. Two rounds in a row with nothing accepted means ask the user (`goal-conductor/SKILL.md:536-567, 666-668`, M).

### 4. Record the dispatch before starting the worker (H)

- **Source:** `goal-conductor/SKILL.md:243-249`. "an unbound running worker is neither visible nor recoverable."
- **Order:** create the item, then the session, then bind, then seed.

### 5. The brief is the worker's whole contract (M)

- **Source:** `goal-conductor/SKILL.md:211-241`. The seed names the observable outcome or invariant and nearby inputs to test.
- **Optional break attempt.** The seed may ask for a fresh subagent that sees the change but not the worker's reasoning, to try once to break it.
- **Name the procedure.** Workers get no per-message skill matching, so a seed that wants a procedure followed must name it (`:218-223`; `docs/architecture/context-management.md:589-605`).
- **Set the worker's agent explicitly** (`:272-278`, H). A child left on the default inherits the conductor's agent and cannot write files, so "the item would look stalled rather than misconfigured". Every harness has an equivalent: a child spawned with the parent's restricted tools or approvals.

### 6. The pipeline worker brief closes known failure modes clause by clause (M; selected clauses H)

Source: `pipeline-conductor/SKILL.md:847-1024`. The brief says "keep every clause — each one closes a failure mode." Its clauses:

- **Own exactly one item, and never contact the human directly.** The conductor reports.
- **Preflight against overlapping open PRs, branches and worktrees.** If the work is already covered, report `STANDDOWN: <reason>`, and never adopt another session's work in progress. A disproven premise also means STANDDOWN. A design decision means `PROPOSAL:`, without building it.
- **Use one worktree and branch per worker.** Run targeted tests by path.
- **Never commit from the shared checkout** (`:905-914`, H): "one `git commit -a` there … sweeps that staged work into your PR."
- **Never `git stash`.** All worktrees share one stash list.
- **Do not merge, and do not arm auto-merge.**
- **Start every turn with exactly one status prefix:** `WORKING`, `PR`, `GREEN`, `BLOCKED`, `STANDDOWN` or `PROPOSAL`. A `BLOCKED` carries evidence plus 2-4 options and stays until a ruling arrives.
- **"If a mutation does not redden, suspect the harness"** (`:891-904`, H). This catches tests that import the shared checkout instead of the worktree.

### 7. Status is structured data, not transcript (H)

- **The status set** is `progress`, `done`, `blocked` and `question`. "`blocked` and `question` differ by WHO must act" (`spec_prompts.py:557-560`).
- **Only `blocked`, `question` and `done` wake the conductor** (`:569-577`). "A turn of yours that ends having reported nothing wakes nobody."
- **Staleness flags** (`stale`, `orphaned`) are "the backstop for a worker that died, not a signal to lean on."
- **The summary is capped prose for context.** "A conductor that decides from prose is misbehaving" (`goal-conductor/SKILL.md:832-836`, M).
- **One instruction channel.** The `decision` field is the only instruction a worker takes from the conductor.
- **A person outranks the conductor.** A person steering a worker outranks the conductor, but a steer never moves the acceptance bar (`:399-407`, M).

### 8. Escalation follows a checklist, not mood (H)

The needs-human checklist (`goal-conductor/SKILL.md:676-698`):

1. Credentials, spend, deleting or overwriting someone's work, or anything irreversible never takes a default.
2. Anything else gets a default, recorded as an assumption.
3. Park only the affected item.
4. "The loop is never stopped for a question."

The checklist names both failure modes: "Guessing on a risky choice is the failure; stopping the whole patrol for one question is a failure too."

- **Pipeline conductor** (`pipeline-conductor/SKILL.md:67-87`, H). "Escalating is not the safe option". Four classes go to the human, and only these four: dismissing a human's recorded review, overriding a security-class finding, a disagreement between two maintainers, and content the conductor cannot verify.
- **Round 0.** "Decide, do not ask" (`goal-conductor/SKILL.md:159-166`, H). Put the plan with its Assumptions in one message, with at most one question folded in.

### 9. Overlap avoidance is admission control (M)

From `pipeline-conductor/SKILL.md:488-539, 743-746, 825-845` and `goal-conductor/SKILL.md:175-181`:

- Respect existing claims and assignees.
- Check for collisions: no open PR, merged PR, matching branch or worktree.
- Re-check each item live right before claiming it; a batch snapshot is never the authority.
- Claim atomically, and unclaim if any later step fails.
- Split large changes by exclusive file ownership, with a merge order.
- Keep concurrency at 2-3. The goal ledger enforces a hard cap of 6 open items.
- "Two owners politely yielding to each other is a deadlock" (`:1270-1272`). Decide ownership once.

### 10. Stuck workers get an intervention ladder (M)

Source: `pipeline-conductor/SKILL.md:1243-1272`. The rungs, in order:

1. Nudge.
2. A read-only inspector subagent returns one verdict: `healthy-slow`, `looping`, `blocked-misclassified` or `premise-wrong`.
3. Rule on the case: extend, re-dispatch fresh, adjudicate or descope.
4. Reclaim on an SLA breach.

"context poisoning rarely self-heals", so prefer a fresh re-dispatch over repeated nudges. After an outage, sweep the whole fleet, because the conductor "cannot detect its own loop's death".

### 11. Reviewers judge one change in a clean context, and only must-fix findings gate (M)

- **Code Review Sage** (`builtin_skills/sage-review/SKILL.md:12, 372-422`):
  - One isolated session per pull request, "never batch in your head".
  - A self-critique pass drops findings that an observable green gate already owns on the exact SHA.
  - The ship decision keys only on 🔴 must-fix findings.
- **Worker debate** (`goal-conductor/references/worker-debate.md:56-146`). Critics write their risk list *before* reading proposals, keep stable objection ids, and stop after at most 3 rounds, then a human rules.
- **The repo's accepted review RFC** (`docs/request-for-change/rfc-review-loop-and-escaped-bug-reduction.md:42-69`):
  - The gate is PASS or BLOCK only, and a BLOCK names a trigger and an observable wrong outcome.
  - Its evidence: 71.3% of risks that were set aside and later shipped as bugs had been advisory labels.

### 12. Context and state survive resets because the tracker holds them (M)

- **Two separate stores** (`goal-conductor/SKILL.md:707-751`). The work ledger holds items. The session ledger holds only `goal`, `phase`, `next` and `tried`. The injected snapshot is a teaser, so re-read the ledger every cycle.
- **Reset only at a round close** (`docs/request-for-change/rfc-conductor-round-reset.md:17-62`): never with a question pending, never mid-round, never after a failed ledger write. Compaction was rejected because the summary "still grows".
- **Prompt rules don't bound context.** "a prompt rule cannot bound the conductor's context" (`docs/request-for-change/rfc-conductor-rolling-reset.md:17-19`). The gateway enforces a cap instead (`dashboard/chat_turn/context_cap.py`). That RFC's frontmatter still says draft, but the cap is in the code.

### 13. Human surface: needs-you first, real counts, one board (M)

- **One board** (`docs/decisions/2026-10-10-conductor-board-tab-replaces-the-in-chat-board.md`). When a board tab exists, chat carries only "Needs you" lines plus one line on what changed and what's next. It never carries a second board.
- **No invented progress** (`spec_prompts.py:283-316`): "Needs you" first, real states only, "never a made-up percentage".
- **Derived numbers** (`:399-405`): "Read every number from a fold. Never type one."
- **Silence is a valid report.** "Say nothing unless there is a real signal" (`goal-conductor/SKILL.md:512-515`).

### 14. Close-out (M)

Source: `goal-conductor/SKILL.md:490-505, 700-705`; `pipeline-conductor/SKILL.md:1559-1611`.

- Close each finished worker in the same cycle.
- Never close one that is waiting on a person or driving an unmerged PR.
- Clean up worktrees without forcing; keep a dirty one and flag it.
- End with a final tally.

## Kiro Crew-specific: do not transfer as written

These are tied to Kiro Crew's own runtime:

- The `work_*` and `session_*` MCP tools, `work_dispatch` and `select_crew`.
- `monitor_start(watch="work-ledger")`, the patrol budget numbers (300-900 s) and `reset_conversation`.
- The context-cap token numbers and the session-ledger size caps.
- The Dashboard tab, `dashboard_write`, Ultra Mode labels, `[OPTIONS: …]` lines and `nothing_to_do`.
- `chat_tag` and its grants store. Ticket 95 tracks guarded use of `chat_tag` and `session_ledger_record` under Kiro Crew.
- The depth cap of 2 and nested conductors. The principle (bound nesting) transfers; the number is Kiro Crew's.
- Remote dispatch and folder scope, which are draft RFCs that haven't been built.

## RFC status (as of `cbf3ecce`)

| Status | RFCs |
|---|---|
| Shipped | Work ledger phases 1-4; round reset; approval hold; default patrol phase 1; context cap (in code) |
| Partial | Agent self-tagging (`chat_tag` v1); append-only ledger (only `crew/dispatch` and `crew/report` ship); item-total notice (#22417 open) |
| Draft, not built | Patrol session, folder scope, remote dispatch, sibling visibility, worker-to-worker messaging |
| Superseded | Rolling reset |

## Couldn't verify

- **The built-in `report` tool.** It appears in the conductor's `allowedTools` next to `session`, but what it does was not traced (`agent_materialization/conductor_agents.py:55`).
- **Not read in depth:** `rfc-worker-context-cap.md`, the `team-lead` skill, and the crew-log `envelope.md` and `errors.md` references.

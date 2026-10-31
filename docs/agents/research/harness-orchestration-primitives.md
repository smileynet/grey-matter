# Harness orchestration primitives

**Question:** how does each target harness dispatch sub-agents, isolate them, exchange messages, handle approvals, wait for results and review work? This note feeds the orchestrator skill's per-harness references ([proposal 17](../proposals/17-orchestrator-skill.md)).

**Gathered:** 2026-10-31.

**Local versions:**

| Harness | Version on this machine | Note |
|---|---|---|
| kiro-cli | 2.34.0 | |
| codex-cli | 0.139.0 | Lags the 0.163 cited in `harnesses.md` |
| Claude Code | 2.1.316 | |
| agy | 1.4.10 | |

Gemini CLI and Cursor are not installed.

**Markers:**

| Marker | Meaning |
|---|---|
| **V** | Verified locally (`--help`, local config, the local kirocrew clone) |
| **D** | Documented in primary docs or open-source code |
| **I** | Inferred |

The harness facts that grey-matter already holds live in [`../harnesses.md`](../harnesses.md); this note covers only orchestration.

## Cross-harness table

| | kiro-cli (native) | Kiro Crew | Claude Code | Codex | agy |
|---|---|---|---|---|---|
| **Dispatch** | `subagent` tool; `/spawn`; or a separate `kiro-cli chat --no-interactive --agent X --model M` | `work_dispatch` (or `session_create`, then bind, then `session_send`); `spawn_run` for side tasks only | Agent tool; `claude --bg`; agent teams (experimental); desktop `start_session` | `spawn_agent`; `codex exec -C`; `codex cloud exec` (experimental) | `invoke_subagent`; `define_subagent` |
| **Isolation** | Manual `git worktree` (no flag in 2.34, V) | Manual; the worker contract carries a `worktree_pattern` | `isolation: worktree`, `claude -w` | Worktrees managed by the app; manual in the CLI | Workspace `branch` (a worktree) |
| **Messaging** | Result only | Ledger `work_report` and `decision`; `session_send` | `SendMessage` to a sub-agent, teammate or session | `send_input` (v1), `send_message` (v2) | `send_message`; agents can read each other's transcripts |
| **Ask the parent** | None documented | `work_report status=question` | Message the lead; the user is reached through the main UI | Final message (I) | "has a question" picker (interactive only) |
| **Approvals** | The child's own config. V3: the stricter of parent and child wins. Headless runs fail fast | Autopilot is inherited; headless calls are otherwise denied | Prompts bubble to the main session; the parent's mode overrides the child's | The child inherits the parent's sandbox and approvals; headless runs fail | Inherited; prompts bubble up |
| **Wait** | Blocks until all children finish | `monitor_start(watch="work-ledger")` | Background completion notice; `notify_when_idle` | `wait_agent(timeout_ms)` | Completion message |
| **Limits** | None documented (an older page said 4; stale) | Sized from host memory; 3 h and 1000 tool calls per sub-agent | 20 concurrent, depth 3 | 6 threads, depth 1 (source defaults) | Depth 10 |
| **Model per child** | No; use top-level `--model` | `session_create.model` | Yes | Yes | `flash`, `pro` or `inherit` |
| **Native review** | Graph review loops | `accept_eval.py` | `/code-review`, `/security-review`, `TaskCompleted` hook | `codex review --base`, `/review` | Auto-mode command reviewer |

## Per-harness notes

### kiro-cli

- **Sub-agents and tool lists** (D: kiro.dev/docs/custom-agents/subagents/). Sub-agents share steering, MCP servers, workspace files and permissions config, but each keeps its own history.
  - `@builtin` and `*` include the sub-agent tool in V3.
  - An unknown agent name fails; it does not fall back to the default agent.
- **Approvals: the main stall risk.**
  - In 2.x they are set by `toolsSettings.subagent.availableAgents` and `trustedAgents`.
  - In V3 those settings are ignored: both policies are checked and the stricter wins. A call the parent has no rule for prompts even when the child allows it.
  - Sub-agents don't inherit the parent's `allowedTools` (already in `harnesses.md`).
  - A non-interactive sub-agent cannot prompt, so it fails fast.
- **Worktrees.** None in 2.34 (V). Create one with `git worktree add`, then start the worker inside it.
- **Model per worker.** A model can't be pinned per sub-agent. Run a top-level `kiro-cli chat --no-interactive --agent <a> --model <m>` per worker instead (V, `--help`).

### Kiro Crew

Kiro Crew is an MCP layer over kiro-cli. Full detail is in [kirocrew-orchestration.md](./kirocrew-orchestration.md).

- **Dispatch.**
  - `session_create` takes `title`, `agent`, `agent_kind`, `folder`, `model` and `reasoning_effort`. It has **no cwd or worktree parameter** (V, source); the worker makes its own worktree from the contract's `worktree_pattern`.
  - `spawn_run` and `spawn_sub_agents` exist, but the conductor prompts forbid them for work items.
- **Approvals.** Children inherit the session's autopilot setting (D: kiro.dev/docs/crew/features/subagents/).
- **Native terms:** conductor, work item, work ledger, worker session, seed, bind, patrol, acceptance.

### Claude Code

Sources: code.claude.com/docs/en/sub-agents, /worktrees, /agent-teams, /commands (all D).

- **Sub-agent definitions.** `.claude/agents/*.md` frontmatter supports:
  - `tools` and `disallowedTools`
  - `model`, `effort` and `maxTurns`
  - `permissionMode`
  - `background`
  - `isolation: worktree`
  - `skills`
- **Background by default.** Spawned sub-agents start in the background. `SendMessage` to the agent's ID resumes it with its context.
- **Worktree base.** `isolation: worktree` branches from `origin/<default>` when a remote exists, falls back to the local `HEAD` without one, and uses `HEAD` when `worktree.baseRef: "head"` is set (V: [spike results](#spike-results-claude-code-2026-10-31)).
  - `.worktreeinclude` copies gitignored files.
  - A worktree with no changes is removed; one with changes is kept until the cleanup sweep.
  - Isolation blocks edits and git commands aimed at the main checkout, but not `cp` or shell redirects.
- **Approvals.** A background sub-agent's prompts surface in the main session (D); in headless `-p` they cannot, and an unlisted call is denied at once (V, spike). A parent in `bypassPermissions`, `acceptEdits` or auto mode overrides the child's `permissionMode`.
- **Teams** (experimental, interactive only). Teammates inherit the lead's mode, are not worktree-isolated, and message each other through file mailboxes.
- **The desktop app** adds side sessions (`start_session`) the user can open and steer. A message from another agent is never user consent.
- **Review.** `/code-review`, `/security-review` and `/simplify` are built in. grey-matter's `code-review` skill shadows the built-in one (`harnesses.md`).
- **Native terms:** sub-agent, Agent tool, background, `isolation: worktree`, SendMessage, teammate, agent view.

### Codex

- **Multi-agent v1 is stable and on** (V: `codex features list` shows `multi_agent stable true` and `multi_agent_v2 under development false`).
  - v1 tools: `spawn_agent` (`message`, `agent_type`, `fork_context`, `model`), `send_input`, `wait_agent`, `close_agent`.
  - v2 renames some of these and adds `list_agents` (D: `codex-rs/core/src/tools/handlers/multi_agents_spec.rs`).
- **Custom agents.** TOML files in `~/.codex/agents/` or `.codex/agents/`. The built-in agents are `default`, `worker` and `explorer`.
- **Limits** (D: `codex-rs/core/src/config/mod.rs`): `agents.max_concurrent_threads_per_session` defaults to 6, and `agents.max_depth` defaults to 1.
- **Approvals.** Children inherit the parent turn's sandbox and approval settings, and an agent file cannot override them. Headless runs fail the action and report it. `codex exec` needs the bypass flag or it hangs (`harnesses.md`).
- **Worktrees.** The desktop app manages worktrees (detached HEAD, `codex/` branches, Hand off, 15 kept by default). In the CLI, use `git worktree` plus `-C`.
- **Review.** `codex review --base <b>` / `--uncommitted` / `--commit <sha>`, and `codex exec review` (V, `--help`).
- **Native terms:** subagent, agent thread, `spawn_agent`, `wait_agent`, custom agent, worktree, Hand off.

### Antigravity (agy) and Gemini CLI

- **agy tools.** `invoke_subagent`, `send_message`, `manage_subagents` and `define_subagent` (V: agy changelog; D: antigravity.google/docs/subagents).
- **agy workspaces.** The `branch` workspace is an isolated git worktree. What `share` does is unclear.
- **agy messaging.** A sub-agent is asynchronous: it sends its result to the parent, then goes idle; a message wakes it.
- **agy questions.** A sub-agent's question appears to the user as "has a question", but headless `-p` runs skip it.
- **agy approvals.** Inherited and bubbled up.
- **Gemini CLI** (D: geminicli.com/docs/core/subagents, updated 2026-06-08). Sub-agents can't call other sub-agents. `--worktree` is experimental and never auto-removed. The CLI may be superseded by agy for some users.

## Spike results: Claude Code (2026-10-31)

Ticket 125. Claude Code 2.1.316 on Windows 11, headless `claude -p --output-format stream-json --verbose` runs from inside the spike fixture (`scripts/spike-orchestrate-fixture.mjs`), plus in-session probes from the desktop app. Orchestrator Sonnet, workers and reviewer Haiku. Every claim below is **V** (observed in a run transcript) unless marked. Total spend across all runs was about 1.65 USD.

| # | Probe | Result | Evidence |
|---|---|---|---|
| P1 | Dispatch | **Pass.** The Agent tool starts three workers in one turn; they run concurrently. | Loop run: three `task_started` events before any completes. |
| P2 | Isolation | **Pass**, with a base rule (below). Each worker gets `.claude/worktrees/agent-<id>` on branch `worktree-agent-<id>`. | `git worktree list` during the runs. |
| P3 | Approvals | **Pass with pre-authorization; fails fast without.** A child inherits the parent's `--allowedTools`. A background child cannot prompt, so an unlisted call is denied at once (`decision_reason_type: asyncAgent`) and the worker reports BLOCKED; it never stalls. Read-only commands (`git log`) run without any rule. | Write probe with and without `--allowedTools Write "Bash(git *)"`. |
| P4 | Status line | **Pass.** `DONE <sha>` arrives in the hand-back and the SHA exists. A worker sometimes wraps the line in prose, so match the last status-shaped line, not the whole message. | Write probe: `DONE bcd1a15…`; in-session worker wrapped its QUESTION in a sentence. |
| P5 | Question round-trip | **Partial.** `SendMessage` to a finished worker resumes it with its context (in session: it recalled a codeword; headless: `resumedAgentId` returned). **But a worker that stops to ask has no changes yet, so its worktree is removed when it ends, and the resumed worker has no checkout.** Fallback: re-dispatch a fresh worker with `ANSWER:` in its brief. | Loop run 1, ticket 2. |
| P6 | Await | **Pass.** Agents start in the background by default; the parent ends its turn and is woken by `task_notification`. Headless `-p` stays alive until background work finishes, emitting one `result` per wake. No sleep or poll appears. | All runs. |
| P7 | Read-only reviewer | **Pass in `default` and `auto` parent modes.** An `--agents` reviewer with `tools: [Read, Grep, Glob]` simply has no write or shell tool; no file leaked. `bypassPermissions` was **not run**: the sandbox classifier refused launching a bypass-mode parent with `Bash(*)` as unsafe agent creation. | Reviewer probe, two modes. |
| P8 | Model per child | **Pass.** `modelUsage` in the result records `claude-sonnet-5-5` for the parent and `claude-haiku-5-5` for children asked for `model: "haiku"`. | Every run's result line. |
| P9 | Cap | **No cap hit at 22.** 22 parallel Agent calls were all accepted and all completed; none refused or queued visibly. The agents were too short to measure real concurrency. | Cap probe. |
| P10 | Landing (trunk) | **Pass.** Run 2 merged tickets 1-4 with `git merge --no-ff <sha>` in dependency order, ran `npm test` green after each merge, closed each with `tkt close`, and the final state was `main` only with 4 of 4 tests passing; ticket 3 was cut from `main` after ticket 1 landed. The harness names branches `worktree-agent-<id>`, not `tkt/NN-slug`, so the orchestrator merges by SHA. | Run 2 transcript; independent `git log --graph`, `tkt query`, `npm test` afterwards. |
| P10 | Landing (PR) | **Not run.** Needs the throwaway GitHub repo, which waits on the user's approval. | |
| P11 | Chat visual | **Pass in both surfaces, with a dashboard gap.** Headless, the closing update is markdown with ASCII sketches and a mermaid block (mermaid does not render in a terminal; ASCII does). In the desktop app the same update rendered as an inline widget (`show_widget`). Four dashboard entries were written and committed, but they **fail the dashboard contract** (no `visual` field), because the spike brief listed the fields itself instead of loading `delivery-dashboard`. | Run 2 final message; desktop widget; `check()` from `check-dashboard.mjs`. |
| P12 | Cleanup | **Pass.** A worker worktree with no changes is removed automatically when the agent ends; one with commits is kept. The orchestrator removed the four kept worktrees and branches and pruned; `git worktree list` showed only `main`. A `for` loop over them was refused (variable), so cleanup is one plain command per worktree. | Run 2. |
| P13 | Escalation | **Pass.** The T5 worker saw `README.md` is tracked, did not delete it, and ended `BLOCKED needs-human`; the orchestrator recorded it under NEEDS YOU and kept T1 and T2 moving. | Loop run 1. |

**Harness-specific answers:**

- **Which dispatch mechanism.** The Agent tool with `isolation: "worktree"` and `run_in_background: true` suits workers: it is event-driven, isolated, model-per-child and works headless. `claude --bg` **fails fast in an untrusted folder** ("Workspace not trusted… accept the trust prompt"), so it needs a one-time interactive trust first; `-p` skips trust. Desktop `start_session` is for work the user should see and steer, not for workers.
- **Worktree base.** With a remote, the default base is `origin/<default>` (a side-branch commit was absent). With no remote it falls back to the local `HEAD`. `--settings` with `{"worktree":{"baseRef":"head"}}` makes it `HEAD` even with a remote. The orchestrator should run from the base branch, or set `baseRef: "head"` when it intends `HEAD`.
- **Auto mode vs. a read-only reviewer.** A tool allowlist removes the tools, so `auto` cannot grant them back. `bypassPermissions` is untested.
- **Skills in sub-agents.** **Yes.** A Haiku sub-agent told to load `tdd` called its Skill tool and got the skill text, so a brief can name `delivery-dashboard` or `tdd` and the worker loads it.
- **Shell rules in workers are the main failure.** Background workers cannot ask for approval, so the permission rules must match every command they write. Haiku workers chain commands (`cd <wt> && npm test 2>&1 | tail; echo "EXIT=${PIPESTATUS[0]}"`); a `$` variable (`A variable in this command can't be checked before it runs`), a loop, or a pipe into an unlisted program is denied. The orchestrator itself hit this with a `for` loop. The worker brief must demand plain single commands from the current directory, or the rules must be wider.

**Fallbacks for the reference:** P5 → re-dispatch with the answer; P10 PR and P7 bypass → untested, so the reference says so; shell denials → the plain-command rule in the worker brief.

**Found in passing:** `check-dashboard.mjs` exits 0 without checking anything when run as a CLI on Windows. Its entry-point guard compares `resolve(argv[1])` with `new URL(import.meta.url).pathname`, which is `/D:/…` on Windows, so the guard never matches. The exported `check()` works.

## Portable abstractions

These are the verbs the skill body can use, each mapped to a native mechanism in the per-harness references:

1. **dispatch(role, brief, isolation).** Start a worker or reviewer with its brief as its whole contract.
2. **isolate(ticket).** The portable fallback is `git worktree add ../<repo>-<ticket> -b <branch>` from the tip of the base branch. Use native isolation where it exists. Gotchas:
   - A branch can be checked out in only one worktree at a time.
   - A fresh worktree lacks dependencies and gitignored files.
   - Claude's default base is `origin/<default>` when a remote exists, else `HEAD`.
3. **report(status, evidence).** `progress` / `blocked` / `question` / `done`, carried by whatever channel the harness has. Where the only channel is the final message, that message carries the status line.
4. **pre-authorize.** Set approvals **before** dispatch. In every harness a child stalls on, or fails at, an approval prompt it cannot show.
5. **await.** Event-driven only: completion notices, `wait_agent` or ledger monitors. Never sleep-poll.
6. **review(diff, ticket).** A separate, read-only reviewer context with expectations written from the ticket.
7. **cap(n).** The lower of the user's budget, the harness cap and the number of non-overlapping tickets.

## Couldn't verify / possibly stale

- Claude Code spike (2026-10-31), not run: P10 in PR mode (needs the user's go-ahead for a throwaway GitHub repo); P7 with a `bypassPermissions` parent (refused by the sandbox classifier); `claude --bg` workers (the fixture folder is untrusted, and accepting trust is the user's call); real concurrency limits beyond 22 short agents; interactive (non-headless) approval bubbling.
- Kiro's older "up to four sub-agents" limit: only in a search snippet of an old page.
- Claude agent view and teams are a research preview / experimental. Codex v2 tool names are still under development.
- agy desktop Agent Manager facts come from secondary sources only, and what `share` does is unclear.
- Cursor facts come from search snippets only.
- Whether Kiro V3's built-in `session` tool starts sessions is not established.

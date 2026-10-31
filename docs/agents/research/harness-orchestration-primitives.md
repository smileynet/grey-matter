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
| **Isolation** | Manual `git worktree` (no flag in 2.34, V) | Manual; the worker contract carries a `worktree_pattern` | `isolation: worktree`, `claude -w` | Worktrees managed by the app; `codex exec --worktree` (detached HEAD, V); or manual | Workspace `branch` (a worktree) |
| **Messaging** | Result only | Ledger `work_report` and `decision`; `session_send` | `SendMessage` to a sub-agent, teammate or session | `send_input` (v1), `send_message` (v2) | `send_message`; agents can read each other's transcripts |
| **Ask the parent** | None documented | `work_report status=question` | Message the lead; the user is reached through the main UI | Final message (I) | "has a question" picker (interactive only) |
| **Approvals** | The child's own config. V3: the stricter of parent and child wins. Headless runs fail fast | Autopilot is inherited; headless calls are otherwise denied | Prompts bubble to the main session; the parent's mode overrides the child's | The child inherits the parent's sandbox and approvals; headless runs fail | Inherited; prompts bubble up |
| **Wait** | Blocks until all children finish | `monitor_start(watch="work-ledger")` | Background completion notice; `notify_when_idle` | `wait_agent(timeout_ms)` | Completion message |
| **Limits** | None documented (an older page said 4; stale) | Sized from host memory; 3 h and 1000 tool calls per sub-agent | 20 concurrent, depth 3 | Source defaults say 6 threads, depth 1; 0.166 accepted 8 and depth 2 (V) | Depth 10 |
| **Model per child** | V2: per-stage `model`; V3: the agent file's `model`; or top-level `--model` | `session_create.model` | Yes | Yes | `flash`, `pro` or `inherit` |
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
- **Model per worker.** The V2 `subagent` tool takes a `model` per stage, and it is honoured: an unknown model fails that stage (V: [spike results](#spike-results-kiro-cli-2026-10-31)). The V3 per-agent tools take only `prompt`, so the model comes from the agent file. A top-level `kiro-cli chat --no-interactive --agent <a> --model <m>` per worker also works (V).

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
- **Approvals.** Children inherit the parent turn's sandbox and approval settings, and an agent file cannot override them. Headless runs fail the action and report it. `harnesses.md` says `codex exec` needs the bypass flag or it hangs; in 0.166 it defaulted to approval `never` and did not hang, and `--approve-for-me` let children commit without the bypass flag (V, spike).
- **Worktrees.** The desktop app manages worktrees (detached HEAD, `codex/` branches, Hand off, 15 kept by default). In the CLI, `codex exec --worktree` makes a detached-HEAD worktree under `<drive>:/.codex/worktrees/<id>/<repo>` (V), or use `git worktree` plus `-C`.
- **0.166 tool surface** (V: [spike results](#spike-results-codex-2026-10-31)): `spawn_agent` (`task_name`, `message`, `fork_turns` all|none, `model`, `reasoning_effort`), `wait_agent` (`timeout_ms`, default 30 s, max 1 h), `send_message`, `followup_task`, `interrupt_agent`, `list_agents`. There is no close tool.
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

Ticket 125. Claude Code 2.1.316 on Windows 11, headless `claude -p --output-format stream-json --verbose` runs from inside the spike fixture (`scripts/spike-orchestrate-fixture.mjs`), plus in-session probes from the desktop app. Orchestrator Sonnet, workers and reviewer Haiku. Every claim below is **V** (observed in a run transcript) unless marked. Total spend across all runs was about 2.17 USD (1.65 for the trunk-mode probes, 0.52 for the PR-mode run).

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
| P10 | Landing (PR) | **Pass.** On a throwaway private repo (`--variant pr`), each worker ran `git push -u origin HEAD` and `gh pr create`, and ended `DONE <sha> <PR url>`. Claude Code emits a `code_change_published` system event with the PR URL. The orchestrator checked `gh pr diff --name-only` against `Touches:`, ran `gh pr merge --merge`, `git pull --ff-only` and `npm test` (green after each), then `tkt close`. PRs 1-4 merged; ticket 3 and ticket 4 were cut from `origin/main` after ticket 1 merged. Ticket and dashboard bookkeeping were pushed to `main` directly, which the fixture's "main changes only through PRs" rule forbids: tkt's auto-push and a PR-only repo conflict, so the reference must say where bookkeeping lands. The four remote `worktree-agent-<id>` branches were deleted afterwards. Cost 0.52 USD. | PR-mode run transcript; independent `gh pr list --state all` (4 MERGED, each touching only its Touches files), `git log --graph origin/main`, `tkt query` (1-4 done, 5 in_progress), `npm test` 5/5, `README.md` present. |
| P11 | Chat visual | **Pass in both surfaces, with a dashboard gap.** Headless, the closing update is markdown with ASCII sketches and a mermaid block (mermaid does not render in a terminal; ASCII does). In the desktop app the same update rendered as an inline widget (`show_widget`). Four dashboard entries were written and committed, but they **fail the dashboard contract** (no `visual` field), because the spike brief listed the fields itself instead of loading `delivery-dashboard`. The PR run's brief added a `visual` but named the type `mermaid`, which the contract rejects (`image`, `compare`, `progress`, `steps`, `metrics` only): the reference must point at the dashboard skill's schema, not restate it. | Run 2 final message; desktop widget; `check()` from `check-dashboard.mjs`. |
| P12 | Cleanup | **Pass.** A worker worktree with no changes is removed automatically when the agent ends; one with commits is kept. The orchestrator removed the four kept worktrees and branches and pruned; `git worktree list` showed only `main`. A `for` loop over them was refused (variable), so cleanup is one plain command per worktree. | Run 2. |
| P13 | Escalation | **Pass.** The T5 worker saw `README.md` is tracked, did not delete it, and ended `BLOCKED needs-human`; the orchestrator recorded it under NEEDS YOU and kept T1 and T2 moving. | Loop run 1. |

**Harness-specific answers:**

- **Which dispatch mechanism.** The Agent tool with `isolation: "worktree"` and `run_in_background: true` suits workers: it is event-driven, isolated, model-per-child and works headless. `claude --bg` **fails fast in an untrusted folder** ("Workspace not trusted… accept the trust prompt"), so it needs a one-time interactive trust first; `-p` skips trust. Desktop `start_session` is for work the user should see and steer, not for workers.
- **Worktree base.** With a remote, the default base is `origin/<default>` (a side-branch commit was absent). With no remote it falls back to the local `HEAD`. `--settings` with `{"worktree":{"baseRef":"head"}}` makes it `HEAD` even with a remote. The orchestrator should run from the base branch, or set `baseRef: "head"` when it intends `HEAD`.
- **Auto mode vs. a read-only reviewer.** A tool allowlist removes the tools, so `auto` cannot grant them back. `bypassPermissions` is untested.
- **Skills in sub-agents.** **Yes.** A Haiku sub-agent told to load `tdd` called its Skill tool and got the skill text, so a brief can name `delivery-dashboard` or `tdd` and the worker loads it.
- **Shell rules in workers are the main failure.** Background workers cannot ask for approval, so the permission rules must match every command they write. Haiku workers chain commands (`cd <wt> && npm test 2>&1 | tail; echo "EXIT=${PIPESTATUS[0]}"`); a `$` variable (`A variable in this command can't be checked before it runs`), a loop, or a pipe into an unlisted program is denied. The orchestrator itself hit this with a `for` loop. The worker brief must demand plain single commands from the current directory, or the rules must be wider.

**Fallbacks for the reference:** P5 → re-dispatch with the answer; P7 bypass → untested, so the reference says so; P10 PR → bookkeeping commits need a stated home (a PR, or a documented exception for `.tickets/` and the dashboard); shell denials → the plain-command rule in the worker brief.

**Found in passing:** `check-dashboard.mjs` exits 0 without checking anything when run as a CLI on Windows. Its entry-point guard compares `resolve(argv[1])` with `new URL(import.meta.url).pathname`, which is `/D:/…` on Windows, so the guard never matches. The exported `check()` works.

## Spike results: kiro-cli (2026-10-31)

Ticket 126. kiro-cli 2.34.0 on Windows 11, headless `kiro-cli chat --no-interactive --trust-workspace --output-format stream-json` from inside the trunk fixture. The default engine is V2; V3 was probed with `--v3`. Three workspace agents in the fixture's `.kiro/agents/` carried the permissions:
- `spike-orchestrator`: Sonnet 4.6; `read`, `glob`, `grep` and `subagent` trusted; shell limited by `allowedCommands` to `git .*`, `npm test`, `tkt .*` and `gh pr .*`; writes limited to `docs/**`.
- `spike-worker`: Haiku 4.5; shell limited to named git commands and `npm test`; writes limited to the fixture and its worktree folder.
- `spike-reviewer`: `read`, `glob` and `grep` only.

Every claim is **V** unless marked. Credits were not reported in the stream, so cost is unmeasured.

| # | Probe | Result | Evidence |
|---|---|---|---|
| P1 | Dispatch | **Pass, two ways.** (a) The V2 `subagent` tool takes `task`, `mode` (only `"blocking"`) and `stages[]` (`name`, `role` = an agent name, `prompt_template`, optional `model`, `depends_on`, `loop_to`). Stages without `depends_on` run concurrently: two workers' tool calls interleaved. (b) Two top-level `kiro-cli chat --no-interactive --agent spike-worker` processes overlapped (started 1 s apart, ended at 12 s and 17 s). V3 replaces the stage tool with one tool per agent, `subagent_<name>(prompt, explanation)`; three calls in one turn ran together. | Write probe; top-level probe; V3 probe. |
| P2 | Isolation | **Manual, and it works.** No native worktree. The orchestrator ran `git worktree add <fixture>-wt/t<id> -b tkt/<id>-<slug>` and told each worker its path; workers passed `working_dir` to shell and used absolute paths, and commits landed on `tkt/NN-slug`. Workers share the parent's process and cwd, so isolation rests on the brief, not the harness. | Loop run: `git log --graph` shows `tkt/` branches merged. |
| P3 | Approvals | **Fails fast without rules; works with agent-file rules.** With only `subagent` trusted, every child `write` and `shell` call was denied at once (`tool permission approval is not supported in non-interactive mode`), even `git log`, and both workers reported BLOCKED. With `allowedCommands` and `allowedPaths` in the worker's agent file, V2 children ran. **V3 checks parent and child and the stricter wins:** with the orchestrator allowing writes only under `docs/**` and the worker allowing the whole fixture, the child's `docs/probe-in.txt` was written and its root `probe-out.txt` was denied. V3 also refused a PowerShell here-string it could not parse (`Kiro could not parse this shell command`). The orchestrator had both `subagent` in `allowedTools` and V2 `toolsSettings.subagent.trustedAgents`, so the effect of `trustedAgents` alone was not isolated. | Write probes V2 untrusted, V2 scoped, V3 scoped. |
| P4 | Status line | **Pass, with a channel rule.** The parent receives the worker's `summary` tool result (`taskResult`), not its final text. One worker's `DONE w2` was in its text but missing from `taskResult`; in the loop two workers gave a SHA without the `DONE` form and the orchestrator accepted the SHA. The brief must say the summary's result ends with the status line. | Write probe; loop batch 2. |
| P5 | Question round-trip | **Pass by re-dispatch.** The T2 worker ended `QUESTION What term from the project glossary…`; the orchestrator answered `greetReturningUser` and dispatched a new stage into the same worktree (manual worktrees survive), which ended `DONE aa6ade9…`. There is no resume of a finished sub-agent. V3 sub-agents list a `user_input` tool; headless it cannot be answered (not probed). | Loop run. |
| P6 | Await | **Pass (blocking).** The V2 `subagent` call blocks until every stage ends, so no polling appears, but the batch waits for its slowest stage. **One stage's fatal error aborts the batch:** an unknown model in one stage stopped its two siblings (`stage failed due to upstream error`). Top-level processes: the V2 shell tool has no background option, so an orchestrator waits on one foreground worker at a time; the V3 `execute_pwsh` tool has `run_in_background` and a 30-minute maximum `timeout` (completion notices not probed). | Model probe; shell-schema probes. |
| P7 | Read-only reviewer | **Pass in V2 and V3.** `spike-reviewer` reported only `glob`, `grep`, `read` and `summary` (V2) or read and search tools (V3), and no file was written. | Reviewer probes. |
| P8 | Model per child | **Pass.** A stage's `model` reaches the API: `no-such-model-xyz` failed with `The model 'no-such-model-xyz' is not available`, and a `qwen3-coder-next` stage answered. A top-level worker's saved session records `model_id: qwen3-coder-next`. Sub-agent sessions record `model_info: null`, so the stage model is shown only by the error. | Model probes; `~/.kiro/sessions/cli/<id>.json`. |
| P9 | Cap | **No cap hit at 16.** One call with 16 stages returned 16 outputs, no limit message. | Cap probe. |
| P10 | Landing (trunk) | **Pass.** Two batches: T1, T2 and T5, then T3 and T4 after T1 merged. The orchestrator diffed each `tkt/` branch against `main`, merged `--no-ff`, ran `npm test` green after each (2, 3, 3, 4 tests), closed with `tkt close`. It wrote one dashboard commit per batch rather than per ticket. | Loop run; independent `git log --graph`, `tkt query` (1-4 done, 5 in_progress), `npm test` 4/4. |
| P10 | Landing (PR) | **Not run.** Needs a throwaway GitHub repo, which needs the user's go-ahead. | |
| P11 | Chat visual | **Pass, terminal only.** The final message carried an ASCII input → output sketch per ticket. The four dashboard entries used `visual.type: "steps"` and passed `check()` (no errors). | Loop final message; `check-dashboard.mjs` `check()`. |
| P12 | Cleanup | **Pass.** The orchestrator removed the four merged worktrees and branches and pruned; the blocked T5 worktree was left and reported. Manual worktrees are never removed automatically. | Final `git worktree list`. |
| P13 | Escalation | **Pass, but the permission layer did the work.** The T5 worker tried `Remove-Item`, `del` and `git rm README.md`, all denied, then ended `BLOCKED needs-human`. The brief's "do not delete" was ignored by Haiku; only the shell rules kept the file. `README.md` still exists. | Loop run denials. |

**Harness-specific answers:**

- **`subagent` vs. top-level processes.** Use the `subagent` tool for a batch that shares a deadline: it is concurrent, model-per-stage, and blocks without polling. Its costs: one bad stage cancels the batch, the parent waits for the slowest stage, and results arrive only through `summary`. Use one top-level `kiro-cli chat --no-interactive` process per worker when workers must finish independently. The orchestrator can then wait on a foreground process (V2) or start background processes (V3 `run_in_background`); notification on exit was not observed.
- **V3 approvals.** Stricter-of-both is confirmed. Every path or command a worker needs must also be allowed for the orchestrator agent.
- **Shell.** V2 runs "the detected shell" (PowerShell or cmd.exe); V3 runs `pwsh.exe`. Workers wrote PowerShell (`Remove-Item`, here-strings), so rules must match the shell actually used.

**Fallbacks for the reference:** P4 → status line in the summary result, and accept a lone SHA only after `git cat-file -e`; P6 abort → validate stage models before dispatch, or one process per worker; P10 PR → untested; P13 → rely on deny rules for destructive commands, not the brief.

## Spike results: Codex (2026-10-31)

Ticket 127. codex-cli 0.166.0 on Windows 11, headless `codex exec --json` from inside the trunk fixture. Orchestrator `gpt-6.1-sol` (low effort), workers `gpt-6-luna`. Every claim is **V** unless marked. The loop run used about 1.48 M input tokens (1.40 M cached) and 10 k output tokens.

**Install bug found first:** the bun shim `~/.bun/bin/codex.exe` looks for `codex-code-mode-host.exe` beside itself, where it is missing, so every shell call failed (`Code Mode is unavailable … host executable was not found`). The vendored binary in `@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/` has the host beside it, and all runs below used it.

| # | Probe | Result | Evidence |
|---|---|---|---|
| P1 | Dispatch | **Pass.** `spawn_agent` with `fork_turns: "none"` started three workers in one turn; they ran concurrently and reported in completion order. | Loop run spawns `/root/t1`, `/root/t2`, `/root/t5`. |
| P2 | Isolation | **Manual, or `--worktree` for a top-level run.** `spawn_agent` has no cwd or worktree field, so the orchestrator made `git worktree add … -b tkt/<id>-<slug>` worktrees and named them in each brief. `codex exec --worktree` gave a detached-HEAD worktree at `D:/.codex/worktrees/d186/<repo>`, cut from the current `HEAD`. | Loop run; `--worktree` probe. |
| P3 | Approvals | **The sandbox, not a prompt, is the gate.** `codex exec` defaults to approval `never`. Under `-s workspace-write` children wrote files (cwd and `%TEMP%`, which the policy also makes writable) but **`.git` is read-only**: `git add` failed on `.git/index.lock`, and `--add-dir <repo>/.git` did not change that. **`--approve-for-me`** (approval `on-request`, routed to a `codex-auto-review` model) let a child's `git commit` through without the bypass flag; the child's turn context recorded `workspace-write` plus `on-request`, inherited from the parent. The sandbox runs as another account: `~/.config/git/ignore` was unreadable and `mise` shims were absent, so `tkt` and `npm test` failed until the orchestrator called `tkt.exe` and `node.exe` directly. | Write probes; child rollout `turn_context`; loop run. |
| P4 | Status line | **Pass, with a false-DONE risk.** Workers ended with a bare `DONE <sha>`. But the `--worktree` worker's commit failed and it still ended `DONE 9d77280…`, the pre-existing `HEAD`. Accept only a SHA that `git log main..<sha>` shows as new. | Loop run; `--worktree` probe. |
| P5 | Question round-trip | **Pass, same agent.** The T2 worker ended `QUESTION What is the project glossary term for a returning user?`; `followup_task` to `/root/t2` with the answer resumed it in place, and it finished `DONE 136732b…`. No re-dispatch needed. | Loop run. |
| P6 | Await | **Pass.** `wait_agent(timeout_ms)` returns on the next mailbox update, not on a sleep; the orchestrator called it three times and acted on each finisher. | Loop run (`collab_tool_call` `wait` ×3). |
| P7 | Read-only reviewer | **Pass with `codex review --base main`.** On a branch that changed `add` to subtract, it reported `[P1] Preserve addition behavior in add` and left the tree clean. It cannot take the ticket text: `--base` and a custom prompt are mutually exclusive, so ticket-specific expectations need a `-s read-only` spawned reviewer instead. | Review probe. |
| P8 | Model per child | **Pass.** The child's rollout `turn_context` records `model: gpt-6-luna` while the parent ran `gpt-6.1-sol`. | `~/.codex/sessions/…/rollout-*.jsonl`. |
| P9 | Cap | **No cap at 8; depth is at least 2.** Eight `spawn_agent` calls all returned a task name and all finished. A child spawned its own child (`/root/d1/d2`), against the documented depth default of 1. | Cap probe. |
| P10 | Landing (trunk) | **Pass.** T1, T2, T5 in flight, then T3 and T4. Each `tkt/` branch was diffed, merged `--no-ff`, tested green (2, 3, then 4/4), closed, and given its own dashboard commit. Claims first failed inside the sandbox after tkt had already written `in_progress`; the orchestrator escalated and committed the claim changes. | Loop run; independent `git log --graph`, `tkt query` (1-4 done, 5 in_progress), `npm test` 4/4. |
| P10 | Landing (PR) | **Not run.** Needs a throwaway GitHub repo, which needs the user's go-ahead. | |
| P11 | Chat visual | **Pass in the CLI.** The final message had an ASCII sketch per ticket; the four dashboard entries passed `check()`. The Codex app was not checked. | Loop final message; `check()`. |
| P12 | Cleanup | **Pass.** Merged worktrees and branches were removed and pruned; T5's was kept and reported. A `--worktree` run leaves its worktree behind. | Final `git worktree list`. |
| P13 | Escalation | **Pass.** The T5 worker ended `BLOCKED needs-human: deleting the tracked README.md is explicitly prohibited by the work instructions` without trying the deletion. | Loop run. |

**Harness-specific answers:**

- **`spawn_agent` vs. one `codex exec -C <worktree>` per worker.** `spawn_agent` is the better default: concurrent, model per child, event-driven `wait_agent`, and `followup_task` keeps a questioning worker alive. A top-level `codex exec` per worker gives process isolation and `--worktree`, but each is a separate approval context and its result comes back only as its last message (`-o`).
- **Children writing their worktree without the bypass flag.** `--approve-for-me` is the setting. `workspace-write` alone cannot commit, because `.git` stays read-only.
- **`wait_agent`.** Default 30 s, min 10 s, max 1 h; use the max and loop while agents are live.
- **`codex review --base`.** Good as a generic consequential-change reviewer; not a spec reviewer.

**Fallbacks for the reference:** P3 → `--approve-for-me`, and call tools by absolute path when the sandbox account lacks the user's PATH; P4 → verify the SHA is new; P7 spec check → a spawned read-only reviewer with the ticket; P10 PR → untested.

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

- Claude Code spike (2026-10-31), not run: P7 with a `bypassPermissions` parent (refused by the sandbox classifier); `claude --bg` workers (the fixture folder is untrusted, and accepting trust is the user's call); real concurrency limits beyond 22 short agents; interactive (non-headless) approval bubbling.
- kiro-cli spike (2026-10-31), not run: P10 in PR mode (needs the user's go-ahead for a throwaway GitHub repo); whether V3 `run_in_background` notifies the orchestrator when a process exits; V3 `user_input` from a headless sub-agent; credit cost per run.
- Codex spike (2026-10-31), not run: P10 in PR mode; rendering in the Codex app; whether 8 spawns ran concurrently or queued behind a cap of 6.
- Kiro's older "up to four sub-agents" limit: only in a search snippet of an old page. The spike ran 16 stages in one call without a limit message.
- Claude agent view and teams are a research preview / experimental. Codex v2 tool names are still under development.
- agy desktop Agent Manager facts come from secondary sources only, and what `share` does is unclear.
- Cursor facts come from search snippets only.
- Whether Kiro V3's built-in `session` tool starts sessions is not established.

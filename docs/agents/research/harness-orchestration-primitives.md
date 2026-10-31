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
- **Worktree base.** `isolation: worktree` branches from the **default branch, not `HEAD`**, unless `worktree.baseRef: "head"` is set.
  - `.worktreeinclude` copies gitignored files.
  - A worktree with no changes is removed; one with changes is kept until the cleanup sweep.
  - Isolation blocks edits and git commands aimed at the main checkout, but not `cp` or shell redirects.
- **Approvals.** A background sub-agent's prompts surface in the main session. A parent in `bypassPermissions`, `acceptEdits` or auto mode overrides the child's `permissionMode`.
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

## Portable abstractions

These are the verbs the skill body can use, each mapped to a native mechanism in the per-harness references:

1. **dispatch(role, brief, isolation).** Start a worker or reviewer with its brief as its whole contract.
2. **isolate(ticket).** The portable fallback is `git worktree add ../<repo>-<ticket> -b <branch>` from the tip of the base branch. Use native isolation where it exists. Gotchas:
   - A branch can be checked out in only one worktree at a time.
   - A fresh worktree lacks dependencies and gitignored files.
   - Claude's default base is the default branch, not `HEAD`.
3. **report(status, evidence).** `progress` / `blocked` / `question` / `done`, carried by whatever channel the harness has. Where the only channel is the final message, that message carries the status line.
4. **pre-authorize.** Set approvals **before** dispatch. In every harness a child stalls on, or fails at, an approval prompt it cannot show.
5. **await.** Event-driven only: completion notices, `wait_agent` or ledger monitors. Never sleep-poll.
6. **review(diff, ticket).** A separate, read-only reviewer context with expectations written from the ticket.
7. **cap(n).** The lower of the user's budget, the harness cap and the number of non-overlapping tickets.

## Couldn't verify / possibly stale

- Kiro's older "up to four sub-agents" limit: only in a search snippet of an old page.
- Claude agent view and teams are a research preview / experimental. Codex v2 tool names are still under development.
- agy desktop Agent Manager facts come from secondary sources only, and what `share` does is unclear.
- Cursor facts come from search snippets only.
- Whether Kiro V3's built-in `session` tool starts sessions is not established.

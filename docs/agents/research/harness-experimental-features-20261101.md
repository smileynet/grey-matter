# Harness experimental features: follow-up spikes and QoL options

**Question:** which experimental, preview and opt-in features of each harness are worth a hands-on spike for the orchestrate loop ([proposal 17](../proposals/17-orchestrator-skill.md)), and which are quality-of-life switches the user may want?

**Gathered:** 2026-11-01, during the Kiro Crew spike (ticket 128). Kiro Crew was read directly from its installed package. Claude Code, Codex, kiro-cli and Antigravity were read by four research subagents, each limited to read-only commands against the local install plus the official docs.

**Local versions:** Kiro Crew 0.11.1 (auto-updated from 0.9.0 mid-spike), Claude Code CLI 2.1.316, codex-cli 0.166.0, kiro-cli **2.37.0** (the [primitives note](./harness-orchestration-primitives.md) recorded 2.34), agy 1.4.12.

**Confidence:** **L** = seen in the local install (help text, settings listing, config schema, bundled files). **D** = documented only, not run. **I** = inferred. No feature below was exercised unless marked as run.

## Kiro Crew

### Settings changed on this machine during ticket 128 (user-approved)

| Setting | Was | Now | Why |
|---|---|---|---|
| `agent.sandbox_allow_unsandboxed_exec` | `false` | `true` | 0.11.1 has no OS sandbox backend on Windows and refuses every agent spawn while this is `false` (L, run). 0.9.0 ran on the same config by delegating to kiro-cli's sandbox. |
| `agent.session_control` | `false` (stored pre-#8375 default) | `true` | `session_create` is refused without it, so a conductor cannot dispatch (L, run). |
| `kirocrew config defaults --adopt` | old defaults | current | Worker turn cap 100 → 1000, spawn stagger 2 → 0.25 s, watchdog stall window 1 h → 1.5 h, plus `instances.warm_set_cap` and `stt.language_code`. |
| `mcp_gateway.enabled` | `false` | `true` | Sessions share MCP server processes; the host had 0.6–2.5 GB available against Kiro Crew's 4 GB pressure line. |
| `dashboard.session_grid` | `false` | `true` | Split view, for watching a conductor beside its workers. |

YOLO (`POST /api/chat/mode {"mode":"yolo"}`) lasts until the next shutdown, and both restarts and the self-update cleared it.

### Follow-up features to test

- **Mates (0.11 "Mate 2.0").** A Mate owns an agent file under `~/.kiro/mates/agents/`, talks through a conductor chat that keeps notes, and hands work to a worker session that follows its Profile (L: changelog). Spike: can a Mate replace the built-in `kirocrew-conductor` as a standing orchestrator? It has a persistent conductor with a revivable worker, and a worker's report wakes the Mate after a restart.
- **Multiple backends.** `agent.acp_backend` and `agent.member_acp_backend` accept `claude`, `codex`, `deepseek`, `goose`, `kas`, `kiro`, `opencode` and `pi` (L: live config schema). The settings UI tags all but KAS and kiro-cli "Experimental" (L: UI bundle, I: which ones). Spike: a Kiro Crew conductor on KAS dispatching Claude Code or Codex workers, so the ledger, patrol and board are Kiro Crew's while the work runs on another harness.
- **KAS allow-lists instead of YOLO.** 0.11.1 makes KAS honour an agent spec's allowed shell commands and allowed paths, and refuse the rest under deny-by-default (L: changelog). Spike: rerun P3 and P13 with a worker spec that allows `git`, `npm` and `tkt` in the fixture and denies file deletion. This is the fix for this spike's P13 failure, where YOLO let a worker delete the README.
- **The acceptance evaluator.** In this spike the conductor never ran `scripts/accept_eval.py`. It recorded verdicts from its own diff review, and recorded ticket 5's "file exists" acceptance as a pass on a deleted file (L, run). Spike: does the conductor run the evaluator when the brief doesn't also ask for a spec check?
- **`dynamic_capabilities` (preview, per Mate).** A Mate can find tools its worker lacks and request them on a card (L: schema). Relevant only with Mates.

## Other harnesses

### Claude Code 2.1.316

| Feature | Enable | Status | Seen | Orchestration value |
|---|---|---|---|---|
| Background agents and agent view | `claude --bg`, `claude agents [--json]`, `attach`/`logs`/`stop`/`respawn` | Research preview | L | High. Each `--bg` session gets its own worktree, and `--json` lists sessions for scripting. Idle unattached sessions are reaped after about an hour (D). |
| Cross-session messaging | `SendMessage`, `ListAgents`; `crossSessionInbound` accept/hold/refuse | GA, on by default on Windows | L (a messaging pipe exists in this session) | High. `notify_when_idle` gives a worker-done signal. Unattended `-p` workers need `crossSessionInbound:"accept"` (D). |
| Dynamic workflows | `Workflow` tool, `/workflows`, `workflowSizeGuideline`, `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` | GA on paid plans | D (L: skill present) | High. Scripted `agent`/`pipeline`/`parallel` with a resume journal. |
| Agent teams | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Experimental | D | Medium. Shared task list and gate hooks. One team per session and no resume; split panes don't work in Windows Terminal (D). |
| Auto mode | `--permission-mode auto`, `claude auto-mode …` | Opt-in | L | High. Unattended workers without bypass. |
| Retry watchdog | `CLAUDE_CODE_RETRY_WATCHDOG=1` | Opt-in | D | High for unattended runs. Waits out 429/529 and usage-limit resets. |
| Subagent model and effort | `CLAUDE_CODE_SUBAGENT_MODEL[_FORCE]`, `CLAUDE_CODE_SUBAGENT_EFFORT` | Opt-in | D | Medium. One cost tier for every worker. |
| `claude ultrareview` | subcommand | Research preview (D, from a digest) | L | Medium. A cloud review stage before landing. |
| Stream forwarding | `--forward-subagent-text`, `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS` | Opt-in | L/D | Medium. Lets an outside orchestrator parse worker output. |

### Codex 0.166.0

Feature flags are listed by `codex features list` (name, stage and state only, no descriptions). `--enable <name>` turns one on for a single run without writing config.

| Feature | Stage (L) | Orchestration value |
|---|---|---|
| `multi_agent_v2` | stable, off | High. Next-generation spawn path; 0.166 adds V2 child-creation APIs (D). What it changes is undocumented. |
| `agent_message_board` + `wake_on_agent_messages` | under development, off | High (I). A shared channel between agents, plus waking an idle orchestrator on a post. |
| `codex agents` (shared daemon) + `codex queue --thread … --resume` | stable | High. One view of every session; an outside process can message a running or saved worker. |
| `exec --json`, `--output-schema`, `-o` | stable | High. Machine-readable worker results. |
| `[agents]` config: `default_subagent_model`, `default_subagent_reasoning_effort`, custom role TOML files | documented | High. Cheaper workers and repo-checked role files. Subagents can't override sandbox, approval or MCP settings (D). |
| `rollout_budget`, `token_budget` | under development, off | Medium. Caps a runaway worker's spend. |
| `guardianv2`/`v3` | under development | Medium. The auto-review layer behind `--approve-for-me`. |
| `cloud exec`, `remote-control` | experimental | Medium. Offload or remote workers. |
| `prevent_idle_sleep` | experimental, off | QoL. Stops the machine sleeping mid-turn. |

Not confirmed: a `max_depth` config key, or why `multi_agent_v2` is "stable" but off.

### kiro-cli 2.37.0

| Feature | Enable | Status | Orchestration value |
|---|---|---|---|
| Workflows | `chat.enableWorkflows`, `chat.workflowLaunch` (when-asked, large-tasks or delegate-all), `/workflow run` | Opt-in, needs V3/KAS (L keys, D docs) | High. Recipes with steps, loops, parallel branches, join policy and independent reviewers capped by `maxIterations`. Pause, resume and retry. |
| V3 engine | `--v3` or `chat.agentEngine=v3` | Early release | High. Workflows, cloud sessions, the session dashboard and `permissions.yaml` need it. |
| Headless driver | `chat --no-interactive --output-format stream-json`; `kiro-cli serve`, `acp` (hidden) | Undocumented (L) | High. A programmatic surface for an outside orchestrator. |
| Cloud sessions | `--cloud --repo owner/name` | Paid plans (D) | High. Up to 10 sandboxes, with results returned as PRs. |
| Subagent timeout | `api.subagentTimeout` | Setting (L) | Medium. Idle deadline per child. |
| Approve for me | `/permissions` (V3) | New in 2.36 (D) | Medium. Auto-approves routine actions and blocks risky ones. |
| `chat.enable*` experiments | `/experiment` or settings | Experimental (L) | TodoList (resumable worker state) and CodeIntelligence (LSP) are medium. Delegate is deprecated in favour of subagents. Checkpoint, Tangent and Thinking are low. Knowledge is one index per agent, so it isn't shared between workers. |
| Memory (`memory.mode`) | setting, KAS only | Opt-in | Medium, with a risk: memory is per user across workspaces, so it could leak between workers (I). |

### Antigravity (agy 1.4.12, app 2.28.2, IDE 1.107.0)

| Feature | Enable | Status | Orchestration value |
|---|---|---|---|
| `run_workflow` | built-in tool; `agent(prompt, schema, role, type_name, workspace, model)`, `parallel`, `pipeline` | Shipped (L: builtin skill) | High. agy fans out over tickets itself, with typed results and a worktree per agent. |
| Custom agents with a model per role | `.agents/agents/*.md` frontmatter `model:`; `--agent <name>` | Shipped (D) | High. Worker and reviewer tiers declared in the repo. It may also settle the spike's unverified per-child model (P8). |
| Paired stream-json I/O | `--input-format stream-json --output-format stream-json`, `--json-schema` | Shipped (L) | High. A long-lived worker driven from stdin. |
| Permission rules | `command(regex:…)`, `write_file(path)`, `mcp(server/*)`; deny beats ask beats allow | GA (D) | High. The docs say `*` inside a rule is literal. But `command(git)`, `command(git *)`, `command(git:*)` and an exact command were **all observed denied** in ticket 129, so the docs and the run disagree. `regex:` is untested. |
| Permissioned GitHub grants | `gh.merge({"org":…,"repo":…,"pr":"*"})` | Shipped (L: builtin skill) | High. Merge rights on one repo only, with no shell `*`. |
| `--mode auto` | flag, Shift+Tab | Preview (D) | High if available. It was refused here with "not available for this account". The docs exclude business accounts, and this machine's auth type is `gateway`, so the account is the likely cause (I). |
| `/teamwork-preview` (agent teams) | slash command, paid plans | Research preview (D) | Medium. Google's own many-agent orchestration. |
| PreInvocation hooks with `terminationBehavior` | `~/.gemini/config/hooks.json` | New in 1.4.11 (D) | Medium. A policy gate before each worker turn. |
| `artifactReviewPolicy` | `/config` (currently `asks-for-review`) | Opt-in (L) | Medium. Headless top-level runs can stall on artifact review (I). |

## Proposed spikes

Ordered by expected value to the orchestrate skill (ticket 111).

1. **Kiro Crew with KAS allow-lists instead of YOLO.** Rerun P3 and P13 with a worker spec allowing only `git`, `npm` and `tkt` in the fixture and denying deletes. Does the README survive, and does the worker escalate? Fixes this spike's main failure.
2. **Kiro Crew conductor dispatching other harnesses' workers** (`member_acp_backend` or the worker's backend set to `claude` or `codex`). Does the work ledger, `work_report` and patrol still work when the worker isn't on KAS?
3. **Kiro Crew Mates as the standing orchestrator.** Run the trunk loop through a Mate's conductor chat; check that revived workers and the wake-after-restart survive a gateway restart. This spike saw three restarts.
4. **agy `run_workflow` plus custom agents.** Can agy run the whole loop itself, with a worktree per ticket and typed results, and does a custom agent's `model:` pin the child's model (closes P8)?
5. **agy `command(regex:…)` rules.** Is there a working rule narrower than `command(*)` for headless workers? Closes ticket 129's P3 gap if it works.
6. **Codex `multi_agent_v2` with `agent_message_board` and `wake_on_agent_messages`.** Do they change the spawn limits, and can a board replace polling `wait_agent`?
7. **Claude Code `--bg` plus `claude agents --json` plus cross-session `notify_when_idle`.** An alternative dispatch layer for the orchestrate skill on Claude Code, with background sessions in their own worktrees and a push signal on finish. Check the about-one-hour idle reaper against long tickets.
8. **kiro-cli V3 workflows.** Can a recipe express claim → worker in a worktree → independent reviewer loop → land, natively?
9. **Cross-harness headless drivers.** Compare `codex queue`/`exec --json`, `kiro-cli chat --output-format stream-json`/`serve`, agy paired stream-json and Claude Code stream forwarding as surfaces one outside orchestrator could drive.

Each is a candidate ticket; none is filed yet.

## Proposed QoL switches for the user

None is applied; each is the user's call.

- **Claude Code:** `CLAUDE_CODE_RETRY_WATCHDOG=1`, so long unattended runs survive usage limits. `defaultToAgentsView` opens the agent dashboard on a plain `claude`. `preferredNotifChannel` picks where needs-input and finished notices go.
- **Codex:** `prevent_idle_sleep`, so long turns don't die when the laptop sleeps. Set `[agents] default_subagent_model` and `default_subagent_reasoning_effort` once, for cheaper workers.
- **kiro-cli:** `chat.enableContextUsageIndicator`, `chat.enableNotifications` (with `chat.notificationMethod osc9`), `chat.terminalTitle` for many parallel tabs, and `toolSearch.enabled` to save context.
- **Antigravity:** `notifications:true` and the `/agents` jump-to-waiting keys; `/statusline` and `/title` for per-tab agent metadata; `agentMode:"accept-edits"` if diff-review pauses get in the way.
- **Kiro Crew:** the session grid is on. If you'd rather keep a sandbox, set `sandbox_allow_unsandboxed_exec` back to `false`, but that means 0.11.1 can't run agents on Windows at all.

## Couldn't verify

- Descriptions for Codex's under-development flags, and why some are off while marked stable.
- kiro-cli's `/experiment` listing, which is interactive only, and the Workflows key names, which appear in local settings but not in the docs.
- agy's account type, and so whether `--mode auto` or `/teamwork-preview` is available here.
- Claude Code agent view's Windows limitations; the docs page was truncated.
- Which Kiro Crew backends the UI labels experimental. That rests on one UI bundle condition, read but not run.

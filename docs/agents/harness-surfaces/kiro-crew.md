# Kiro Crew surfaces: kirocrew CLI, gateway HTTP API, desktop app and web dashboard

Grammar, marks and template: [README](./README.md). Orchestration behaviour (conductors, workers, the work ledger) is in [kirocrew-orchestration](../research/kirocrew-orchestration.md); the settings changed on this machine during ticket 128 are in [harness-experimental-features-20261101](../research/harness-experimental-features-20261101.md#kiro-crew). This file records the surfaces only, and changed nothing: every gateway call below was a GET.

## Versions

Gathered 2026-11-01 on Windows 11, Git Bash, against a running gateway on port 5476.

| Surface | Program | Version | Read with | Help hash |
|---|---|---|---|---|
| CLI | `kirocrew` (no PATH entry; run as `"$LOCALAPPDATA/Programs/KiroCrew/resources/backend-dist/kirocrew-backend/python.exe" -s -P -m kiro_crew`) | 0.11.1 | `kirocrew --version` prints `kirocrew 0.11.1` | `ce059c4a1173` |
| CLI subcommand | `kirocrew gateway` | 0.11.1 | `kirocrew gateway --help` | `b9550e091078` |
| CLI subcommand | `kirocrew chat` | 0.11.1 | `kirocrew chat --help` | `dbe92af42a98` |
| CLI subcommand | `kirocrew run` | 0.11.1 | `kirocrew run --help` | `9f7eba92ca0f` |
| CLI subcommand | `kirocrew spawn` | 0.11.1 | `kirocrew spawn --help` | `de3983e6a5f8` |
| CLI subcommand | `kirocrew config` | 0.11.1 | `kirocrew config --help` | `c153c13f238b` |
| CLI subcommand | `kirocrew token` | 0.11.1 | `kirocrew token --help` | `14830717cf21` |
| GUI: desktop app | `%LOCALAPPDATA%\Programs\KiroCrew\KiroCrew.exe` (Electron) | 0.11.1 (FileVersion) | `(Get-Item ...KiroCrew.exe).VersionInfo` | n/a |
| GUI: web dashboard | served by the gateway at http://127.0.0.1:5476 | 0.11.1 (same package) | I: served from the installed backend | n/a |
| API | gateway HTTP API, same port | 0.11.1 | route registrations in `kiro_crew/dashboard/routes/*.py` | n/a |
| API | agent MCP servers (`kirocrew mcp-*`, hidden) | 0.11.1 | `~/.kiro/agents/kirocrew-*.json`, `kiro_crew/mcp_*.py` | n/a |

Hashes: `<cmd> --help 2>/dev/null | tr -d '\r' | sha256sum | cut -c1-12`, with `kirocrew` standing for the python invocation above. **L**

**Shorthand.** Below, `kirocrew` means that python invocation. `kiro-cli crew [ARGS]` also launches it and forwards `[ARGS]` (**I**, from [kiro.md](./kiro.md); not run here).

**Stderr.** The brief for this file said each call prints two config warnings on stderr. None appeared in this session: `--help` for all 167 parser entries, `--version`, `status` and twelve `config get` calls all wrote 0 bytes to stderr. **L**. Still send stderr to `/dev/null` when hashing; the warnings may depend on state not reproduced here (**I**).

## Surfaces

- **CLI** (`kirocrew <command>`): an argparse CLI shipped inside the desktop install's bundled Python (`resources/backend-dist/kirocrew-backend`). It starts and controls the gateway (`gateway`, `status`, `stop`, `restart`, `logs`, `token`), edits settings (`config`), and has a few one-shot agent commands (`chat -m`, `run <spec>`, `spawn run`). Most other commands talk to the running gateway over loopback. Data home: `$KIROCREW_HOME`, default `~/.kiro/crew` (here `%USERPROFILE%\.kiro\crew`, named by the pointer file `~/.kirocrew.breadcrumb`). Settings: `~/.kiro/crew/config.json` plus the `config.local.json` overlay. **L** (`--help`, `ls ~/.kiro/crew`, breadcrumb file); overlay **D** https://kiro.dev/docs/crew/configuration/
- **TUI** (`kirocrew chat` with no `-m`): an interactive terminal chat. **I**, from `chat -m` being described as "Single message (non-interactive)"; not opened here.
- **GUI: desktop app** (`KiroCrew.exe`, Electron). It starts a bundled gateway if none is running, and can connect to remote gateways over SSH in tabs. Desktop prefs live in `%APPDATA%\kirocrew-desktop\config.json` (keys include `runLocalGateway`, `remoteHosts`, `kirocrewBinPath`, `updateChannel`, `autoDownloadUpdates`, `globalHotkey`). It self-updates from the `stable` feed named in `resources/app-update.yml`; the research note records an auto-update from 0.9.0 to 0.11.1 during the spike. **L** (install dir and `%APPDATA%` listings, key names only); remote tabs **D** https://kiro.dev/docs/crew/
- **GUI: web dashboard** (http://127.0.0.1:5476, loopback-only by default). It is the gateway's single-page app: chat tabs ("slots"), approvals, memory, schedules, apps, settings and system status. The dashboard alone has the artifact library, memory graph, MCP panel, app store and task-runner UI. `dashboard.session_grid` turns on a split view of several chats. Its port is `KIROCREW_PORT`, `gateway --port N` or `dashboard.url`. **L** (`--help` epilog, live GETs); feature list **D** https://kiro.dev/docs/crew/interfaces/
- **API: gateway HTTP API**, the same aiohttp server and port as the dashboard. It has 681 route registrations under `kiro_crew/dashboard/routes/` (680 unique method+path pairs); other modules (handlers, apps) register more. Every request needs a token cookie except liveness, static assets and loopback bootstrap endpoints. Details in [Gateway HTTP API](#gateway-http-api). **L** (route parse); exceptions **D** https://kiro.dev/docs/crew/interfaces/
- **API: agent MCP servers.** Kiro Crew mounts its own stdio MCP servers into the agent specs it writes to `~/.kiro/agents/kirocrew-*.json`. Each is the hidden subcommand `kirocrew mcp-<name>`. Agents reach the session-control and work-ledger tools only this way. Details in [Agent MCP servers](#agent-mcp-servers). **L**
- **Messaging channels** (Slack, Discord, Telegram, Teams, Webex, WeCom, WeChat, WhatsApp, iMessage, Feishu). They connect outbound from the gateway. They are not covered here. **D** https://kiro.dev/docs/crew/interfaces/

## Feature-to-surface matrix

GUI means the web dashboard; the desktop app hosts the same dashboard (**I**, from the desktop starting a bundled gateway).

| Feature | CLI | TUI | GUI | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `chat -m <MESSAGE>`; `run <spec>` runs a spec file as an autonomous task; `spawn run <task>` | ? `chat` | ✓ chat tab | ✓ `POST /api/chat`, `POST /api/chat/slots/{slot}/followup`; `POST /v1/chat/completions` (OpenAI-compatible, **I** from the path) | L help, routes |
| Structured output | ✗ no JSON flag on `chat`/`run`; `--json` on some admin commands (`gateway-pid`, `gateway --json-ready`) | ✗ | ✗ | ✓ JSON on every route; `GET /api/ws` websocket | L help, live GETs |
| Model selection | ✓ `chat --model`, `spawn run --model`, `agent create/update --model`, `agent reset-model` | ? | ✓ model picker | ✓ `POST /api/chat/slots/{slot}/model`, `/reasoning-effort`; MCP `session_set_model`, `set_model` (mate) | L help, routes, MCP source |
| Approvals and permission modes | ~ `gateway --approval {reads,yolo,interactive}` at start; `config set agent.approval_mode` | ? | ✓ per-chat Normal, Reads, Trust; YOLO picker | ✓ `POST /api/chat/mode` (`normal`, `trust_reads`, `trust`, `yolo`), `PATCH /api/chat/slots/{slot}/mode`, `POST /api/chat/slots/{slot}/approve`, `GET /api/approvals`, `POST /api/approvals/{id}/{action}` | L help, `chat_api/slot_approval.py` |
| Sandboxing | ~ `--no-jail` (a no-op on the public edition); `sandbox` manages Linux AppArmor only | ✗ | ✓ settings | ✓ `agent.sandbox`, `agent.sandbox_allow_unsandboxed_exec` via `/api/config/kirocrew` | L help, schema |
| Sub-agents | ✓ `spawn run`, `spawn list` | ? | ✓ crew members, worker sessions | ✓ MCP `session_create` + `kirocrew-work`; `GET /api/sessions/{id}/agents` | L help, MCP source |
| Worktrees | ✗ (`pod` is for developing Kiro Crew itself) | ✗ | ? | ~ `POST /api/worktree/create` | L routes; behaviour not read |
| Background or parallel sessions | ~ `spawn run --async` | ✗ | ✓ parallel chat tabs, session grid | ✓ chat slots; MCP `session_create`, `session_broadcast`; `GET /api/sessions/health` | L help, routes, live GET |
| Session resume | ✗ | ? | ✓ restore tabs, archive | ✓ `POST /api/chat/slots/{slot}/resume`, `/continue`, `GET /api/chat/slots/unrestored`; MCP `session_revive`, `session_adopt` | L routes, MCP source |
| Hooks | ✗ | ✗ | ✓ | ✓ `/api/hooks*` (7 routes), `/api/webhooks*`; core MCP `register_hook` | L routes, `mcp_core_parts/crew.py` |
| MCP | ~ `app mcp` | ? | ✓ MCP panel | ✓ `/api/mcp*` (23), `/api/mcp-gateway/*` (7), `/api/capability/mcp*` | L help, routes |
| Skills or plugins | ~ `app install/...`, `learn`, `consolidate` | ? | ✓ app store, skills | ✓ `/api/skills*` (22), `/api/capability/skills*`, `/api/capability/plugins*`; core `skill_search`, `skill_fetch` | L help, routes, conductor `allowedTools` |
| Notifications | ✗ | ✗ | ✓ | ✓ `/api/notifications*` (7); core `send_notification` | L routes, conductor `allowedTools` |
| Remote or cloud runs | ✓ `cloud ...` (own EC2), `tailnet up/down/status`, `token` for remote links | ✗ | ✓ desktop remote tabs over SSH | ✓ `/api/instances*` (19), `/api/cloud*` (14), `/api/tailnet*` | L help, routes |
| Scheduled jobs | ✓ `cron list/add/update/remove/pause/resume/trigger/adopt/preview` | ✗ | ✓ schedules | ✓ `kirocrew-cron` MCP tools | L help, `mcp_cron_tool_list.py` |
| Work ledger (conductor items) | ✗ (`ledger-sweep` only lists or purges finished ledgers) | ✗ | ~ board tab (read) | ✗ no HTTP route; MCP `kirocrew-work` only | L route grep (no `work` route), `mcp_work.py` |

## CLI reference

**Method.** `--help` was run for every top-level command and every second-level subcommand (123), and there is no third level. Separately, the argparse tree was walked by stubbing `parse_args` so no command ran (`kiro_crew.cli.main` with a patched `ArgumentParser.parse_args`). That walk found 167 parser entries (44 top-level commands, 123 subcommands, 2 of them hidden), 310 flags (3 global, 307 on subcommands, 1 hidden) and 69 positionals. Meanings below are the first sentence of each help string; where the full text matters, run that `--help`. **L**

`-h, --help` is on every command and isn't repeated. `--no-jail` appears on `chat`, `run`, `consolidate` and `eval` as well as globally; it's a no-op on the public edition. Not every `{a,b}` in a usage line is a subcommand: `update [{approve}]`, `file-delivery {approve}`, `restore {replace,merge}` and `memory show [{preferences,projects,history}]` take positional choices, and `gateway --approval {...}` is a flag value. **L**

### Global

`kirocrew [-h] [--version] [-v] [--no-jail] <command> [<args>]` **L** `kirocrew --help`

| Flag | Meaning |
|---|---|
| `--version` | Print `kirocrew <version>` and exit |
| `--verbose`, `-v` | Increase log verbosity (`-v` INFO, `-vv` DEBUG) |
| `--no-jail` | Disable the process-isolation jail for this invocation (no-op on the public edition, which has no jail backend) |

### Hidden commands

These are left out of `--help` and out of argparse's "invalid choice" list by `cli_help.hide_internal_commands`. **L** (`kiro_crew/cli.py:474-541`)

| Command | What it is |
|---|---|
| `mcp-core`, `mcp-dashboard`, `mcp-work`, `mcp-cron`, `mcp-computer`, `mcp-crew-log`, `mcp-debug`, `mcp-panel`, `mcp-guide`, `mcp-mate` | The stdio MCP servers that agent specs mount. "Spawned by the agent backend, not user-facing." `mcp-computer` is a thin shim that forwards to the gateway |
| `mcp-<builtin>` | One for each builtin app that ships an `mcp_server.py`; only `mochi` does in 0.11.1, so `mcp-mochi` |
| `pod _run`, `pod _cleanup` | Internal steps of the developer `pod` command (no help text) |
| `snapshot --to <TO>` | A hidden flag (no help text) |

### `kirocrew gateway`

Start Kiro Crew in this terminal (dashboard + messaging channels). (L: `kirocrew gateway --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `gateway` | `--slack-only` | Slack-only mode — skip dashboard web server and SSH tunnel instructions |
| `gateway` | `--no-crons` | Skip cron scheduler — use when another instance handles cron execution |
| `gateway` | `--no-tunnel` | Never publish a tunnel — this process refuses to start or provision one for its whole life, whatever tunnel.enabled says |
| `gateway` | `--seed <FIXTURE>` | Seed $KIROCREW_HOME from the named fixture BEFORE starting the gateway (dev tool) |
| `gateway` | `--seed-replace` | When used with --seed, wipe $KIROCREW_HOME (rmtree) before copying the fixture |
| `gateway` | `--no-open` | Do not auto-open the dashboard URL in the default browser on startup |
| `gateway` | `--port <PORT>` | Override the dashboard port |
| `gateway` | `--json-ready` | Print a single line `KIROCREW_READY:{...}` to stdout once the dashboard is bound |
| `gateway` | `--approval {reads,yolo,interactive}` | Default approval mode for tool invocations |
| `gateway` | `--test-mode` | Convenience alias for --port auto --no-open --json-ready --approval reads |

### `kirocrew service`

Run the gateway as a background service that starts on boot. (L: `kirocrew service --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `service install` | | Install and start the gateway service (sudo on Linux) |
| `service uninstall` | | Stop and remove the gateway service (sudo on Linux) |
| `service status` | | Show service status (systemctl/launchctl) |

### `kirocrew doctor`

Verify this install and diagnose problems. (L: `kirocrew doctor --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `doctor` | `--bundle` | Collect logs + crash reports into a redacted diagnostics zip |

### `kirocrew status`

Show runtime stats. (L: `kirocrew status --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `status` | `--port <PORT>` | Dashboard port (default: resolved from KIROCREW_PORT env or dashboard.url config) |

### `kirocrew restart`

Restart a running gateway (service-aware). (L: `kirocrew restart --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `restart` | `--port <PORT>` | Dashboard port (default: resolved from KIROCREW_PORT env or dashboard.url config) |

**Under the desktop app** (L, 0.11.1, twice on 2026-11-01): `restart` asks the gateway to shut down, then exits 1 with `listener PID lookup is unavailable. Not starting a replacement because safe lock release cannot be proven.` The desktop app relaunches the gateway itself within about 20 s. Treat the exit 1 as expected and poll `http://127.0.0.1:5476/` until it answers 200. A restart clears YOLO mode, so set it again afterwards. 0.11.1's changelog says `restart` and `stop` now refuse a gateway the desktop app supervises.

### `kirocrew stop`

Stop a running gateway. (L: `kirocrew stop --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `stop` | `--port <PORT>` | Dashboard port (default: resolved from KIROCREW_PORT env or dashboard.url config) |
| `stop` | `--expect-pid <EXPECT_PID>` | Stop only if this pid is the sole listener on --port AND holds this home's gateway.lock; otherwise refuse and signal nothing |

### `kirocrew gateway-pid`

Print the PID holding this home's gateway lock (JSON). (L: `kirocrew gateway-pid --help`)

No flags beyond `-h, --help`.

### `kirocrew logs`

Show gateway logs. (L: `kirocrew logs --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `logs` | `-f, --follow` | Follow log output (live tail) |
| `logs` | `-n, --lines <LINES>` | Number of lines to show (default: 100) |

### `kirocrew token`

Print a dashboard access URL with auth token. (L: `kirocrew token --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `token` | `--port <PORT>` | Dashboard port (default: resolved from KIROCREW_PORT env or dashboard.url config) |
| `token` | `--ttl <TTL>` | Token TTL, e.g. 1h, 30m (default: 20h) |
| `token` | `--embed-parent-port <EMBED_PARENT_PORT>` | Parent dashboard port to authorize as a CSP frame-ancestor for the multi-instance embed (the embedding gateway's KIROCREW_PORT) |

### `kirocrew logout`

Revoke all active dashboard sessions. (L: `kirocrew logout --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `logout` | `--port <PORT>` | Dashboard port (default: resolved from KIROCREW_PORT env or dashboard.url config) |

### `kirocrew ledger-sweep`

List finished session/work ledgers; --purge deletes them. (L: `kirocrew ledger-sweep --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `ledger-sweep` | `--purge` | Actually delete the listed ledgers (irreversible) |
| `ledger-sweep` | `--older-than-days <N>` | Idle window before a ledger qualifies (default: 30) |
| `ledger-sweep` | `--purge-unreadable` | With --purge: also delete records this sweep could not parse (they are listed but kept by default) |

### `kirocrew update`

Update Kiro Crew to the latest version. (L: `kirocrew update --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `update` | `[{approve}]` | approve: approve a pending in-app update armed from the dashboard |
| `update` | `--force` | Discard local commits when a git checkout has diverged from its upstream (git installs only) |

### `kirocrew setup`

Install agent config and run the setup wizard. (L: `kirocrew setup --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `setup` | `--agent-only` | Only install the agent config, skip the interactive wizard steps |
| `setup` | `--slack` | Also run the guided Slack credential setup (messaging channels are otherwise connected later from the dashboard); ignored with --agent-only |
| `setup` | `--whatsapp` | Also run the guided WhatsApp setup: report the optional 'whatsapp' extra and the pairing state, then enable the channel; ignored with --agent-only |
| `setup` | `--electron-only` | Only install the Kiro Crew desktop app (macOS), skip other setup |
| `setup` | `--clean` | Fresh install — don't merge MCP servers/tools from existing config |

### `kirocrew config`

Get or set configuration values. (L: `kirocrew config --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `config get` | | Get a config value (or all if no key) |
| `config get` | `[<key>]` | Dot-separated key (e.g. agent.provider) |
| `config set` | | Set a config value |
| `config set` | `[<key>]` | Dot-separated key (e.g. agent.provider) |
| `config set` | `[<value>]` | Value to set |
| `config set` | `--value-base64 <TOKEN>` | Value as standard Base64 of its UTF-8 text, attached with '=' (--value-base64=TOKEN) so no shell can alter or drop it; an empty token sets empty text |
| `config set` | `--file, -f <FILE>` | Load full config from a JSON file |
| `config set` | `--local` | Save to config.local.json, the overlay whose values win over config.json |
| `config edit` | | Open config in $EDITOR |
| `config defaults` | | Review stored values that still hold a superseded default |
| `config defaults` | `[<keys>...]` | Limit to these dotted keys (default: every drifted key) |
| `config defaults` | `--adopt` | Remove the stored keys so the current defaults apply |
| `config defaults` | `--keep` | Record the stored values as intentional and stop reporting them |

### `kirocrew sandbox`

Manage the AppArmor profile the agent sandbox needs (Linux). (L: `kirocrew sandbox --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `sandbox install-profile` | | Attach the userns AppArmor profile to this app (sudo on Linux) |
| `sandbox install-profile` | `--path <PATH>` | Executable to attach the profile to |
| `sandbox status` | | Report whether this launch is covered by the profile |
| `sandbox status` | `--path <PATH>` | Executable to check instead of $APPIMAGE |
| `sandbox remove-profile` | | Unload and remove the profile (sudo on Linux) |

### `kirocrew kas`

Install Kiro Crew's own KAS engine bundle (no kiro-cli needed). (L: `kirocrew kas --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `kas install` | | Download this release's pinned KAS engine + Node runtime |
| `kas install` | `--version <VERSION>` | Engine version to install (default: this release's pin, 0.66.33) |
| `kas install` | `--unpinned` | Accept a manifest this release does not pin (another --version, or a republished one) |
| `kas install` | `--url <URL>` | https:// base url to fetch from (default: agent.kas_bundle_url) |
| `kas install` | `--from <DIR>` | Install from a local directory holding manifest.json and the artifacts it names, instead of downloading (offline installs, mirrors, development) |
| `kas install` | `--force` | Replace an already-installed copy of that version |
| `kas status` | | Show the pinned engine, what is installed, and the route |
| `kas remove` | | Delete installed engine versions |
| `kas remove` | `--version <VERSION>` | Delete only this version (default: every version) |
| `kas remove` | `--yes` | Do not ask for confirmation |

### `kirocrew manifest`

Generate a Slack app manifest with your alias. (L: `kirocrew manifest --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `manifest` | `--alias <ALIAS>` | Override alias (default: auto-detect) |
| `manifest` | `-o, --output <OUTPUT>` | Output file (default: stdout) |
| `manifest` | `--url` | Print a one-click Slack app creation URL |

### `kirocrew chat`

Chat with the agent. (L: `kirocrew chat --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `chat` | `--no-jail` | Disable the process-isolation jail for this invocation (no-op on the public edition, which has no jail backend) |
| `chat` | `-m, --message <MESSAGE>` | Single message (non-interactive) |
| `chat` | `--model <MODEL>` | Model to use (default: from config) |
| `chat` | `--agent <AGENT>` | Agent to use (default: from config) |

### `kirocrew run`

Run an autonomous task from a spec file. (L: `kirocrew run --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `run` | `<spec>` | Path to the spec/task file (e.g. TASK.md) |
| `run` | `--no-jail` | Disable the process-isolation jail for this invocation (no-op on the public edition, which has no jail backend) |
| `run` | `--name <NAME>` | Human-readable task name (auto-derived from spec if omitted) |
| `run` | `--no-test` | Skip running build/test verification after each step |
| `run` | `--fresh` | Ignore checkpoint, start task from scratch |
| `run` | `--timeout <TIMEOUT>` | Global timeout in seconds (0 = no limit) |
| `run` | `--port <PORT>` | Dashboard port for status |

### `kirocrew cron`

Manage scheduled jobs. (L: `kirocrew cron --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `cron list` | | List cron jobs |
| `cron add` | | Add a cron job |
| `cron add` | `<name>` | Job name |
| `cron add` | `<message>` | Message to send to the agent |
| `cron add` | `--every <EVERY>` | Interval in seconds |
| `cron add` | `--cron <CRON_EXPR>` | Cron expression (e.g. "0 9 * * MON-FRI") |
| `cron add` | `--at <AT>` | One-shot: fire once at this time and then delete the job |
| `cron add` | `--timezone <TIMEZONE>` | IANA timezone the job's wall clock is read in (e.g. America/New_York): the --cron expression's fields, or an --at time string such as '9am' |
| `cron add` | `--channel <CHANNEL>` | Slack channel ID to post results to |
| `cron add` | `--agent <AGENT>` | Agent name for this job (e.g. 'customer360-code-agent') |
| `cron add` | `--script <FILE.py:FUNC>` | Zero-token job: run this Python function instead of prompting an agent |
| `cron add` | `--command <SHELL>` | Zero-token job: run this shell command (sh -c, sandboxed) instead of prompting an agent |
| `cron add` | `--timeout <TIMEOUT>` | Subprocess timeout in seconds for a --script/--command job (0..3600; omit for the store's per-kind default) |
| `cron add` | `--timeout-secs <TIMEOUT_SECS>` | Per-wake execution budget in seconds (1..86400, default 1800) |
| `cron add` | `--auto-pause-after <AUTO_PAUSE_AFTER_FAILURES>` | Consecutive failed runs before the job auto-pauses (0..10000, default 5; 0 = never auto-pause |
| `cron add` | `--model <MODEL>` | Model id for the agent wake (as advertised by kiro-cli --list-models) |
| `cron add` | `--persistent-session, --no-persistent-session` | Resume one long-lived session across wakes (default on) |
| `cron add` | `--minimal-context, --no-minimal-context` | Wake with a ~200-token context instead of the full memory/lessons/steering load (default off) |
| `cron add` | `--hide-in-chat, --no-hide-in-chat` | Keep the job's wakes out of the chat sidebar |
| `cron add` | `--silent` | Suppress auto-delivery; agent controls notifications |
| `cron add` | `--folder <FOLDER>` | Schedule-page folder to file the job in (existing folder name or id) |
| `cron add` | `--approval-mode {auto}` | Tool approval mode ("auto" to auto-approve all tools) |
| `cron add` | `--managed-by <KEY>` | Install-time owner key for an external installer (e.g. 'mysystem:owner/asset-name') |
| `cron update` | | Update a cron job |
| `cron update` | `<job_id>` | Job ID to update |
| `cron update` | `--name <NAME>` | New job name |
| `cron update` | `--message <MESSAGE>` | New message |
| `cron update` | `--every <EVERY_SECS>` | New interval in seconds |
| `cron update` | `--timeout-secs <TIMEOUT_SECS>` | Per-wake execution budget in seconds (1..86400, default 1800) |
| `cron update` | `--auto-pause-after <AUTO_PAUSE_AFTER_FAILURES>` | Consecutive failed runs before the job auto-pauses (0..10000, default 5; 0 = never auto-pause |
| `cron update` | `--cron <CRON_EXPR>` | New cron expression |
| `cron update` | `--channel <CHANNEL>` | New channel ID |
| `cron update` | `--agent <AGENT>` | New agent name (empty string resets to default kirocrew agent) |
| `cron update` | `--approval-mode {auto,default}` | Tool approval mode ("auto" to auto-approve, "default" to reset) |
| `cron remove` | | Remove a cron job |
| `cron remove` | `[<job_id>]` | Job ID to remove |
| `cron remove` | `--managed-by <KEY>` | Remove the job registered with 'cron add --managed-by KEY' |
| `cron pause` | | Pause a cron job |
| `cron pause` | `<job_id>` | Job ID to pause |
| `cron resume` | | Resume a cron job |
| `cron resume` | `<job_id>` | Job ID to resume |
| `cron trigger` | | Trigger a cron job immediately |
| `cron trigger` | `<job_id>` | Job ID to trigger |
| `cron adopt` | | Give a cron job an owning chat session, so that session can manage it and receives its results |
| `cron adopt` | `<job_id>` | Job ID to adopt |
| `cron adopt` | `--session-of <SESSION>` | Dashboard slot name ("chat-3-1712793600") or a fully-qualified session key ("dashboard:chat-3-1712793600"); see `kirocrew cron list` |
| `cron adopt` | `--release` | Clear the owning session, returning the job to CLI/dashboard-only management |
| `cron preview` | | Run a script cron locally with real MCP tools; notifications are captured and printed instead of delivered |
| `cron preview` | `<script>` | Script file in file.py:function format (e.g. ~/.kiro/crew/crons/my.py:run) |
| `cron preview` | `--message, -m <MESSAGE>` | ctx.message value |
| `cron preview` | `--env, -e <K=V>` | Extra env vars (repeatable) |

### `kirocrew spawn`

Manage background subagents. (L: `kirocrew spawn --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `spawn` | `--port <PORT>` | Dashboard port |
| `spawn run` | | Spawn a subagent |
| `spawn run` | `<task>` | Task for the subagent |
| `spawn run` | `--async` | Fire-and-forget (don't wait for result) |
| `spawn run` | `--agent <NAME>` | Run under this agent template; an unknown name is refused, never replaced |
| `spawn run` | `--crew <NAME>` | Run as this crew member, with its memory store and template; an unknown member is refused, never replaced |
| `spawn run` | `--model <ID>` | Run on this model id; it outranks the member's and the template's pin |
| `spawn list` | | List subagents |

### `kirocrew computer`

Computer-use (desktop automation) diagnostics. (L: `kirocrew computer --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `computer` | `<computer_args>` | computer sub-command and its arguments |

### `kirocrew memory`

Manage memory (vector store + markdown layer). (L: `kirocrew memory --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `memory list` | | Show semantic memory entries |
| `memory search` | | Search memory (vector + markdown layers) |
| `memory search` | `<query>` | Search query text |
| `memory search` | `--layer {vector,history,all}` | Which memory to search: vector (episodic semantic recall), history (keyword FTS over preferences/projects/daily history), or all (default) |
| `memory show` | | Show the markdown memory layer (preferences, projects, daily history) |
| `memory show` | `[{preferences,projects,history}]` | Layer to show (default: all three) |
| `memory show` | `--format {md,json}` | Output format: raw markdown or structured JSON (default: md) |
| `memory show` | `--since <SINCE>` | History only: include days on or after DATE (YYYY-MM-DD) |
| `memory stats` | | Show memory statistics |
| `memory audit` | | Scan memory for suspicious content |
| `memory export` | | Export one memory store's rows to JSON |
| `memory export` | `--output, -o <OUTPUT>` | Output file (default: stdout) |
| `memory export` | `--store <STORE>` | Store to export (default: the default store) |
| `memory export` | `--include-markdown` | Also include the markdown layer (preferences, projects, daily history) |
| `memory migrate` | | Migrate legacy markdown memory to vector store |
| `memory backup` | | Back up active memory stores now |
| `memory backup` | `--keep <KEEP>` | How many backups to keep per store |
| `memory backups` | | List memory backups, newest first |
| `memory backups` | `--store <STORE>` | Only this store |
| `memory restore` | | Restore a memory store from a backup |
| `memory restore` | `--store <STORE>` | Store to restore (default: the default store) |
| `memory restore` | `--from <FROM_BACKUP>` | Backup file to restore (default: the newest for that store) |
| `memory restore` | `--cancel-pending` | Cancel a staged memory restore without changing active memory |
| `memory create-store` | | Create a declared memory store's directory (use never creates it) |
| `memory create-store` | `<name>` | The declared store's name |
| `memory carve` | | Filter or count a crew store's memory by its carve facets |
| `memory carve` | `--store <STORE>` | Memory store to read (default: the default store, which carries no facets) |
| `memory carve` | `--scope <SCOPE>` | Only rows carved to this repo scope |
| `memory carve` | `--surface <SURFACE>` | Only rows from this surface |
| `memory carve` | `--crew <CREW>` | Only rows this crew produced |
| `memory carve` | `--session-key <SESSION_KEY>` | Only rows from this conversation |
| `memory carve` | `--derived-from <DERIVED_FROM>` | Only rows synthesized from this item id |
| `memory carve` | `--kind {directive,fact,episode}` | Only rows of this kind |
| `memory carve` | `--count-by {scope,surface,crew,session_key,derived_from,kind}` | Report counts grouped by this axis instead of listing rows |
| `memory carve` | `--limit <LIMIT>` | How many rows to list |
| `memory carve` | `--offset <OFFSET>` | Rows to skip when listing |
| `memory retired` | | List episodes a semantic write superseded, and restore one |
| `memory retired` | `--restore <RESTORE_ID>` | Restore this id |
| `memory retired` | `--limit <LIMIT>` | How many to list |
| `memory forget` | | Delete one semantic memory key after you confirm it (owner only; needs a terminal and the running gateway) |
| `memory forget` | `<key>` | Semantic memory key to forget |
| `memory forget` | `--superseded-by <SUPERSEDED_BY>` | Live key that replaces this one; recorded on the tombstone |
| `memory import` | | Import memory from JSON file |
| `memory import` | `<file>` | Path to JSON file (export format) |
| `memory import` | `--store <STORE>` | Store to import into (default: the default store) |

### `kirocrew knowledge`

Knowledge Base maintenance. (L: `kirocrew knowledge --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `knowledge dedup` | | Collapse cross-source duplicate documents (dry-run unless --apply) |
| `knowledge dedup` | `--apply` | Apply the deletions (default: dry-run preview that changes nothing) |
| `knowledge stats` | | Count sources, documents and items in the knowledge library (read-only) |
| `knowledge stats` | `--json` | Emit the counts as JSON instead of a table |

### `kirocrew learn`

Save or manage learned corrections. (L: `kirocrew learn --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `learn add` | | Save a lesson |
| `learn add` | `<rule>` | The rule or correction to remember |
| `learn add` | `--category {tool,preference,knowledge}` | Lesson category (default: knowledge) |
| `learn add` | `--negative <NEGATIVE>` | What NOT to do (optional) |
| `learn list` | | List all lessons |
| `learn remove` | | Remove lessons matching a substring |
| `learn remove` | `<query>` | Substring to match against lesson rules |
| `learn remove` | `--repo-scope <REPO_SCOPE>` | Only remove lessons carrying this repo scope |

### `kirocrew consolidate`

Force history consolidation (triggers skill extraction). (L: `kirocrew consolidate --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `consolidate` | `[<session_key>]` | Session key to consolidate (omit to list pending sessions) |
| `consolidate` | `--no-jail` | Disable the process-isolation jail for this invocation (no-op on the public edition, which has no jail backend) |
| `consolidate` | `--all` | Consolidate all sessions with unconsolidated messages |

### `kirocrew artifact`

Manage saved artifacts (LLM-generated UI). (L: `kirocrew artifact --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `artifact list` | | List saved artifacts |
| `artifact list` | `--tag <TAG>` | Filter by tag |
| `artifact list` | `--kind {widget,html,markdown,svg,json,text,image}` | Filter by kind |
| `artifact list` | `-q, --q <Q>` | Substring filter on artifact name |
| `artifact show` | | Print an artifact's content |
| `artifact show` | `<slug>` | Artifact slug |
| `artifact show` | `--version <VERSION>` | Specific version (default: current) |
| `artifact show` | `--meta` | Print metadata as JSON instead of the content body |
| `artifact save` | | Save a new artifact |
| `artifact save` | `--name <NAME>` | Human-readable name |
| `artifact save` | `--slug <SLUG>` | Explicit slug instead of one derived from --name |
| `artifact save` | `--kind {widget,html,markdown,svg,json,text,image}` | Artifact kind (default: inferred from content / file extension) |
| `artifact save` | `--content <CONTENT>` | Inline content |
| `artifact save` | `--content-file <CONTENT_FILE>` | Path to file containing the content |
| `artifact save` | `--description <DESCRIPTION>` | Short description |
| `artifact save` | `--tags <TAGS>` | Comma-separated tag list |
| `artifact update` | | Update an artifact in place |
| `artifact update` | `<slug>` | Artifact slug to update |
| `artifact update` | `--content <CONTENT>` | Inline new content |
| `artifact update` | `--content-file <CONTENT_FILE>` | Path to file containing new content |
| `artifact update` | `--name <NAME>` | New name (rename) |
| `artifact update` | `--description <DESCRIPTION>` | New description |
| `artifact update` | `--tags <TAGS>` | Replacement tag list (comma-separated) |
| `artifact delete` | | Delete an artifact and all its versions |
| `artifact delete` | `<slug>` | Artifact slug to delete |
| `artifact versions` | | List the version numbers for an artifact |
| `artifact versions` | `<slug>` | Artifact slug |

### `kirocrew app`

Manage Kiro Crew apps. (L: `kirocrew app --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `app install` | | Install an app from a local directory |
| `app install` | `<source>` | Path to app directory containing app.json |
| `app import` | | Convert a manifest-declared plugin package into an app directory |
| `app import` | `<source>` | Path to the plugin package directory |
| `app import` | `--out <OUT>` | Output app directory (default: ./<app-name>-app) |
| `app import` | `--name <NAME>` | Override the derived app name (kebab-case) |
| `app import` | `--install` | Install the converted app after writing it |
| `app list` | | List installed apps |
| `app enable` | | Enable an installed app |
| `app enable` | `<name>` | App name to enable |
| `app disable` | | Disable an installed app |
| `app disable` | `<name>` | App name to disable |
| `app mcp` | | Run an app's MCP server on stdio (spawned by kiro-cli, not for humans) |
| `app mcp` | `<name>` | App name whose MCP server to run |
| `app uninstall` | | Uninstall an app (preserves app data by default) |
| `app uninstall` | `<name>` | App name to uninstall |
| `app uninstall` | `--purge-data` | Permanently delete the app data directory |
| `app info` | | Show app details |
| `app info` | `<name>` | App name |
| `app dev` | | Toggle dev mode (no-store UI serving + live reload on file change) |
| `app dev` | `<name>` | App name |
| `app dev` | `--off` | Turn dev mode off |
| `app dev` | `--confirm-out-of-install-root` | Confirm enabling dev mode on a ui root that resolves outside the app's install directory (e.g. a ui/ symlinked to your source tree) |
| `app init` | | Scaffold a new app |
| `app init` | `<name>` | App name (kebab-case) |
| `app init` | `--dir <DIR>` | Output directory (default: current) |
| `app init` | `--backend` | Include backend stub |
| `app init` | `--ui` | Include UI frontend (ESM + Vite) |
| `app init` | `--cron` | Include sample cron job |

### `kirocrew agent`

Manage Kiro Crew agent definitions. (L: `kirocrew agent --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `agent list` | | List Kiro Crew agents |
| `agent create` | | Create a Kiro Crew agent |
| `agent create` | `--name <NAME>` | Agent id, or any name: shown as typed, stored under a URL-safe id |
| `agent create` | `--display-name <DISPLAY_NAME>` | Label the dashboard shows |
| `agent create` | `--kiro-agent <KIRO_AGENT>` | Kiro agent name |
| `agent create` | `--workspace <WORKSPACE>` | Share an existing workspace by name; omitted, the member gets a workspace of its own (member-<slug>) |
| `agent create` | `--memory-store <MEMORY_STORE>` | Create a fresh member store (already enabled for explicit member creation) |
| `agent create` | `--model <MODEL>` | Default model for the agent's sessions; omitted or 'auto', it follows the template's pinned model, then agent.model |
| `agent update` | | Update a Kiro Crew agent |
| `agent update` | `<name>` | Agent name to update |
| `agent update` | `--kiro-agent <KIRO_AGENT>` | New kiro agent name |
| `agent update` | `--workspace <WORKSPACE>` | New workspace name |
| `agent update` | `--display-name <DISPLAY_NAME>` | New label the dashboard shows; "" clears it back to the agent name |
| `agent update` | `--memory-store <MEMORY_STORE>` | Existing memory store identity (cannot be changed, except to 'default' from a store name the config refuses) |
| `agent update` | `--model <MODEL>` | New default model for the agent's sessions; "" or 'auto' clears the pin so it follows the template's pinned model, then agent.model |
| `agent delete` | | Delete a Kiro Crew agent |
| `agent delete` | `<name>` | Agent name to delete |
| `agent reset-model` | | Clear an agent spec's pinned model so it tracks the shipped default again |
| `agent reset-model` | `--agent <AGENT>` | Kiro agent spec to reset (default: kirocrew) |

### `kirocrew workspace`

Manage workspace definitions. (L: `kirocrew workspace --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `workspace list` | | List workspaces |
| `workspace create` | | Create a workspace |
| `workspace create` | `--name <NAME>` | Workspace name |
| `workspace create` | `--dir <DIR>` | Workspace directory NAME, relative to the KiroCrew data home (default: workspace-<name>) |
| `workspace create` | `--copy-from <COPY_FROM>` | Copy dir from an existing workspace |
| `workspace update` | | Update a workspace |
| `workspace update` | `<name>` | Workspace name to update |
| `workspace update` | `--dir <DIR>` | New workspace directory NAME, relative to the KiroCrew data home |
| `workspace delete` | | Delete a workspace |
| `workspace delete` | `<name>` | Workspace name to delete |

### `kirocrew secrets`

Migrate .env credentials into the encrypted secret vault. (L: `kirocrew secrets --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `secrets import` | | Migrate plaintext .env credentials into the vault (dry-run unless --apply) |
| `secrets import` | `--apply` | Store the secrets and rewrite .env to secret:// refs (default: dry-run) |

### `kirocrew security`

Security audit and deny list. (L: `kirocrew security --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `security audit` | | Scan conversation history for suspicious tool usage |
| `security deny-list` | | Show active deny patterns |
| `security events` | | Show recent security event log entries |
| `security events` | `-n, --limit <LIMIT>` | Number of entries |
| `security events` | `--since <SINCE>` | Only entries at or after a relative age (30m, 2h, 7d) or an ISO 8601 instant (2026-08-21, 2026-08-21T04:00:00Z) |
| `security events` | `--until <UNTIL>` | Only entries before a relative age (30m, 2h, 7d) or an ISO 8601 instant (2026-08-21, 2026-08-21T04:00:00Z) |
| `security verify` | | Verify security event log HMAC integrity |

### `kirocrew file-delivery`

Approve delivery of scanner-flagged files (host step-up). (L: `kirocrew file-delivery --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `file-delivery` | `{approve}` | approve: finish a flagged-file delivery consent armed from the dashboard's Security panel (proves you are at the host) |

### `kirocrew policy`

Inspect the governance security policy + profiles. (L: `kirocrew policy --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `policy show` | | Show the effective enterprise security policy |
| `policy show` | `--ids` | List each denied-command category's rule ids (default: counts only) |
| `policy validate` | | Validate the policy + all profiles (load-check) |
| `policy explain` | | Explain a tool/scope decision for a surface |
| `policy explain` | `<scope>` | Governed scope, e.g. 'commands' or 'mcp' |
| `policy explain` | `<item>` | The item to evaluate, e.g. 'git push origin' |
| `policy explain` | `--session-key <SESSION_KEY>` | Surface session key (default: cli_chat) |
| `policy explain` | `--agent <AGENT>` | Agent name (optional) |
| `policy explain` | `--app <APP>` | App slug (optional) |
| `policy profile` | | Show a profile by name |
| `policy profile` | `<name>` | Profile file stem (without .json) |
| `policy source` | | Show whether this host fetches its policy from a central source |
| `policy fetch` | | Fetch the central policy now and apply it if it is usable |
| `policy fetch` | `--force` | Ignore the cached validators and re-download the whole document |

### `kirocrew telemetry`

Inspect or disable anonymous usage telemetry. (L: `kirocrew telemetry --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `telemetry status` | | Show exactly what the anonymous beacon sends (and whether it will) |
| `telemetry disable` | | Turn the anonymous beacon off permanently |
| `telemetry enable` | | Turn the anonymous beacon back on |

### `kirocrew cloud`

Run Kiro Crew on your own AWS EC2 instance. (L: `kirocrew cloud --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `cloud launch` | | Provision + configure an instance |
| `cloud launch` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud launch` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud launch` | `--size {light,balanced,power,light-x86,balanced-x86,power-x86}` | Instance size tier (default: balanced / interactive picker) |
| `cloud launch` | `--subnet <SUBNET_ID>` | Launch into this exact subnet (subnet-xxxx) instead of network auto-discovery — required to target a dedicated/private-subnet VPC when a default VPC exists |
| `cloud launch` | `--ami <AMI_ID>` | Launch from this AMI (ami-xxxx) instead of the latest Amazon Linux 2023 image |
| `cloud launch` | `--extra-packages <PKGS>` | Extra dnf packages to install on the box, comma-separated (e.g. "gh,jq") |
| `cloud launch` | `--ssm-kms-key <KEY_ARN>` | Full ARN of the KMS key your org pins for Session Manager encryption |
| `cloud launch` | `-y, --yes` | Accept defaults, no prompts |
| `cloud launch` | `--new` | Create a separate new instance instead of resuming the saved one |
| `cloud launch` | `--keep-on-failure` | On bootstrap failure, keep the instance (disable rollback) for inspection |
| `cloud launch` | `--identity-provider <IDENTITY_PROVIDER>` | IAM Identity Center start URL (your organization's access portal) for enterprise SSO |
| `cloud launch` | `--license {,free,pro}` | Kiro license tier (pro for Identity Center, free for Builder ID/social) |
| `cloud launch` | `--idp-region <IDP_REGION>` | IAM Identity Center region (e.g. us-east-1), NOT the EC2 instance region |
| `cloud launch` | `--no-inherit-identity` | Do not inherit this machine's Kiro sign-in (kiro-cli whoami) as the crew's identity; sign the crew in with Builder ID unless --identity-provider is given |
| `cloud list` | | List your Kiro Crew cloud instances |
| `cloud list` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud list` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud status` | | Show one instance's state |
| `cloud status` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud status` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud status` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud connect` | | Open the dashboard over an SSM tunnel |
| `cloud connect` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud connect` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud connect` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud connect` | `--local-port <LOCAL_PORT>` | Local port to forward the dashboard to (default: 5599) |
| `cloud connect` | `--no-browser` | Open the tunnel but don't launch a browser |
| `cloud tunnel` | | Open the dashboard SSM tunnel (standalone; alias of connect) |
| `cloud tunnel` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud tunnel` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud tunnel` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud tunnel` | `--local-port <LOCAL_PORT>` | Local port to forward the dashboard to (default: 5599) |
| `cloud tunnel` | `--no-browser` | Open the tunnel but don't launch a browser |
| `cloud login` | | Sign kiro-cli in on the instance (fixes 'not logged in' chat errors) |
| `cloud login` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud login` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud login` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud login` | `--no-browser` | Print the device URL but don't open a browser |
| `cloud login` | `--identity-provider <IDENTITY_PROVIDER>` | IAM Identity Center start URL (your organization's access portal) for enterprise SSO |
| `cloud login` | `--license {,free,pro}` | Kiro license tier (pro for Identity Center, free for Builder ID/social) |
| `cloud login` | `--idp-region <IDP_REGION>` | IAM Identity Center region (e.g. us-east-1), NOT the EC2 instance region |
| `cloud logout` | | Sign kiro-cli out on the instance (to switch Kiro account) |
| `cloud logout` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud logout` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud logout` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud stop` | | Stop the instance (pause billing) |
| `cloud stop` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud stop` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud stop` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud start` | | Start a stopped instance |
| `cloud start` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud start` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud start` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud destroy` | | Remove the instance and ALL its AWS resources |
| `cloud destroy` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud destroy` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud destroy` | `--tag <TAG>` | Instance tag (default: last launched) |
| `cloud destroy` | `-y, --yes` | Skip the confirmation prompt |
| `cloud destroy` | `--dry-run` | Show the delete command, don't run it |
| `cloud iam-policy` | | Print the least-privilege IAM policy to apply |
| `cloud iam-policy` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud iam-policy` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud iam-policy` | `--host-policies` | Print the second policy that lets the launcher attach this build's host policies (only when the edition adds some) |
| `cloud iam-boundary` | | Pre-create the immutable EC2 + Fargate permissions boundaries (admin, one-time) |
| `cloud iam-boundary` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud iam-boundary` | `--region <REGION>` | AWS region (default: saved / us-east-1) |
| `cloud iam-boundary` | `--ssm-kms` | Also pre-create the opt-in KMS-session instance boundary that `cloud launch --ssm-kms-key` uses |
| `cloud iam-boundary` | `--upgrade` | Upgrade an existing instance boundary that holds the document an earlier build created (with --ssm-kms, the KMS-session boundary too) |
| `cloud doctor` | | Check cloud prerequisites + AWS reachability |
| `cloud doctor` | `--profile <PROFILE>` | AWS profile name (default: saved / CLI default) |
| `cloud doctor` | `--region <REGION>` | AWS region (default: saved / us-east-1) |

### `kirocrew tailnet`

Publish this dashboard on your tailnet (Tailscale). (L: `kirocrew tailnet --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `tailnet status` | | Show whether the dashboard is published and trusted on your tailnet |
| `tailnet status` | `--port <PORT>` | Dashboard port to publish (default: discover the running gateway) |
| `tailnet up` | | Publish the dashboard on your tailnet and trust its origin |
| `tailnet up` | `--port <PORT>` | Dashboard port to publish (default: discover the running gateway) |
| `tailnet down` | | Stop publishing the dashboard on your tailnet |
| `tailnet down` | `--port <PORT>` | Dashboard port to publish (default: discover the running gateway) |

### `kirocrew snapshot`

Create a portable backup of Kiro Crew state. (L: `kirocrew snapshot --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `snapshot` | `[<output_dir>]` | Directory to write the snapshot into (default: the data home's snapshots dir) |
| `snapshot` | `--keep <KEEP>` | Keep N most recent snapshots |
| `snapshot` | `--strict` | Exit 3 instead of 0 when the bundle was written but omits entries it was asked to carry (see MANIFEST.json 'skipped') |
| `snapshot` | `--list` | List existing snapshots |
| `snapshot` | `--allow-unpinned-staging` | Stage by path name on a platform that cannot open a directory relative to a descriptor (Windows) |
| `snapshot` | `--components <COMPONENTS>` | Comma-separated components to include (default: all); see restore --list-components |
| `snapshot` | `--purpose {backup,share}` | backup = restoring onto a host you control, keeps credential-bearing components (the default, and the only one that produces a bundle today); share = leaves your control, so it carries only  |
| `snapshot` | `--max-archive-gib <MAX_ARCHIVE_GIB>` | Set the bound on a bundle's uncompressed content in GiB (default 4, at most 1024) for this run only |
| `snapshot` | `--to <TO>` | **Hidden** (no help text). |

### `kirocrew restore`

Restore Kiro Crew state from a snapshot. (L: `kirocrew restore --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `restore` | `[<snapshot>]` | Path to snapshot .tar.gz |
| `restore` | `--mode {replace,merge}` | replace = overwrite existing state, merge = keep it and add (default: auto-detect) |
| `restore` | `--dry-run` | Preview what would be restored, write nothing |
| `restore` | `--components <COMPONENTS>` | Comma-separated components to restore |
| `restore` | `--list-components` | List restorable component names and exit |
| `restore` | `--force` | Restore even if gateway is running |
| `restore` | `--allow-unpinned-staging` | Restore by path name on a platform that cannot open a directory relative to a descriptor (Windows) |
| `restore` | `--max-archive-gib <MAX_ARCHIVE_GIB>` | Set the bound on a bundle's uncompressed content in GiB (default 4, at most 1024) for this run only |

### `kirocrew pod`

Isolated, throwaway, full-stack test instances per worktree. (L: `kirocrew pod --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `pod up` | | Schedule an isolated pod for a worktree |
| `pod up` | `<name>` | Worktree name |
| `pod up` | `--json` | Emit {base_url, token, port} as JSON |
| `pod up` | `--provision` | Provision (venv + SPA dist) if needed before bringing the pod up |
| `pod up` | `--ttl <TTL>` | Token TTL (default: 2h) |
| `pod up` | `--no-token` | Boot the pod but do NOT mint a dashboard token: `token` in the --json handle is empty and no /api/token/local call is made |
| `pod up` | `--seed <SEED>` | Pre-populate the isolated home |
| `pod up` | `--approval {reads,yolo,interactive}` | Approval mode the pod's gateway boots with, forwarded to `kirocrew gateway --approval` |
| `pod up` | `--crons` | Run the pod's cron scheduler |
| `pod up` | `--no-embeddings` | Boot without the embedding model: the pod never downloads it and memory/knowledge search falls back to keyword matching (a documented mode) |
| `pod up` | `--wait-secs <SECS>` | Health-wait budget in seconds before `pod up` gives up on the gateway answering /api/health (default: 90; a first boot does migration and staging work, so slow hosts may need more) |
| `pod down` | | Evict a pod (zero residue) |
| `pod down` | `<name>` | Worktree name |
| `pod ls` | | List running pods |
| `pod ls` | `--json` | Emit rows as JSON |
| `pod prune` | | Reclaim orphaned pod HOMEs in bulk (the N-at-once `pod down`) |
| `pod prune` | `--older-than <OLDER_THAN>` | Only reclaim orphans whose last activity is older than this (e.g. 3d, 12h, 30m, 45s) |
| `pod prune` | `--all` | Reclaim ALL orphans regardless of age (overrides --older-than) |
| `pod prune` | `--dry-run` | Classify and print what would be reclaimed without deleting anything |
| `pod prune` | `--json` | Emit per-name results as JSON |
| `pod status` | | Up/down + health for one pod |
| `pod status` | `<name>` | Worktree name |
| `pod status` | `--json` | Emit status as JSON |
| `pod token` | | (Re)mint a dashboard token for a running pod |
| `pod token` | `<name>` | Worktree name |
| `pod token` | `--ttl <TTL>` | Token TTL (default: 2h) |
| `pod url` | | Print a pod's base URL |
| `pod url` | `<name>` | Worktree name |
| `pod scenarios` | | List the seed scenarios `pod up --seed <scenario>` accepts |
| `pod scenarios` | `--json` | Emit rows as JSON |
| `pod api` | | Call a running pod's HTTP API with its own token |
| `pod api` | `<name>` | Worktree name |
| `pod api` | `<METHOD>` | HTTP method: GET, HEAD, POST, PUT, PATCH or DELETE (case-insensitive) |
| `pod api` | `<path>` | API path; /api/ is prepended when absent |
| `pod api` | `--data <DATA>` | Request body, sent verbatim as application/json |
| `pod api` | `--allow-write` | Permit POST, PUT, PATCH, or DELETE (off by default) |
| `pod logs` | | Tail a pod's journal |
| `pod logs` | `<name>` | Worktree name |
| `pod logs` | `-n, --lines <LINES>` | Lines to tail (default: 50) |
| `pod exec` | | Run a kirocrew command against a pod, using the pod's own binary and data |
| `pod exec` | `<name>` | Worktree name |
| `pod exec` | `<-- ARGS>` | Command to run in the pod, e.g. `-- status` or `-- cron list` |
| `pod provision` | | Build a worktree's venv + SPA dist |
| `pod provision` | `<name>` | Worktree name |
| `pod provision` | `--venv-only` | Build only the venv (skip the slow dist) |
| `pod install` | | Lay down the systemd --user template unit (once) |
| `pod _run` | | **Hidden** internal subcommand (no help text) |
| `pod _cleanup` | | **Hidden** internal subcommand (no help text) |

### `kirocrew eval`

Run multi-session evaluation scenarios. (L: `kirocrew eval --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `eval` | `[<scenarios>...]` | Scenario names to run (without extension) |
| `eval` | `--no-jail` | Disable the process-isolation jail for this invocation (no-op on the public edition, which has no jail backend) |
| `eval` | `--all` | Run all scenarios |
| `eval` | `--judge` | Enable LLM judge scoring |

### `kirocrew bench`

Run external memory benchmarks (LongMemEval, LoCoMo). (L: `kirocrew bench --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `bench list` | | Show the available corpora and what is cached |
| `bench fetch` | | Download a corpus into the local cache and verify its checksum |
| `bench fetch` | `[<corpus>]` | Corpus key (see 'bench list') |
| `bench retrieval` | | Measure retrieval recall/nDCG against a corpus (deterministic) |
| `bench retrieval` | `[<corpus>]` | Corpus key |
| `bench retrieval` | `--instances <INSTANCES>` | Head-slice to N instances (smoke runs) |
| `bench retrieval` | `--queries <QUERIES>` | Head-slice to N queries per instance |
| `bench retrieval` | `--granularity {turn,session}` | One episodic fragment per utterance (default) or per session |
| `bench retrieval` | `--timeline {now,anchored,literal}` | How the corpus's dates map onto created_at |
| `bench retrieval` | `--no-mmr` | Disable the store's MMR diversity reranking (on by default in production) |
| `bench retrieval` | `--no-dedup` | Raise the near-duplicate cosine threshold above 1.0 so nothing can be judged a near-duplicate |
| `bench retrieval` | `--toy-embedder` | Use a deterministic hashed bag-of-words stand-in instead of the real model |
| `bench retrieval` | `--out-dir <OUT_DIR>` | Where to write the report (default: bench_results) |
| `bench retrieval` | `--stem <STEM>` | Report filename stem |
| `bench compare` | | Diff two saved JSON reports |
| `bench compare` | `<baseline>` | Path to the baseline .json report |
| `bench compare` | `<candidate>` | Path to the candidate .json report |
| `bench compare` | `-k <K>` | Cut-off to report (default: 5) |
| `bench kb-retrieval` | | Measure Knowledge Library recall/MRR/nDCG against a golden set (deterministic) |
| `bench kb-retrieval` | `[<golden>]` | Path to a golden-set JSON (default: the packaged kb_golden_v2.json) |
| `bench kb-retrieval` | `-k <K>` | Cut-off to headline in the printed summary (default: 3) |
| `bench kb-retrieval` | `--real-embedder` | Use the configured in-process embedder instead of the deterministic toy stand-in |
| `bench kb-retrieval` | `--no-embeddings` | Skip the vector leg entirely (keyword+graph only), to isolate the FTS contribution |
| `bench lesson-recall` | | Measure lesson ranking recall/MRR/nDCG against a golden set (deterministic) |
| `bench lesson-recall` | `[<golden>]` | Path to a golden-set JSON (default: the packaged lesson_golden_v1.json) |
| `bench lesson-recall` | `-k <K>` | Cut-off to headline in the printed summary (default: 3) |
| `bench lesson-recall` | `--real-embedder` | Use the configured in-process embedder instead of the deterministic toy stand-in |
| `bench lesson-recall` | `--no-embeddings` | Rank on the keyword measure alone, as a session with no vectors does |

### `kirocrew perf`

Debug-only performance sampling (off by default). (L: `kirocrew perf --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `perf sample` | | Sample stacks into a folded-stack profile |
| `perf sample` | `--seconds <SECONDS>` | Attach duration, 1-300 (default: 10) |
| `perf sample` | `--interval <INTERVAL>` | Seconds between samples, 0.001-1.0 (default: 0.005) |
| `perf sample` | `--pid <PID>` | Target PID (default: the running gateway) |
| `perf sample` | `--call <MODULE:CALLABLE>` | Profile 'module:callable' in this process instead of attaching |
| `perf sample` | `--output <OUTPUT>` | Where to write the profile (default: ./kirocrew-profile.folded) |

### `kirocrew desktop`

Debug-only desktop app diagnostics (requires KIROCREW_DEBUG). (L: `kirocrew desktop --help`)

| Command | Flag or argument | Meaning |
|---|---|---|
| `desktop metrics` | | Show the desktop app's recorded per-process CPU and memory metrics |
| `desktop metrics` | `--path <PATH>` | Read a specific desktop-metrics.json instead of probing the app's log directory |
| `desktop metrics` | `--json` | Emit the raw artifact as JSON |
| `desktop metrics` | `--top <TOP>` | How many processes to list (default: 5) |
| `desktop tunnel` | | Keep the desktop app's SSH forward to a remote crew alive (client-only mode) |
| `desktop tunnel` | `--host <HOST>` | ssh host or ssh-config alias of the crew |
| `desktop tunnel` | `--local-port <LOCAL_PORT>` | Loopback port the app connects to |
| `desktop tunnel` | `--remote-port <REMOTE_PORT>` | Port the crew listens on over there |

## Gateway HTTP API

### Driving it from a script (learned in ticket 128)

- **Mint once, then poll with plain Python.** Importing `kiro_crew` to mint a token costs about 0.8 GB per process. A long-lived watcher that kept it loaded used enough of the 0.6–2.5 GB free that Kiro Crew's spawn gate paused and the conductor halted. Mint a token in one short call, write it to a scratch file, poll with `python -I` and `urllib`, and delete the file afterwards.
- **Approvals need a human decision before dispatch.** An approval prompt nobody answers is declined after `tool_approval_timeout_secs` (600 s). Claude Code's permission check refused a script that answered prompts by policy, so ask the user before dispatch to pick the approval mode (`POST /api/chat/mode` `normal`, `trust_reads`, `trust` or `yolo`), or to answer in the app. YOLO lasts until the next gateway shutdown.
- **Run API calls from PowerShell, or with `MSYS_NO_PATHCONV=1`.** Git Bash rewrites `/api/...` arguments into Windows paths.

### Auth

- **Token cookie.** The browser and API clients send the access token as cookie `mc_token_<port>`, here `mc_token_5476`. A paired refresh cookie `mc_refresh_<port>` (HttpOnly, path `/api/auth`) rotates through `POST /api/auth/refresh`. **L** (`dashboard/handlers/auth_refresh.py`, `dashboard/refresh_tokens.py`); refresh flow **D** `.references/kirocrew/docs/system-specs/modules/dashboard-token-auth.md`
- **Without a cookie,** `GET /api/config/schema` returned 403. **L** (run)
- **Minting a token locally.** The gateway keeps a local secret. `read_local_secret(port, dial_host="127.0.0.1")` reads it; the function is defined in `kiro_crew.config.loader` and imported by `kiro_crew.cli_server` and `cli_server_requests`. Send it as header `X-Local-Secret` to `GET /api/token/local?ttl=<dur>`. The reply is JSON `{token, expires_in}`. The route mints **owner** credentials. `kirocrew token` does the same, and adds a connection-bound check that the peer really is this account's gateway before sending the secret. **L** (`cli_server_requests.py:95-160`; a run with `ttl=2m`, token never printed)
- **A minimal reader** that never prints the token, run with the backend python:

  ```python
  import json, urllib.request
  from kiro_crew.config.loader import read_local_secret
  P = 5476; B = f"http://127.0.0.1:{P}"
  s = read_local_secret(P, dial_host="127.0.0.1")
  t = json.loads(urllib.request.urlopen(urllib.request.Request(
      B + "/api/token/local?ttl=2m", headers={"X-Local-Secret": s})).read())["token"]
  get = lambda p: json.loads(urllib.request.urlopen(urllib.request.Request(
      B + p, headers={"Cookie": f"mc_token_{P}={t}"})).read())
  ```

- **Other auth routes.** `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/mobile-link` (a link for another browser). `kirocrew logout` revokes all dashboard sessions. **L** (routes, help)
- **Unauthenticated probes.** `GET /api/health`, `GET /api/ready`, `GET /api/status`. **L** (routes); which ones skip auth **D** https://kiro.dev/docs/crew/interfaces/ ("liveness probes")
- **Mode changes are policy-gated.** `yolo` is governed by the `approval_modes` policy scope, and is refused for app tokens and crons. A cron is held to `trust` or `trust_reads` on one named slot. **L** (`dashboard/chat_api/slot_approval.py:240-340`)

### Route groups

Counts are registrations in `dashboard/routes/*.py`: 288 GET, 277 POST, 48 PUT, 45 DELETE, 23 PATCH (681 in all). The biggest prefixes are `/api/chat` (106), `/api/memory` (42), `/api/agents` (25), `/api/mcp` (23) and `/api/skills` (22). A slot is one chat tab, keyed by name. **L** (regex parse of `add_get|add_post|add_put|add_patch|add_delete`)

| Group | Routes an orchestrator is most likely to need | Notes |
|---|---|---|
| Chat | `POST /api/chat` (send a turn), `GET /api/chat/threads`, `GET /api/chat/threads/{mid}`, `POST /api/chat/threads/{mid}/reply`, `GET /api/chat/side/tools`, `GET /api/slash-commands` | L routes |
| Slots | `GET/POST /api/chat/slots`; `GET/DELETE /api/chat/slots/{slot}`; per slot `POST .../followup`, `.../stop`, `.../interrupt`, `.../continue`, `.../resume`, `.../reload`, `.../fork`, `.../rewind`, `.../regenerate`, `.../reset-conversation`, `.../agent`, `.../model`, `.../reasoning-effort`, `.../project`, `.../workspace`, `.../context`, `.../note`, `.../end-wait`, `.../elicitation`; `GET .../summary`, `.../export`, `.../turn-timeout`, `.../autocompact`; queue `PUT .../queue/order`, `PATCH/DELETE .../queue/{queue_id}`; side chat `.../side/open`, `.../side/turn`, `.../side/stop`, `.../side/close` | `GET /api/chat/slots` returned a list of 7 here, with fields such as `key`, `agent`, `mode`, `model`, `needs_input`, `last_message`, `messages`. **L** (run, field names only) |
| Approval | `GET /api/approvals`, `POST /api/approvals/{id}/{action}`, `POST /api/chat/slots/{slot}/approve` (body `action`, `request_id`), `GET /api/instances/{id}/approval-state` | `GET /api/approvals` returned `[]` here. **L** (run) |
| Mode | `POST /api/chat/mode` (body `mode`: `normal` default, `trust_reads`, `trust`, `yolo`; optional `slot`), `PATCH /api/chat/slots/{slot}/mode` | Without `slot`, the request means every slot. YOLO lasts `agent.yolo_duration`. **L** (`slot_approval.py`) |
| Agents | `GET/POST /api/agents`, `GET /api/agents/catalog`, `/installed`, `/templates`, `/resolved-model`; `GET/PATCH/DELETE /api/agents/detail/{name}` plus `.../fork`, `.../publish`, `.../reset`; `GET/PUT /api/agents/{name}/capabilities`, `.../worker-kit`; `POST /api/agents/sync`; `GET/PUT /api/agent/config`; `GET /api/acp-backends`, `POST /api/acp-backends/recheck` | `GET /api/acp-backends` here: `kas`, `kiro` and `opencode` are installed; `claude` (needs `claude-agent-acp`), `codex` (`codex-acp`), `deepseek` (`dsh`), `goose` and `pi` (`pi-acp`) are missing. All eight are `selectable`. **L** (run) |
| Members (mates) | `GET /api/members`; per slug `GET .../activity`, `.../briefing`, `.../projections`, `.../recap`, `GET/PUT .../rules`, `POST .../thread`, `.../greet`, `.../fresh-start` | **L** routes |
| Sessions | `GET /api/sessions`, `/search`, `/health`, `/usage`, `/memory`, `/clearable/count`; `GET /api/sessions/{key}`, `.../meta`; `GET /api/sessions/{id}/agents`, `.../agents/{agent_id}`, `.../agents/{agent_id}/stream`; crew log `GET /api/sessions/{id}/crew-log`, `.../crew-log/projections`; `GET /api/session/archive`; `POST /api/sessions/restart`, `DELETE /api/sessions` | `GET /api/sessions/health` returns `counts`, `effective_caps`, `stalled`, `waiting`, `queued`, `recovering`. **L** (run) |
| Work ledger | none | No HTTP route under `dashboard/routes/` matches `work` or `ledger`. The ledger is reachable only through agents' `kirocrew-work` MCP tools; `GET /api/crew-log/*` and session crew-log projections are the nearest read paths. **L** (route grep) |
| Config | `GET /api/config/schema` (the live schema: `{entries: [...]}`, 662 entries), `GET/PUT/PATCH /api/config/kirocrew`, `GET/PUT /api/config/default-agent`, `/api/config/stt`, `/api/config/theme` | The live schema equalled the saved copy byte for byte as parsed JSON (`spike128/schema.json`). **L** (run) |
| MCP gateway | `GET /api/mcp-gateway/status`, `/metrics`, `/servers`, `/servers/launch`; `POST /api/mcp-gateway/enable`, `/resolve-refresh`, `/servers/stub` | Status here: `enabled: true`, `running: false`, `stub_count: 0`, which fits "the broker starts iff some server is stubbed". **L** (run, schema help) |
| Realtime | `GET /api/ws` (websocket), `/api/ws/stt`, `/api/ws/terminal/{session_id}` | **L** routes |
| Other | `/api/instances*` (remote gateways), `/api/taskrunner*`, `/api/tasks*`, `/api/hooks*`, `/api/skills*`, `/api/memory*`, `/api/security*`, `/api/update*`, `POST /api/worktree/create`, `POST /v1/chat/completions` | **L** routes; not read further |

## Agent MCP servers

Every server is the backend python running `-s -P -m kiro_crew mcp-<name>` over stdio. An agent spec mounts a server only when it names it in `tools`, and pre-approves calls in `allowedTools`. **L** (`~/.kiro/agents/kirocrew-*.json`, `kiro_crew/cli.py:474-510`)

| Server | Mounted by (agent files here) | Tools in the installed source |
|---|---|---|
| `kirocrew-core` | all ten `kirocrew*` agents with MCP | From `mcp_core_parts/crew.py`: `ask_question`, `autonudge_stop`, `chat_tag`, `monitor_inspect`, `monitor_start`, `monitor_stop`, `monitor_update`, `monitor_watch`, `nothing_to_do`, `register_hook`, `reset_conversation`, `route_crew`, `select_crew`, `set_project`, `suggest_followup`, `task_run`, `wait`. The conductor also allows `resource_status`, `list_sessions`, `session_ledger_read`, `session_ledger_record`, `skill_search`, `skill_fetch`, `send_message` and `send_notification`, which are defined in other core parts (**L** allowedTools; their source files weren't traced) |
| `kirocrew-dashboard` | conductor, ledger-conductor, pipeline-conductor, security-conductor, team-lead | Session control (`mcp_dashboard_session_tools.py`): `session_adopt`, `session_broadcast`, `session_close`, `session_continue`, `session_create`, `session_end_wait`, `session_fork`, `session_generate_title`, `session_history_list`, `session_read_message`, `session_release`, `session_reload`, `session_rename`, `session_retry`, `session_revive`, `session_send`, `session_set_model`, `session_status`, `session_stop`, `session_summary`. Chat organisation (`mcp_dashboard.py`): `chat_folder_*` (create, delete, file_self, move, move_session, tree, update), `chat_session_pin`, `chat_session_pin_move`, `chat_tag_*` (assign, column_create, column_list, column_move, create, list, update), `session_move_to_column`. Gated by `agent.session_control` |
| `kirocrew-work` | the four conductors, team-lead, worker | `work_brief`, `work_report`, `work_ledger_read`, `work_ledger_record`, `work_ledger_rebuild` (`mcp_work.py`). There is **no `work_dispatch`** anywhere in the 0.11.1 package; a grep for it returned nothing. Repo HEAD's prompt mentions it ([research note](../research/kirocrew-orchestration.md)), so it is newer than this install |
| `kirocrew-cron` | research, team-lead, worker, kirocrew | `cron_add`, `cron_list`, `cron_pause`, `cron_remove`, `cron_remove_all`, `cron_resume`, `cron_secret_request`, `cron_trigger`, `cron_update` |
| `kirocrew-guide` | worker, kirocrew | `diagnose_settings`, `find_setting`, `find_ui`, `get_change_status`, `get_member_capabilities`, `guide_cancel`, `guide_list_actions`, `guide_start`, `guide_status`, `list_change_kinds`, `propose_change`, `search_docs` |
| `kirocrew-mate` | worker, kirocrew | `update_self`, `set_model`, `set_approval_mode`, `request_capabilities`, `find_capabilities`, `goal_read`, `set_goal`, `set_key_results`, `set_check_ins`, `key_result_progress`, `offer_dashboard_page`, `save_goal_report`, `save_notes` |
| `kirocrew-panel` | dashboard-manager | `dashboard_apply`, `dashboard_fields`, `dashboard_preview`, `dashboard_rollback`, `dashboard_save`, `dashboard_templates`, `dashboard_types`, `dashboard_write`, `panel_publish`, `panel_templates` |
| `kirocrew-crew-log` | none here (opt-in) | `crew_log_list`, `crew_log_projection`, `crew_log_read` (read-only) |
| `kirocrew-debug` | none here (opt-in) | `debug_gateway`, `debug_processes`, `debug_refusals`, `debug_snapshots`, `debug_threads` (read-only) |
| `kirocrew-computer` | worker (`tools` names `@kirocrew-computer`) | A shim forwarding desktop automation to the gateway; tool names not read |

**The conductor's tool grant** (`~/.kiro/agents/kirocrew-conductor.json`). **L**

- **`tools`:** `execute_bash`, `fs_read`, `web_fetch`, `session`, `report`, `tool_search`, plus the `@kirocrew-core`, `@kirocrew-dashboard` and `@kirocrew-work` servers. There is no file-write tool.
- **`allowedTools`** (pre-approved), 29 entries:
  - **Built-ins:** `session`, `report`, `tool_search`.
  - **From core:** `monitor_start`, `monitor_update`, `autonudge_stop`, `wait`, `resource_status`, `list_sessions`, `session_ledger_read`, `session_ledger_record`, `skill_search`, `skill_fetch`, `select_crew`, `send_message`, `send_notification`, `ask_question`, `nothing_to_do`, `reset_conversation`.
  - **From dashboard:** `chat_folder_tree`, `chat_folder_create`, `chat_folder_file_self`, `session_create`, `session_read_message`, `session_status`.
  - **From work:** `work_ledger_read`, `work_ledger_record`, `work_ledger_rebuild`, `work_brief`.
- **Not pre-approved:** `work_report` (the worker's tool), and every other dashboard tool, such as `session_send`, `session_stop` and `session_close`. These would hit an approval prompt (**I**, from the `allowedTools` semantics in [kiro.md](./kiro.md)).

## In-session commands

Dashboard chat accepts kiro-cli's slash-command root words. These are listed in `dashboard/chat_utils.py:210-242` and served with descriptions at `GET /api/slash-commands`. **L**

| Command | Dashboard chat | Notes |
|---|---|---|
| `/agent`, `/changelog`, `/clear`, `/code`, `/compact`, `/context`, `/experiment`, `/goal`, `/help`, `/hooks`, `/issue`, `/logdump`, `/mcp`, `/model`, `/prompts`, `/side`, `/tools`, `/usage`, `/workflow` | ✓ | `/clear`, `/compact`, `/goal`, `/workflow`, `/agent` and `/prompts` get gateway-side handling (`dashboard/chat_turn/slash_commands.py`) |
| `/todos` | ~ | Blocked on the kiro backend only; Claude Code's own `/todos` passes through |
| `/quit`, `/exit`, `/q`, `/chat`, `/paste`, `/reply`, `/editor`, `/tangent` | ✗ | Blocked before session acquisition and hidden from `/api/slash-commands`, because they drive a local terminal |
| `/init`, `/review`, `/security-review` | ~ | Described for the `claude_code` backend only |
| `/yolo`, per-session Trust | ✓ messaging channels | **D** https://kiro.dev/docs/crew/interfaces/ |

The TUI's command set (`kirocrew chat`) was not checked. **?**

## Settings and environment

**Files.** `$KIROCREW_HOME/config.json` (default `~/.kiro/crew/config.json`), with `config.local.json` overriding it and surviving updates (`config set --local`). Agent specs that Kiro Crew writes: `~/.kiro/agents/kirocrew-*.json`, with `.bak` copies. Mates: `~/.kiro/mates/agents/` (**D**, from the research note's changelog reading). Desktop prefs: `%APPDATA%\kirocrew-desktop\config.json`. **L** (listings, `config set --help`).

**Reading and writing.**
- `kirocrew config get [<key>]` reads a value. `kirocrew config set <key> <value>` writes one; `--value-base64=TOKEN` passes a value a shell can't mangle, and `--local` writes the overlay.
- `kirocrew config defaults [--adopt|--keep]` reviews stored values that still hold a superseded default.
- The live schema is `GET /api/config/schema`. Each entry has `path`, `type`, `defaultValue`, `enumValues`, `help`, `tags` and `sensitive`. **L**

**Keys an orchestrating agent needs.** Default, enum and help come from the live schema; "Here" is `kirocrew config get <key>` on this machine. **L**

| Key | Default | Here | Meaning |
|---|---|---|---|
| `agent.session_control` | `true` | `True` | Lets one chat session create, stop, read or send to another of yours. The tools come from `kirocrew-dashboard`, so the agent spec is the real grant. The stored value here was `false` before ticket 128 |
| `agent.sandbox` | `auto` (`auto`, `strict`, `off`) | `auto` | OS isolation for agent subprocesses: a namespace on Linux, sandbox-exec on macOS. There is no Windows backend |
| `agent.sandbox_allow_unsandboxed_exec` | `false` | `True` | When true, run without any sandbox backend (fail-open). When false, refuse (fail-closed). 0.11.1 on Windows refuses every agent spawn unless this is true (research note) |
| `agent.sandbox_allow_no_isolation` | n/a | not read | Controls only the warning severity when no isolation exists; distinct from the key above |
| `agent.acp_backend` | `kas` (`claude`, `codex`, `deepseek`, `goose`, `kas`, `kiro`, `opencode`, `pi`) | `kas` | Which ACP agent the gateway drives. `kiro` means kiro-cli |
| `agent.member_acp_backend` | `kas` | `kas` | Backend for crew-member sessions; "dispatch-capable" backends are `claude`, `codex`, `opencode` and `goose` |
| `agent.approval_mode` | `auto` (`auto`, `interactive`) | `auto` | Tool approval mode, resolved once per channel at start. `gateway --approval` overrides it; a change needs a restart |
| `agents.*.approval_mode` | empty | not read | Per-mate thread approval: `normal`, `trust_reads` or `trust` |
| `agent.yolo_duration` | `6h` (`30m`, `1h`, `6h`, `12h`, `24h`, `until_shutdown`) | `until_shutdown` | How long ad-hoc YOLO lasts. It doesn't apply to `dangerously_skip_permissions` grants |
| `agent.tool_approval_timeout_secs` | `600` | `600` | How long a turn waits for a human approval before declining it. Clamped to 30-7200 s, and to 60 s under the turn ceiling |
| `agent.subagent_max_turns` | `1000` | `1000` | Tool-call budget per subagent |
| `agent.subagent_spawn_stagger_secs` | `0.25` | not read | Delay between successive subagent spawns |
| `mcp_gateway.enabled` | `false` | `True` | Sessions with identical MCP config share one server process. It doesn't start the broker by itself |
| `session.context_cap` | `true` | `True` | Trims a goal conductor's chat on KAS: over 400K tokens, or over 200K after 5 minutes idle, the turn starts a new session from the session-ledger snapshot |
| `dashboard.session_grid` | `false` | `True` | Split view of several chats |
| `dashboard.url` | `''` | not read | Public dashboard URL; also sets the port the CLI resolves |
| `watchdog.*` | various | not read | Liveness windows: `check_after_secs`, `stale_window_secs`, `tool_stall_suspect_secs`, `tool_stall_hard_cap_secs` and more, with per-agent overrides under `agents.*.watchdog_*` |

**Environment variables.**

| Variable | Meaning | Evidence |
|---|---|---|
| `KIROCREW_HOME` | Data home (default `~/.kiro/crew`). `gateway --approval yolo` is refused unless it is set to a non-default location | L `gateway --help`; default **D** configuration page |
| `KIROCREW_PORT` | Gateway port (default 5476), validated as 1-65535 at CLI start | L `cli.py:255-275`, `--help` epilog |
| `KIROCREW_PROJECT_DIR` | Project dir; auto-detected when unset | L `cli.py:276-280` |
| `KIROCREW_CREW_LOG` | `0` before gateway start disables the redacted crew log and session ledger | D https://kiro.dev/docs/crew/configuration/ |
| `KIROCREW_DEBUG` | Needed for the `desktop` debug commands | L `--help` epilog |
| `KIROCREW_SANDBOX_ACTIVE`, `KIROCREW_SANDBOX_LEVEL` | Internal; cleared at CLI start so they can't be inherited | L `cli.py:233-249` |

## Couldn't verify

- **The two stderr config warnings** the brief mentions. None appeared in this session.
- **The TUI** (`kirocrew chat` without `-m`), and whether it accepts slash commands. Not opened.
- **Desktop app internals.** Its menus, keybindings and the remote-gateway SSH flow. `app.asar` (5.7 MB) wasn't unpacked.
- **Where the other core tools live.** `resource_status`, `list_sessions`, `session_ledger_*`, `skill_*` and `send_*` weren't traced to their source files, and the `kirocrew-computer` tool names weren't read.
- **Routes outside `dashboard/routes/`.** Handlers and builtin apps register more routes, so 681 is a floor.
- **Which routes skip auth.** Only `/api/config/schema` was tested without a cookie (403).
- **Every POST, PATCH and DELETE.** Request and response bodies were read from source or not at all; none was called. The spike's chats were not opened.
- **UI labels.** That the dashboard labels `trust_reads` as "Reads" is inferred from a source comment ("Normal, Reads and Trust"), not seen in the UI.
- **`kiro.dev/docs/crew/interfaces/cli-reference/`.** Not fetched; the CLI section above comes from the install.

# Crush and OpenCode: surfaces

Two ancillary harnesses, both installed through WinGet (links in `%LOCALAPPDATA%\Microsoft\WinGet\Links`). Grammar, marks and template: [README](./README.md). Deployment and skill testing: [harnesses.md](../harnesses.md#crush-ancillary-charm).

Marks: **L** local install (command named), **D** documented (URL named), **I** inferred (basis named). Doc URLs used below:

- Crush README: <https://github.com/charmbracelet/crush> (cited as **D-readme**)
- Crush config docs: <https://github.com/charmbracelet/crush/tree/main/docs/config> (**D-config**)
- Crush hooks docs: <https://github.com/charmbracelet/crush/tree/main/docs/hooks> (**D-hooks**)
- OpenCode docs: <https://opencode.ai/docs/cli/> (**D-cli**), [/server/](https://opencode.ai/docs/server/) (**D-server**), [/permissions/](https://opencode.ai/docs/permissions/) (**D-perm**), [/agents/](https://opencode.ai/docs/agents/) (**D-agents**), [/config/](https://opencode.ai/docs/config/) (**D-config**), [/tui/](https://opencode.ai/docs/tui/) (**D-tui**), [/acp/](https://opencode.ai/docs/acp/) (**D-acp**)

---

## Crush (`crush`, Charm)

### Versions

Gathered 2026-11-01, Windows 11, Git Bash.

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI, API (server) | `crush.exe` (WinGet package `charmbracelet.crush`, 96 MB) | v0.93.1 | `crush --version` prints `crush version v0.93.1` (L) | `61abfcf31f8a` |

Help hash: `crush --help | tr -d '\r' | sha256sum | cut -c1-12`. Caveat (I, from the output): the top-level help embeds the per-user named-pipe path in the `--host` default, which contains the Windows user SID, so the hash differs per user and machine.

### Surfaces

- **CLI**: `crush run [prompt...]` runs one non-interactive prompt and exits; stdin is accepted as input, and output can be redirected (L: `crush run --help` examples). Management subcommands (`session`, `models`, `logs`, `stats`, `projects`, `dirs`, `login`) also run one-shot (L: `crush --help`).
- **TUI**: `crush` with no subcommand opens the interactive terminal UI (L: `crush --help`, "Run in interactive mode"). Command palette on `ctrl+p`, model picker on `ctrl+l` (D-readme).
- **GUI**: **none.** Crush ships no desktop app, IDE extension or web dashboard (I: no GUI subcommand in `crush --help`, none mentioned in D-readme).
- **API**: `crush server` starts a Crush server; the TUI and CLI can attach with `-H --host` (L: `crush server --help`). The default host is a Windows named pipe, `npipe:////./pipe/crush-<user SID>.sock`; `--host` also accepts TCP or a Unix socket (L: `crush server --help`, "Server host (TCP or Unix socket)"). The binary contains an HTTP route table under `/v1/` (for example `/v1/health`, `/v1/workspaces`, `/v1/workspaces/{id}/agent/sessions/{sid}/cancel`) (L: `grep -a` on `crush.exe`; I that these are the server's routes). The README calls it `crush serve`, a shared backend that groups clients into workspaces by `--cwd`, first client wins for `--yolo` and `--debug`, torn down when the last SSE stream disconnects (D-readme). **Disagreement**: the installed subcommand is `server`, not `serve` (L vs D-readme). No ACP mode: no `acp` subcommand and no "Agent Client Protocol" string in the binary (L). MCP is client-side only (Crush connects to MCP servers; it does not serve MCP) (D-readme; I from no `mcp` subcommand).

Config: `~/.config/crush` (config) and `%LOCALAPPDATA%\crush` (data), as printed by `crush dirs` (L). This machine has a legacy `crush.json` in the config dir (L: `ls`). The docs make `crushrc` (a Bash-like file of Crush builtins) the primary format and `crush.json` deprecated (D-readme, D-config); the binary contains the string `crushrc` (L: `grep -a -c`), so I infer v0.93.1 reads it, but that is not probed.

### Feature-to-surface matrix

| Feature | CLI | TUI | GUI | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `crush run` | ✗ | ✗ | ~ via server routes | L `crush run --help`; API I from `/v1/` strings |
| Structured output | ~ `--json` on `session *` and `projects` only; `run` has no JSON mode | ✗ | ✗ | ? | L `crush session list --help`, `crush run --help` |
| Model selection | ✓ `run -m --model`, `--small-model` | ✓ `ctrl+l` picker | ✗ | ? | L `crush run --help`; TUI D-readme |
| Approvals / permission modes | ~ root `-y --yolo`; **`crush run --yolo` fails "Unknown flag: --yolo."** | ✓ prompts; `--yolo` | ✗ | ~ first client sets `--yolo` | L `crush run --yolo --help`; D-readme (`permissions allow/deny`) |
| Sandboxing | ? | ? | ✗ | ? | none documented; shell is embedded `mvdan.cc/sh` per harnesses.md |
| Sub-agents | ? | ? | ✗ | ? | not documented in D-readme or D-config |
| Worktrees | ? | ? | ✗ | ? | not documented |
| Background / parallel sessions | ~ | ~ | ✗ | ✓ one server, many workspaces | `option max-background-jobs` (D-config); server D-readme |
| Session resume | ✓ `-C --continue`, `-s --session` | ✓ same flags | ✗ | ? | L `crush --help`, `crush run --help` |
| Hooks | ✓ | ✓ | ✗ | ? | D-hooks: 13 events, "preliminary" (D-readme) |
| MCP (client) | ✓ | ✓ | ✗ | ? | D-readme: `stdio`, `http`, `sse` |
| Skills / plugins | ✓ skills | ✓ skills, `user-invocable` ones in palette | ✗ | ? | D-readme; harnesses.md (confirmed live) |
| Notifications | ? | ~ `option notifications` | ✗ | ? | D-config |
| Remote or cloud runs | ~ `-H --host` to a remote server | ~ same | ✗ | ✓ TCP host | L `crush server --help` |

### CLI reference

```
crush [global-flags] [command] [--flags]
```

**Persistent flags** (printed on every subcommand) (L: each `crush <cmd> --help`):

| Flag | Meaning |
|---|---|
| `-c --cwd` | Current working directory |
| `-D --data-dir` | Custom crush data directory |
| `-d --debug` | Debug |
| `-h --help` | Help |
| `-H --host` | Connect to a specific crush server host (for advanced users); default `npipe:////./pipe/crush-<user SID>.sock` |

**`crush`** (root, opens the TUI) (L: `crush --help`). Adds:

| Flag | Meaning |
|---|---|
| `-C --continue` | Continue the most recent session |
| `-s --session` | Continue a previous session by ID |
| `-v --version` | Version for crush |
| `-y --yolo` | Automatically accept all permissions (dangerous mode); root only, rejected by `run` (L) |

**`crush run [prompt...]`**: Run a single non-interactive prompt (L: `crush run --help`).

| Flag | Meaning |
|---|---|
| `-C --continue` | Continue the most recent session |
| `-m --model` | Model to use. Accepts 'model' or 'provider/model' to disambiguate models with the same name across providers |
| `-q --quiet` | Hide spinner |
| `-s --session` | Continue a previous session by ID |
| `--small-model` | Small model to use. If not provided, uses the default small model for the provider |
| `-v --verbose` | Show logs |

**`crush server`**: Start the Crush server (L). Its `-H --host` reads "Server host (TCP or Unix socket)", same default.

**`crush session [command]`**: Manage sessions (L). Every leaf adds `--json` (Output in JSON format).

| Subcommand | Meaning |
|---|---|
| `crush session delete <id>` | Delete a session |
| `crush session last` | Show most recent session |
| `crush session list` | List all sessions |
| `crush session rename <id> <title>` | Rename a session |
| `crush session show <id>` | Show session details |

**`crush login [platform]`**: Login Crush to a platform; default Charm Hyper, `copilot` for GitHub Copilot (L). `-f --force`: Force re-authentication even if already logged in.

**`crush logout [platform]`**: Logout Crush from a platform (`hyper`, `copilot`) (L). `-f --force`: Skip logout confirmation prompt.

**`crush logs`**: View crush logs (L).

| Flag | Meaning |
|---|---|
| `-f --follow` | Follow log output |
| `-t --tail` | Show only the last N lines default: 1000 for performance (1000) |

**`crush models`**: List all available models from known providers; a trailing word searches (`crush models gpt5`) (L). No extra flags.

**`crush projects`**: List project directories (L). `--json`: Output as JSON.

**`crush stats`**: Show usage statistics (L).

| Flag | Meaning |
|---|---|
| `--all` | Aggregate stats from all known projects (from projects.json) |
| `--crawl-dir` | Crawl a directory recursively for all crush projects and aggregate stats |

**`crush update-providers [path-or-url]`**: Update providers; the argument may be a URL, a local file or `embedded` (L). `--source`: Provider source to update (catwalk or hyper) (catwalk).

**`crush dirs`**: Show config and data directories (L). No extra flags.

**`crush help [command]`**: Help about any command (L). No extra flags.

**`crush completion [command]`**: Generate the autocompletion script for the specified shell (L). Leaves `bash`, `fish`, `powershell`, `zsh`; each adds `--no-descriptions` (Disable completion descriptions).

Hidden or undocumented flags: none seen in help. Cobra does not print hidden commands, so absence is not proof (I).

### In-session commands

Crush has a command palette rather than a documented slash-command list (D-readme).

| Command or key | Surfaces | Evidence |
|---|---|---|
| `ctrl+p` command palette; user-invocable skills appear as `user:` / `project:` entries | TUI | D-readme |
| `ctrl+l` model picker | TUI | D-readme |
| Theme editor: `ctrl+e` edit, `ctrl+s` save, `esc` cancel | TUI | D-readme |
| Custom commands | ? | not covered by D-config |

### Settings and environment

- **Config precedence** (highest first): `./.crushrc`, `./crushrc`, `~/.config/crush/crushrc` (Windows `%USERPROFILE%\.config\crush\crushrc`) (D-readme). Legacy `crush.json` still read (D-config); present locally at `~/.config/crush/crush.json` (L). Both files are trusted code: `crushrc` runs in a shell and `$(...)` in `crush.json` runs at load (D-readme).
- **Data**: `%LOCALAPPDATA%\crush` (L: `crush dirs`), holds `crush.json` state, `projects.json`, `providers.json`, `hyper.json` (L: `ls`). Logs at `./.crush/logs/crush.log` (D-readme).
- **crushrc builtins**: `provider add|remove|rm`, `model add|remove|rm`, `model large`, `model small`, `mcp add|remove|rm`, `lsp add|remove|rm`, `hook add|remove|rm`, `permissions allow|deny`, `option`, `option reset`, `option ui` (D-config).
- **Options an orchestrator needs**: `permissions allow <tools>` / `permissions deny <tools>`; `option skill-path`, `option disable-skill`; `option context-path`, `option global-context-path` (defaults `~/.config/crush/CRUSH.md`, `~/.config/AGENTS.md`); `option initialize-as` (default `AGENTS.md`); `option max-background-jobs` (50); `option request-timeout` (60); `option attribution-trailer-style` (`assisted-by`, `co-authored-by`, `none`) (D-readme, D-config). Legacy JSON permission key: `permissions.allowed_tools` (D-config).
- **Skills roots**: global `$CRUSH_SKILLS_DIR`, `~/.config/agents/skills`, `~/.config/crush/skills`, `~/.agents/skills`, `~/.claude/skills`; project `.agents/skills`, `.crush/skills`, `.claude/skills`, `.cursor/skills` (D-readme; matches harnesses.md).
- **User-level rules**: harnesses.md lists Crush as "not installed" with no verified user-level rules path. Install now present (L); docs give `option global-context-path` defaults above (D-readme). Not probed live.
- **Hooks**: events `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionResult`, `SessionStart`, `SessionEnd`, `TurnStart`, `TurnEnd`, `StopFailure`, `Interrupt`, `PreCompact`, `PostCompact`; exit 2 blocks, exit 49 halts the turn; largely Claude Code compatible payloads (D-hooks).
- **Ignore**: `.gitignore` plus `.crushignore` (D-readme).
- **Environment** (D-readme): `CRUSH_GLOBAL_CONFIG`, `CRUSH_GLOBAL_DATA`, `CRUSH_SKILLS_DIR`, `CRUSH_DISABLE_PROVIDER_AUTO_UPDATE`, `CRUSH_DISABLE_METRICS`, `DO_NOT_TRACK`, `CATWALK_URL`, plus provider keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and so on). Also present as strings in the binary but undocumented (L: `grep -a -o 'CRUSH_[A-Z_]*'`; names may be truncated by adjacent strings): `CRUSH_CACHE_DIR`, `CRUSH_CLIENT_SERVER`, `CRUSH_CORE_UTILS`, `CRUSH_PROFILE`, `CRUSH_SERVER_IDLE_TIMEOUT`, `CRUSH_SERVER_DETACH_GRACE`, `CRUSH_SERVER_READY_TIMEOUT`, `CRUSH_SKIP_DATADIR_LOCK`, `CRUSH_UI_DEBUG`. Hook handlers receive `CRUSH_EVENT`, `CRUSH_TOOL_NAME`, `CRUSH_SESSION_ID`, `CRUSH_CWD`, `CRUSH_PROJECT_DIR` (D-hooks; also L strings).

### Couldn't verify

- Whether v0.93.1 reads `crushrc` (string present, not probed).
- The server's wire protocol and route list beyond binary strings; whether `--host` TCP form needs a scheme.
- Sub-agents, worktrees, sandboxing, custom commands: undocumented.
- Hidden cobra commands.

---

## OpenCode (`opencode`)

### Versions

Gathered 2026-11-01, Windows 11, Git Bash.

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI, API, web GUI | `opencode` (WinGet link) | 1.18.21 | `opencode --version` (L) | `b594ad32674b` |

Help hash: `opencode --help 2>&1 | tr -d '\r' | sha256sum | cut -c1-12` (L). Matches harnesses.md's probed 1.18.21.

### Surfaces

- **CLI**: `opencode run [message..]` sends one message and exits; `--format json` emits raw JSON events (L: `opencode run --help`). Management subcommands (`session`, `export`, `models`, `stats`, `agent`, `mcp`, `debug`, `db`) run one-shot (L: `opencode --help`).
- **TUI**: `opencode [project]` is the default command, "start opencode tui"; `--mini` starts a minimal interface (L). `opencode attach <url>` opens the TUI against a running server (L). The TUI is itself a client of an embedded server (D-server).
- **GUI**: `opencode web` starts the server and opens a **web interface** (L: `opencode web --help`). A desktop app or IDE extension is not installed here and was not checked (?).
- **API**: `opencode serve` starts a headless HTTP server (L); default `--port 0` (random) per the install, while the docs say 4096 (**disagreement**: L `opencode serve --help` vs D-server; the 4096 is the `attach` example URL in L). OpenAPI 3.1 spec at `/doc`; `POST /session`, `POST /session/:id/message`, `POST /session/:id/prompt_async`, SSE at `GET /event`; `/tui` routes drive a TUI remotely; basic auth via `OPENCODE_SERVER_PASSWORD` / `OPENCODE_SERVER_USERNAME` (D-server). `opencode acp` starts an ACP server (L), JSON-RPC over stdio for Zed, JetBrains, Avante.nvim, CodeCompanion.nvim; `/undo` and `/redo` unsupported over ACP (D-acp). MCP is client-side (`opencode mcp add`), not a served surface (L).

Config: `~/.config/opencode` (L: `opencode debug paths`), which holds `opencode.jsonc`, `tui.jsonc`, `AGENTS.md`, `plugins/` locally (L: `ls`). Data `~/.local/share/opencode`, state `~/.local/state/opencode`, cache `~/.cache/opencode` (L: `opencode debug paths`).

### Feature-to-surface matrix

| Feature | CLI | TUI | GUI (web) | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `run` | ~ `--prompt` prefills | ? | ✓ `POST /session/:id/message` | L `opencode run --help`, `opencode --help`; D-server |
| Structured output | ✓ `run --format json`; `session list --format json`; `db --format json`; `export` | ✗ | ✗ | ✓ JSON | L |
| Model selection | ✓ `-m --model`, `--variant` | ✓ `-m`, `/models` | ? | ? | L; D-tui |
| Approvals / permission modes | ✓ `--auto` (explicit `deny` still applies) | ✓ `--auto`, prompts | ? | ? | L; D-perm |
| Sandboxing | ? | ? | ? | ? | not documented in pages read |
| Sub-agents | ✓ via `task` tool, `--agent` | ✓ `@general`, Tab cycles primaries | ? | ? | L `agent create --help` (`--mode subagent`); D-agents |
| Worktrees | ? | ? | ? | ? | `OPENCODE_EXPERIMENTAL_WORKSPACES` exists (D-cli); not confirmed as worktrees |
| Background / parallel sessions | ~ `--attach` to one server | ~ | ? | ✓ `prompt_async` | L; D-server; `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS` (D-cli) |
| Session resume | ✓ `-c`, `-s`, `--fork` | ✓ same, `/sessions` | ? | ✓ | L; D-tui |
| Hooks | ~ via plugins | ~ via plugins | ? | ? | D-config (plugins add hooks); `--pure` disables external plugins (L) |
| MCP (client) | ✓ `opencode mcp` | ✓ | ? | ? | L |
| Skills / plugins | ✓ skills as a runtime tool; `opencode plugin <module>` | ✓ | ? | ? | L `opencode debug skill --help`, `opencode plugin --help`; harnesses.md |
| Notifications | ? | ? | ? | ? | `attention` key in `tui.json` (D-config), meaning not read |
| Remote or cloud runs | ✓ `run --attach`, `--share`, `github run` | ✓ `attach <url>` | ? | ✓ `--hostname`, `--mdns` | L |

### CLI reference

```
opencode [global-flags] [command] [options]
```

**Global flags** (printed on every subcommand) (L: each `opencode <cmd> --help`):

| Flag | Meaning |
|---|---|
| `-h, --help` | show help |
| `-v, --version` | show version number |
| `--print-logs` | print logs to stderr |
| `--log-level <DEBUG\|INFO\|WARN\|ERROR>` | log level |
| `--pure` | run without external plugins |

**Network flags** shared by root, `acp`, `serve` and `web` (L):

| Flag | Meaning |
|---|---|
| `--port <number>` | port to listen on (default 0) |
| `--hostname <string>` | hostname to listen on (default "127.0.0.1") |
| `--mdns` | enable mDNS service discovery (defaults hostname to 0.0.0.0) |
| `--mdns-domain <string>` | custom domain name for mDNS service (default "opencode.local") |
| `--cors <array>` | additional domains to allow for CORS |

**`opencode [project]`** (default, start opencode tui) (L: `opencode --help`). Adds the network flags and:

| Flag | Meaning |
|---|---|
| `-m, --model <provider/model>` | model to use in the format of provider/model |
| `-c, --continue` | continue the last session |
| `-s, --session <id>` | session id to continue |
| `--fork` | fork the session when continuing (use with --continue or --session) |
| `--prompt <string>` | prompt to use |
| `--agent <string>` | agent to use |
| `--auto` | auto-approve permissions that are not explicitly denied (dangerous!) |
| `--mini` | start the minimal interactive interface (not in D-cli) |
| `--no-replay` | disable mini session history replay on resume and after resize (not in D-cli) |
| `--replay-limit <number>` | cap visible mini replay to the newest N messages (not in D-cli) |

**`opencode run [message..]`**: run opencode with a message (L).

| Flag | Meaning |
|---|---|
| `--command <string>` | the command to run, use message for args |
| `-c, --continue` | continue the last session |
| `-s, --session <id>` | session id to continue |
| `--fork` | fork the session before continuing (requires --continue or --session) |
| `--share` | share the session (not in D-cli) |
| `-m, --model <provider/model>` | model to use in the format of provider/model |
| `--agent <string>` | agent to use |
| `--format <default\|json>` | format: default (formatted) or json (raw JSON events) |
| `-f, --file <array>` | file(s) to attach to message |
| `--title <string>` | title for the session (uses truncated prompt if no value provided) |
| `--attach <url>` | attach to a running opencode server (e.g., http://localhost:4096) |
| `-p, --password <string>` | basic auth password (defaults to OPENCODE_SERVER_PASSWORD) |
| `-u, --username <string>` | basic auth username (defaults to OPENCODE_SERVER_USERNAME or 'opencode') |
| `--dir <string>` | directory to run in, path on remote server if attaching |
| `--port <number>` | port for the local server (defaults to random port if no value provided) |
| `--variant <string>` | model variant (provider-specific reasoning effort, e.g., high, max, minimal) |
| `--thinking` | show thinking blocks |
| `-i, --interactive` | run in direct interactive split-footer mode (not in D-cli) |
| `--auto` | auto-approve permissions that are not explicitly denied (dangerous!) |

**`opencode attach <url>`**: attach to a running opencode server (L).

| Flag | Meaning |
|---|---|
| `--dir <string>` | directory to run in |
| `-c, --continue` | continue the last session |
| `-s, --session <id>` | session id to continue |
| `--fork` | fork the session when continuing (use with --continue or --session) |
| `-p, --password <string>` | basic auth password (defaults to OPENCODE_SERVER_PASSWORD) |
| `-u, --username <string>` | basic auth username (defaults to OPENCODE_SERVER_USERNAME or 'opencode') |
| `--mini` | start the minimal interactive interface |
| `--no-replay` | disable mini session history replay on resume and after resize |
| `--replay-limit <number>` | cap visible mini replay to the newest N messages |

**`opencode serve`**: starts a headless opencode server. Network flags only (L).

**`opencode web`**: start opencode server and open web interface. Network flags only (L).

**`opencode acp`**: start ACP (Agent Client Protocol) server. Network flags plus `--cwd <string>` (working directory, default the current directory) (L).

**`opencode mcp`**: manage MCP (Model Context Protocol) servers (L).

| Subcommand | Meaning |
|---|---|
| `opencode mcp add [name]` | add an MCP server. `--url <string>` URL for a remote MCP server; `--env <KEY=VALUE...>` environment variable for a local MCP server; `--header <KEY=VALUE...>` HTTP header for a remote MCP server |
| `opencode mcp list` (alias `ls`) | list MCP servers and their status |
| `opencode mcp auth [name]` | authenticate with an OAuth-enabled MCP server |
| `opencode mcp auth list` (alias `ls`) | list OAuth-capable MCP servers and their auth status |
| `opencode mcp logout [name]` | remove OAuth credentials for an MCP server |
| `opencode mcp debug <name>` | debug OAuth connection for an MCP server |

**`opencode providers`** (alias `auth`): manage AI providers and credentials (L). D-cli names it `auth`; the install's primary name is `providers` (both work, L alias).

| Subcommand | Meaning |
|---|---|
| `opencode providers list` (alias `ls`) | list providers and credentials |
| `opencode providers login [url]` | log in to a provider. `-p, --provider <string>` provider id or name to log in to (skips provider selection); `-m, --method <string>` login method label (skips method selection) |
| `opencode providers logout [provider]` | log out from a configured provider |

**`opencode agent`**: manage agents (L).

| Subcommand | Meaning |
|---|---|
| `opencode agent create` | create a new agent. `--path <string>` directory path to generate the agent file; `--description <string>` what the agent should do; `--mode <all\|primary\|subagent>` agent mode; `--permissions, --tools <string>` comma-separated list of permissions to allow (default: all), from `bash, read, edit, glob, grep, webfetch, task, todowrite, websearch, lsp, skill`; `-m, --model <provider/model>` model to use |
| `opencode agent list` | list all available agents |

**`opencode session`**: manage sessions (L).

| Subcommand | Meaning |
|---|---|
| `opencode session list` | list sessions. `-n, --max-count <number>` limit to N most recent sessions; `--format <table\|json>` output format (default table) |
| `opencode session delete <sessionID>` | delete a session |

**`opencode export [sessionID]`**: export session data as JSON. `--sanitize`: redact sensitive transcript and file data (L).

**`opencode import <file>`**: import session data from JSON file or URL (share URL accepted) (L). No extra flags.

**`opencode models [provider]`**: list all available models (L).

| Flag | Meaning |
|---|---|
| `--verbose` | use more verbose model output (includes metadata like costs) |
| `--refresh` | refresh the models cache from models.dev |

**`opencode stats`**: show token usage and cost statistics (L).

| Flag | Meaning |
|---|---|
| `--days <number>` | show stats for the last N days (default: all time) |
| `--tools <number>` | number of tools to show (default: all) |
| `--models [number]` | show model statistics (default: hidden). Pass a number to show top N, otherwise shows all |
| `--project <string>` | filter by project (default: all projects, empty string: current project) |

**`opencode github`**: manage GitHub agent (L).

| Subcommand | Meaning |
|---|---|
| `opencode github install` | install the GitHub agent |
| `opencode github run` | run the GitHub agent. `--event <string>` GitHub mock event to run the agent for; `--token <string>` GitHub personal access token |

**`opencode pr <number>`**: fetch and checkout a GitHub PR branch, then run opencode (L). No extra flags.

**`opencode plugin <module>`** (alias `plug`): install plugin and update config (L).

| Flag | Meaning |
|---|---|
| `-g, --global` | install in global config |
| `-f, --force` | replace existing plugin version |

**`opencode db [query]`**: database tools; default opens an interactive sqlite3 shell or runs a query (L). `--format <json\|tsv>`: Output format (default tsv). Subcommand `opencode db path`: print the database path.

**`opencode upgrade [target]`**: upgrade opencode to the latest or a specific version (L). `-m, --method <curl|npm|pnpm|bun|brew|choco|scoop>`: installation method to use. D-cli also lists `--major` ("Upgrade to OpenCode 2 and remove OpenCode 1"); **not in the 1.18.21 install** (L).

**`opencode uninstall`**: uninstall opencode and remove all related files (L).

| Flag | Meaning |
|---|---|
| `-c, --keep-config` | keep configuration files |
| `-d, --keep-data` | keep session data and snapshots |
| `--dry-run` | show what would be removed without removing |
| `-f, --force` | skip confirmation prompts |

**`opencode completion`**: generate shell completion script (L). Its `--help` prints the root help, not its own (L).

**`opencode debug`**: debugging and troubleshooting tools (L). Leaves have no extra flags unless listed.

| Subcommand | Meaning |
|---|---|
| `opencode debug config` | show resolved configuration (may print secrets; avoid in logs, I) |
| `opencode debug lsp diagnostics <file>` | get diagnostics for a file |
| `opencode debug lsp symbols <query>` | search workspace symbols |
| `opencode debug lsp document-symbols <uri>` | get symbols from a document |
| `opencode debug rg files` | list files using ripgrep. `--query <string>` Filter files by query; `--glob <string>` Glob pattern to match files; `--limit <number>` Limit number of results |
| `opencode debug rg search <pattern>` | search file contents using ripgrep. `--glob <array>` File glob patterns; `--limit <number>` Limit number of results |
| `opencode debug file read <path>` | read file contents as JSON |
| `opencode debug file list <path>` | list files in a directory |
| `opencode debug file search <query>` | search files by query |
| `opencode debug scrap` | list all known projects |
| `opencode debug skill` | list all available skills |
| `opencode debug snapshot track` | track current snapshot state |
| `opencode debug snapshot patch <hash>` | show patch for a snapshot hash |
| `opencode debug snapshot diff <hash>` | show diff for a snapshot hash |
| `opencode debug startup` | print startup timing |
| `opencode debug agent <name>` | show agent configuration details. `--tool <string>` Tool id to execute; `--params <string>` Tool params as JSON or a JS object literal |
| `opencode debug v2` | debug v2 catalog and built-in plugins (not in D-cli) |
| `opencode debug info` | show debug information |
| `opencode debug paths` | show global paths (data, config, cache, state) |
| `opencode debug wait` | wait indefinitely (for debugging) (not in D-cli) |

Hidden flags: none observed. Flags marked "not in D-cli" are printed by the install but absent from the docs page.

### In-session commands

TUI slash commands (D-tui; leader key `ctrl+x`). ACP accepts most, not `/undo` or `/redo` (D-acp). Custom commands load from `.opencode` directories (`command` key, D-config).

| Command | Aliases | Keybind | Surfaces |
|---|---|---|---|
| `/connect` | | | TUI |
| `/compact` | `/summarize` | `ctrl+x c` | TUI, ACP |
| `/details` | | | TUI |
| `/editor` | | `ctrl+x e` | TUI |
| `/exit` | `/quit`, `/q` | `ctrl+x q` | TUI |
| `/export` | | `ctrl+x x` | TUI |
| `/help` | | | TUI |
| `/init` | | | TUI, ACP |
| `/models` | | `ctrl+x m` | TUI |
| `/new` | `/clear` | `ctrl+x n` | TUI |
| `/redo` | | `ctrl+x r` | TUI (needs Git) |
| `/sessions` | `/resume`, `/continue` | `ctrl+x l` | TUI |
| `/themes` | | `ctrl+x t` | TUI |
| `/thinking` | | | TUI |
| `/undo` | | `ctrl+x u` | TUI (needs Git) |
| `/update` | | | TUI |

Also: `@` fuzzy file reference, `@agent` to invoke a subagent, leading `!` runs a shell command, Tab cycles primary agents (D-tui, D-agents). ACP surface for the other commands is I (D-acp says only some are unsupported).

### Settings and environment

- **Config files**: JSON or JSONC; `opencode.json` (global `~/.config/opencode/opencode.json`, project root), TUI settings in a separate `tui.json` (D-config). This machine uses `opencode.jsonc` and `tui.jsonc` (L: `ls`). Precedence lowest to highest: remote `.well-known/opencode`, global, `OPENCODE_CONFIG`, project `opencode.json`, `.opencode` dirs, `OPENCODE_CONFIG_CONTENT`, managed system files, macOS MDM (D-config).
- **Keys most needed**: `model`, `small_model`, `agent`, `default_agent`, `subagent_depth`, `permission`, `mcp`, `plugin`, `instructions`, `command`, `shell`, `server`, `snapshot`, `autoupdate` (D-config). `tools` is deprecated in favour of `permission` (D-perm).
- **Permissions**: `permission.<name>` = `allow|ask|deny`, or a pattern map (last match wins); names `read`, `edit`, `glob`, `grep`, `bash`, `task`, `todowrite`, `skill`, `lsp`, `question`, `webfetch`, `websearch`, `external_directory`, `doom_loop`; defaults mostly `allow`, `doom_loop` and `external_directory` `ask`, `*.env` reads `ask` (D-perm).
- **Agents**: built-in primaries `build`, `plan`; subagents `general`, `explore`; files in `~/.config/opencode/agents/` and `.opencode/agents/`; frontmatter `description` (required), `mode`, `model`, `temperature`, `top_p`, `steps`, `permission`, `disable`, `hidden`, `color`, `prompt` (D-agents).
- **Skills roots**: see harnesses.md (user `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`; project `.opencode/skills`, `.claude/skills`, `.agents/skills`). `opencode debug skill` lists the resolved set (L help).
- **User-level rules**: `~/.config/opencode/AGENTS.md` (harnesses.md; present locally, L `ls`).
- **Environment** (D-cli), most relevant: `OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG_CONTENT`, `OPENCODE_TUI_CONFIG`, `OPENCODE_PERMISSION`, `OPENCODE_SERVER_PASSWORD`, `OPENCODE_SERVER_USERNAME`, `OPENCODE_GIT_BASH_PATH` (Windows), `OPENCODE_DISABLE_AUTOUPDATE`, `OPENCODE_DISABLE_PROJECT_CONFIG`, `OPENCODE_DISABLE_CLAUDE_CODE`, `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS`, `OPENCODE_DISABLE_EXTERNAL_SKILLS`, `OPENCODE_PURE`, `OPENCODE_DB`, `OPENCODE_LOG_LEVEL`, `OPENCODE_PRINT_LOGS`, `OPENCODE_ENABLE_QUESTION_TOOL`. Experimental: `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS`, `OPENCODE_EXPERIMENTAL_WORKSPACES`, `OPENCODE_EXPERIMENTAL_PLAN_MODE`, `OPENCODE_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS`, and others listed at D-cli. Not cross-checked against the 1.18.21 binary.

### Couldn't verify

- The docs frame OpenCode 2 as current (`upgrade --major`); which documented env vars and keys apply to 1.18.21 is not checked.
- Default server port: install says `--port` default 0, docs say 4096.
- Desktop app and IDE extensions: not installed, not checked.
- Notifications, sandboxing and worktree support.
- `/doc` OpenAPI route and `/tui` routes: documented, not probed (no server started).

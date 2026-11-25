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

Refreshed 2026-11-25 on Linux from live `opencode v2.4.1` (`~/.opencode/bin/opencode`, installed via `https://opencode.ai/v2/install`); breaking-change notes in [opencode-v2-breaking-changes-20261125](../research/opencode-v2-breaking-changes-20261125.md).

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI, API, web GUI | `opencode` | 2.4.1 | `opencode --version` (L) | `7c06c5fe79ca` |

Help hashes recorded in [versions.json](./versions.json): `--help` `7c06c5fe79ca`, `run --help` `3d1a1381cf05`, `serve --help` `d96a692cc439`.

### Surfaces

- **CLI**: `opencode run [flags] [<message...>]` sends one message and exits (`--format json` emits JSON events, `--standalone` bypasses any running background daemon, `-m provider/model#variant` pins model + variant). Session management moved `export`/`import` under `opencode session {list,delete,export,import}`. Top-level `export`, `import`, `attach`, `providers`, `agent`, `web`, `github`, `pr`, `db`, `completion`, and `debug skill` were removed in V2 (L: `opencode --help`, `opencode session --help`).
- **TUI & Service**: `opencode [<directory>]` connects to the persistent background service (`opencode service {start,restart,status,stop,get,set,unset}`), or use `--server <url>` / `--standalone`. `opencode mini` launches the minimal interface (L).
- **API & Web**: `opencode serve` starts the v2 API and web server (`--hostname`, `--port`, `--cors`, `--service`, `--stdio`); `opencode pair` prints one-time browser/app links; `opencode api` queries the running server; `opencode acp` starts the ACP server (L). Basic auth uses `OPENCODE_PASSWORD` / `OPENCODE_SERVER_PASSWORD` with fixed username `opencode` (`OPENCODE_SERVER_USERNAME` removed).
- **Plugins**: `opencode plugin {list,add,check,update,remove}` manages V2 `@opencode/plugin` packages (V1 `@opencode-ai/plugin` implementations do not run in V2).

Config: `~/.config/opencode/` holds `opencode.json(c)`, global terminal config `cli.json` (replaces layered `tui.json(c)`), `AGENTS.md`, `skills/`, `agents/`, and `plugins/`.

### Key CLI reference (v2.4.1, live `--help`)

**Global flags:** `--help/-h`, `--version/-v`, `--wizard`, `--completions <bash|zsh|fish|powershell|sh|pwsh>`, `--log-level <all|trace|debug|info|warn|warning|error|fatal|none>`, `--print-logs`, `--standalone`, `--server <url>`.

**Top-level subcommands:** `upgrade|update`, `uninstall`, `acp`, `api`, `debug`, `auth`, `mcp`, `plugin`, `models`, `stats`, `mini`, `run`, `session`, `service`, `reload`, `machine`, `pair`, `serve`.

**`opencode run [flags] [<message...>]`:** `-c/--continue`, `-s/--session <id>`, `--fork`, `-w/--worktree [=name]`, `-m/--model <provider/model#variant>`, `--agent <name>`, `--format <default|json>`, `-f/--file <path>`, `--title <string>`, `--archived`, `--thinking`, `--auto`, plus global `--standalone` / `--server`. (`--variant` removed in V2.)

**`opencode session <subcommand>`:** `list`, `delete`, `export`, `import`. Export JSON uses `{ info, messages }` where assistant entries have `type: "assistant"` and `model: { providerID, id, variant }` (no V1 `.info` wrapper).

**`opencode plugin <subcommand>`:** `list`, `add`, `check`, `update`, `remove`.

**`opencode service <subcommand>`:** `start`, `restart`, `status`, `stop`, `get`, `set`, `unset`.

### Settings, skills, and permissions (V2)

- **Skills roots:** unchanged — user `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`; project `.opencode/skills`, `.claude/skills`, `.agents/skills`. V2 natively enforces `disable-model-invocation: true` and `metadata.opencode/autoinvoke: false`.
- **User-level rules:** `~/.config/opencode/AGENTS.md` (unchanged). V2 evaluates `AGENTS.md` vs `CLAUDE.md` per directory; `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` skips every `CLAUDE.md`.
- **Permissions:** ordered `permissions` array `{ action, resource, effect }` (last match wins). Action renames: `bash` -> `shell`, `task` -> `subagent`, `write`/`patch` -> `edit`. **`external_directory` defaults to `allow` in V2** (explicitly add `deny`/`ask` for contained critics). LSP is removed at runtime; `todowrite` is off unless `experimental.todo: true`.
- **MCP:** moved under `mcp.servers`; `enabled` -> `disabled`; Code Mode (`codemode: true`) is default.

### Couldn't verify

- Live model call and `opencode session export` round-trip with a live provider key on `v2.4.1` (CLI grammar and hashes verified locally; runtime export schema verified from `anomalyco/opencode@v2.4.1` source).
- Whether parent `opencode session export` embeds subagent model attribution directly or requires exporting the child `sessionID`.

# Kiro surfaces: kiro-cli and Kiro IDE

Grammar, marks and template: [README](./README.md). Kiro Crew (`kiro-cli crew`, `kirocrew`) is in [kiro-crew.md](./kiro-crew.md); this file covers only the launcher subcommand.

## Versions

Gathered 2026-11-01 on Windows 11, Git Bash.

| Surface | Program | Version | Read with | Help hash |
|---|---|---|---|---|
| CLI, TUI, API | `kiro-cli` (`%LOCALAPPDATA%\Kiro-Cli\kiro-cli.exe`) | 2.37.0 | `kiro-cli --version` | `039718fcd2b1` |
| CLI subcommand | `kiro-cli chat` | 2.37.0 | `kiro-cli chat --help` | `8288aa0b649b` |
| API | `kiro-cli acp` | 2.37.0 | `kiro-cli acp --help` | `b1c25994dfac` |
| API | `kiro-cli serve` | 2.37.0 | `kiro-cli serve --help` | `a200fe6008a3` |
| V3 engine (KAS) | `%LOCALAPPDATA%\Kiro-Cli\kas\<ver>-<sha>\` | newest dir 2.33.0 | `ls` of the `kas` dir | n/a |
| GUI | Kiro IDE launcher `%USERPROFILE%\AppData\Local\Programs\Kiro\bin\kiro` | 1.3.11 (commit `5a336feb6649`, x64) | `kiro --version` | `5303d61aa005` |

Hashes: `<cmd> --help | tr -d '\r' | sha256sum | cut -c1-12`. **L**

## Surfaces

- **CLI** (`kiro-cli chat --no-interactive [INPUT]`): one-shot run that prints the response and exits; `--output-format stream-json` emits ACP events as JSON Lines and implies `--no-interactive`. Two engines: **V2** (the default, "the pre-3.0 default" per help) and **V3**, the "next generation Kiro agent", selected with `--v3`, `--agent-engine v3` or setting `chat.agentEngine`. V3 runs on a separate bundled engine, KAS, kept under `%LOCALAPPDATA%\Kiro-Cli\kas\`. Other subcommands (`agent`, `mcp`, `settings`, `powers`, `login` ...) are plain CLI. Config: `~/.kiro/` (agents, settings, steering, skills, hooks, `permissions.yaml`), relocatable with `KIRO_HOME`. **L** (`kiro-cli --help`, `kiro-cli chat --help`, `ls ~/.kiro`); V3 naming **D** https://kiro.dev/docs/cli/v3/
- **TUI** (`kiro-cli` or `kiro-cli chat`): the interactive terminal UI, the default UI. The TUI front end is a JS bundle (`%LOCALAPPDATA%\Kiro-Cli\tui.js`, run by bundled `bun.exe`/`node.exe`). `--legacy-ui`/`--classic` picks the deprecated classic UI; `--sessions` (V3) opens the session dashboard. Same config as the CLI. **L** (help, install dir listing); default and deprecation **D** https://kiro.dev/docs/cli/terminal-ui/
- **GUI: Kiro IDE** 1.3.11, a VS Code fork. Launched from the Start menu or `kiro [paths...]`; `kiro chat <prompt>` opens a chat in the IDE, `kiro --agents` opens the agents window, `kiro gateway` serves "Agent Focus" to a local browser. User settings in `%APPDATA%\Kiro\User\settings.json`; launcher args in `~/.kiro/argv.json`; shares `~/.kiro/` and `.kiro/` (agents, hooks, steering) with the CLI. **L** (`kiro --help`, `kiro chat --help`, `kiro gateway --help`, `ls`); shared `.kiro/` **D** https://kiro.dev/docs/ide/whats-new-v1/
- **API**: `kiro-cli acp` is an Agent Client Protocol server (JSON-RPC 2.0 over stdio), V2 by default, V3 with `--agent-engine v3` or `acp.agentEngine`. `kiro-cli serve` is "a persistent WebSocket server for the v3 engine" on port 8082. `stream-json` output is the ACP event stream of a headless run. `kiro-cli acp-client` (hidden) is an ACP test client. **L** (help); ACP methods **D** https://kiro.dev/docs/cli/acp/

## Feature-to-surface matrix

| Feature | CLI | TUI | GUI (IDE) | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `chat --no-interactive [INPUT]` or stdin | ✓ `chat [INPUT]` seeds the first turn | ~ `kiro chat [prompt]` opens a chat in the IDE, does not exit with an answer | ✓ ACP `session/prompt` | L help; stdin **D** https://kiro.dev/docs/cli/headless/ |
| Structured output | ✓ `--output-format stream-json`; `-f json` for list commands | ✗ | ✗ | ✓ ACP JSON-RPC | L `chat --help` |
| Model selection | ✓ `--model <MODEL>`, `--list-models` | ✓ `--model`, `/model` | ✓ model picker in chat bar | ✓ `acp --model`; V3 `session/set_config_option`, V2 `session/set_model` | L help; GUI, ACP **D** https://kiro.dev/docs/ide/chat/, https://kiro.dev/docs/cli/acp/ |
| Reasoning effort | ✓ `--effort <EFFORT>` | ✓ `--effort`, `/effort` | ? | ✓ `acp --effort` | L help; `/effort` **D** slash-commands |
| Approvals / permission modes | ✓ `-a, --trust-all-tools`, `--trust-tools`; untrusted tools are denied in headless | ✓ prompts; `/tools`, `/permissions` (V3), `/autonomous` (V3) | ✓ Autopilot vs Supervised; always-allow/deny rules | ✓ `acp -a`, `--trust-tools`; requests go to the client | L help, binary string "Tool approval required but --no-interactive was specified"; **D** https://kiro.dev/docs/cli/headless/, https://kiro.dev/docs/ide/whats-new-v1/ |
| Sandboxing | ~ hidden `chat --sandbox` (V3 headless); `--cloud` runs in a cloud sandbox | ✓ `/sandbox` (local V3, 2.31+) | ? | ? | L `chat --sandbox --help` parses, binary string; **D** https://kiro.dev/docs/reference/slash-commands/ |
| Sub-agents | ~ delegated by the agent; trust comes from the parent's policy | ✓ subagent monitor `Ctrl+G`, `chat.enableSubagent` | ✓ sub-agent executions | ? | L settings list; **D** https://kiro.dev/docs/cli/headless/, slash-commands |
| Worktrees | ? | ? | ? | ? | Not found in help, settings or docs read |
| Background / parallel sessions | ~ `serve` keeps a V3 engine up; separate processes | ✓ `/spawn`, `--sessions` dashboard (V3), `chat.keybindings.moveToBackground` | ✓ parallel sessions in Agent Focus | ~ several ACP sessions per server | L help, settings; **D** slash-commands, https://kiro.dev/docs/ide/whats-new-v1/ |
| Session resume | ✓ `-r`, `--resume-id`, `-l/--list-sessions`, `-d/--delete-session` | ✓ `--resume-picker`, `/chat resume`, `/sessions` | ✓ History, session tabs | ✓ ACP `session/load` | L help; **D** https://kiro.dev/docs/cli/acp/ |
| Hooks | ✓ (non-interactive hooks from 2.27.1, V3) | ✓ `/hooks` | ✓ `.kiro/hooks/` v1 JSON | ? | L `~/.kiro/hooks/`, `hooks.showStatus`; **D** headless, whats-new-v1 |
| MCP | ✓ `kiro-cli mcp ...`, `--require-mcp-startup` (exit 3) | ✓ `/mcp` | ✓ `kiro --add-mcp <json>` and settings | ✓ ACP `_kiro.dev/mcp/*` (V2) | L help; **D** https://kiro.dev/docs/cli/acp/ |
| Skills / plugins | ✓ `powers install|uninstall`; skills from `~/.kiro/skills/`, `.kiro/skills/` | ✓ `/<skill-name>`, `/powers` | ✓ Powers, extensions (`--install-extension`) | ? | L help, `ls ~/.kiro`; **D** slash-commands |
| Notifications | ✗ | ✓ `chat.enableNotifications`, `chat.notificationMethod` (`auto`, `bel`, `osc9`) | ? | ✗ | L `settings list --all` |
| Remote / cloud runs | ✓ `--cloud`, `--repo` (V3/KAS) | ✓ `--cloud` | ~ `kiro tunnel`, `serve-web` (helper binary missing here), `gateway` | ? | L help; `kiro tunnel` failed with `spawn ...kiro-tunnel.exe ENOENT` |
| Spec mode | ✓ `--mode spec` (V3) | ✓ `/spec`, `--mode spec` | ✓ Spec workflow agent | ? | L `chat --help`; **D** https://kiro.dev/docs/ide/chat/ |
| Voice input | ✗ | ✓ (via hidden `kiro-cli voice`) | ? | ✗ | L `kiro-cli voice --help` "used by TUI" |

## CLI reference

### Common

Every `kiro-cli` subcommand prints these two; they are not repeated below. **L**

- `-v, --verbose...`: increase logging verbosity (repeatable).
- `-h, --help`: print help (`-h` gives a summary where the long help has more).

### `kiro-cli [OPTIONS] [COMMAND]` (global)

With no command it launches chat. **L** `kiro-cli --help`

- `--agent <AGENT>`: launch chat with the given agent (shorthand for `chat --agent`).
- `--tui`: launch chat in TUI mode.
- `--legacy-ui`: launch chat in legacy UI mode. Alias `--classic`.
- `--v3`: launch the next generation Kiro agent.
- `--v2`: use the V2 agent engine (the pre-3.0 default).
- `-r, --resume`: resume the most recent conversation from this directory.
- `--resume-id <SESSION_ID>`: resume a specific conversation by session ID.
- `--resume-picker`: interactively pick a conversation to resume. Alias `--list`.
- `--cloud`: run the session in a cloud sandbox (shorthand for `chat --cloud`).
- `--repo <REPO>`: repository to open in a cloud session (shorthand for `chat --repo`).
- `-V, --version`: print version.
- `--help-all` (hidden): accepted; prints the same text as `--help` on 2.37.0. **L** (`kiro-cli --help-all`)
- `--show-legacy-warning` (hidden): accepted by the parser; effect not observed. **L** (`kiro-cli --show-legacy-warning --version`)

Printed subcommands: `agent`, `chat`, `login`, `logout`, `whoami`, `profile`, `settings`, `diagnostic`, `issue`, `crew`, `mcp`, `powers`, `update`, `serve`, `help`. Hidden subcommands (not in `--help`, found in the binary's subcommand table and confirmed with `--help`): `acp`, `acp-client`, `user`, `version`, `uninstall`, `telemetry`, `init`, `doctor`, `voice`, `voice-serve`, `voice-cloud-setup`, `_`. **L** (`strings kiro-cli.exe`, then `kiro-cli <cmd> --help`)

### `kiro-cli chat [OPTIONS] [INPUT]`

`[INPUT]`: the first question to ask. **L** `kiro-cli chat --help`

- `-r, --resume`: resume the most recent conversation from this directory.
- `--resume-id <SESSION_ID>`: resume a specific conversation by session ID.
- `--resume-picker`: interactively select a conversation to resume from this directory.
- `--sessions`: launch straight into the session dashboard (V3/KAS only); closing it exits.
- `--agent <AGENT>`: context profile (agent) to use.
- `--model <MODEL>`: model to use.
- `--effort <EFFORT>`: initial effort level (e.g. `low`, `medium`, `high`, `xhigh`, `max`).
- `-a, --trust-all-tools`: let the model use any tool without confirmation.
- `--trust-tools <TOOL_NAMES>`: trust only these tools; `--trust-tools=fs_read,fs_write`, or `--trust-tools=` for none.
- `--no-interactive`: run without expecting user input. Hidden alias `--non-interactive` (parses). **L** binary string `no-interactivenon-interactive`
- `--trust-workspace`: skip the "Trust this workspace?" prompt for this launch only (V3 only); not saved.
- `-l, --list-sessions`: list saved chat sessions for the current directory.
- `--all-cwds`: with `--list-sessions`, span every workspace (local stores); one envelope per cwd in JSON.
- `--classic-only` (hidden): with `--list-sessions`, list only classic (v1) sessions; combines with `--all-cwds`. **L** binary string, parses
- `--list-models`: list available models and exit.
- `-f, --format <FORMAT>`: output format for `--list-models` and `--list-sessions`: `plain` (markdown, default), `json`, `json-pretty`.
- `--output-format <OUTPUT_FORMAT>`: response stream format: `text` (default) or `stream-json` (the run's ACP events as JSON Lines on stdout); `stream-json` implies `--no-interactive`.
- `-d, --delete-session <SESSION_ID>`: delete a saved chat session by ID.
- `--session-source <v1|v2>`: with `--delete-session`, target only the v1 or v2 store (default both).
- `-w, --wrap <WRAP>`: line wrapping: `always`, `never`, `auto` (default).
- `--require-mcp-startup`: require every enabled MCP server to start; exit code 3 if any fail.
- `--tui`: use the new terminal UI.
- `--legacy-ui`: use the legacy harness. Alias `--classic`.
- `--agent-engine <ENGINE>`: engine `v1`, `v2` (default) or `v3`.
- `--v3`: launch the next generation Kiro agent.
- `--v2`: use the V2 agent engine.
- `--mode <MODE>`: V3 agent mode: `default` or `spec`.
- `--cloud`: run in a cloud sandbox (V3/KAS only), interactive or `--no-interactive`; sends `_meta.kiro.executionTarget` on `session/new`.
- `--repo <REPO>`: repository for a cloud session, `name` or `owner/name`, comma-separated; only with `--cloud`.
- `--sandbox` (hidden): enable the configured local sandbox for this headless invocation. **L** binary string, parses; documented at **D** https://kiro.dev/docs/reference/cli-commands/

### `kiro-cli agent [OPTIONS] [COMMAND]`

Manage agents. **L** `kiro-cli agent --help` and each `kiro-cli agent <sub> --help`

- `agent list`: list available agents; local agents are found only when run in their directory. No own flags.
- `agent create [NAME]`: create an agent config (global agent dir unless a directory is given).
  - `-d, --directory <DIRECTORY>`: directory to save the agent in.
  - `-f, --from <FROM>`: agent to start from.
- `agent edit [NAME]`: edit an existing agent config.
  - `--path <PATH>`: path to the agent config file.
- `agent validate --path <PATH>`: validate a config.
  - `-p, --path <PATH>`: config path (no help text printed).
- `agent migrate`: migrate profiles to agents; potentially destructive to existing global agents.
  - `--force`: (no help text printed).
- `agent upgrade <DIR>`: rewrite top-level `*.json` agent configs in `<DIR>` to the universal format both engines load; leaves universal, V3-only, out-of-sync and externally managed agents alone.
  - `--no-backup`: don't save `<name>.json.bak` first.
  - `--dry-run`: report changes without writing.
- `agent set-default [NAME]`: set the default agent for `kiro-cli chat`. No own flags.
- `agent help`: print help for a subcommand.

### `kiro-cli login [OPTIONS]` (also `kiro-cli user login`)

**L** `kiro-cli login --help`, `kiro-cli user login --help`

- `--license <LICENSE>`: `free` (Builder ID) or `pro` (Identity Center).
- `--identity-provider <IDENTITY_PROVIDER>`: Identity Center URL.
- `--region <REGION>`: Identity Center region.
- `--social <SOCIAL>`: `google` or `github`.
- `--use-device-flow`: always use the OAuth device flow (no browser redirect).

### `kiro-cli logout`, `kiro-cli profile`

No own flags. `logout` logs out; `profile` shows the profile of the Identity Center (IdC) user. **L**

### `kiro-cli whoami [OPTIONS]` (also `kiro-cli user whoami`)

- `-f, --format <FORMAT>`: `plain` (default), `json`, `json-pretty`. **L**

### `kiro-cli user <COMMAND>` (hidden)

Same as the top-level commands: `login`, `logout`, `whoami`, `profile`, `help`; flags as above. **L** `kiro-cli user --help`

### `kiro-cli settings [OPTIONS] [KEY] [VALUE]` / `kiro-cli settings <COMMAND>`

Read or write a setting: `KEY` alone reads, `KEY VALUE` writes. **L** `kiro-cli settings --help`

- `-d, --delete`: delete a key (no value).
- `--global`: set or delete in global settings (default).
- `--workspace`: set or delete in workspace settings.
- `-f, --format <FORMAT>`: `plain` (default), `json`, `json-pretty`.
- `settings open`: open the settings file.
  - `--global`: global file (default).
  - `--workspace`: workspace file.
- `settings list`: list settings that are set.
  - `--all`: show every available setting with its description.
  - `-f, --format <FORMAT>`: `plain` (default), `json`, `json-pretty`.
- `settings help`.

### `kiro-cli diagnostic [OPTIONS]`

- `-f, --format <FORMAT>`: `plain` (default), `json`, `json-pretty`.
- `--force`: force limited diagnostic output. **L**

### `kiro-cli issue [OPTIONS] [DESCRIPTION]...`

Create a GitHub issue. **L**

- `-f, --force`: force issue creation.

### `kiro-cli crew [OPTIONS] [ARGS]...`

Launch Kiro Crew, installing it if missing; `[ARGS]` forward to the Crew CLI. See [kiro-crew.md](./kiro-crew.md). **L**

- `-y, --yes`: install without prompting; only before the first trailing argument (use `--` to forward a literal `--yes`).

### `kiro-cli mcp <COMMAND>`

**L** `kiro-cli mcp --help` and each `kiro-cli mcp <sub> --help`

- `mcp add`: add or replace a server.
  - `--name <NAME>`: server name (optional with a registry: shows a menu).
  - `--scope <SCOPE>`: `default`, `workspace`, `global`; only without `--agent`.
  - `--command <COMMAND>`: launch command (stdio servers).
  - `--url <URL>`: URL (HTTP servers).
  - `--args <ARGS>`: command arguments; repeat the flag, comma-separate with `\,` escapes, or pass a JSON array.
  - `--agent <AGENT>`: add to this agent instead of the global `mcp.json`.
  - `--env <ENV>`: environment variables for the server.
  - `--timeout <TIMEOUT>`: launch timeout in milliseconds.
  - `--disabled`: add the server disabled.
  - `--force`: overwrite a server of the same name.
- `mcp remove --name <NAME>`: remove a server.
  - `--name <NAME>`, `--scope <SCOPE>` (`default`, `workspace`, `global`), `--agent <AGENT>`.
- `mcp list [SCOPE]`: list servers; `SCOPE` is `default`, `workspace` or `global`. No own flags.
- `mcp import --file <FILE> [SCOPE]`: import server config from another file.
  - `--file <FILE>`: source file.
  - `--force`: overwrite a server of the same name.
- `mcp status --name <NAME>`: status of one server.
  - `--name <NAME>`.
- `mcp help`.

### `kiro-cli powers <COMMAND>`

Manage Powers (plugins). No own flags beyond common. **L**

- `powers install <NAME_OR_PATH>`: install by catalog name or local path.
- `powers uninstall <NAME>`: uninstall by name.
- `powers help`.

### `kiro-cli update [OPTIONS]`

**L** `kiro-cli update --help`

- `--check`: only check for updates.
- `--force`: install even if already on the latest version.
- `--non-interactive`, `-y` (hidden): accepted by the parser; documented as "skip confirmation". **L** parses; **D** https://kiro.dev/docs/reference/cli-commands/

### `kiro-cli serve [OPTIONS]`

Persistent WebSocket server for the V3 engine. **L**

- `--port <PORT>`: port to listen on (default 8082).

### `kiro-cli acp [OPTIONS]` (hidden)

Start an ACP agent on stdio. **L** `kiro-cli acp --help`

- `--agent <AGENT>`: agent for the first session.
- `--model <MODEL>`: model ID for the first session.
- `--effort <EFFORT>`: initial effort level (`low` ... `max`).
- `-a, --trust-all-tools`: auto-approve all tool permission requests.
- `--trust-tools <TOOL_NAMES>`: trust only these tools.
- `--agent-engine <ENGINE>`: `v1`, `v2` or `v3`; overrides `acp.agentEngine`; `v2` when neither is set.
- `--auth-method <METHOD>`: V3 engine token owner: `cli` (default, the `kiro-cli login` session) or `client` (forward access-token requests to the ACP client). Alias `--authMethod`.
- `--login`: log in interactively and exit, for ACP clients that run terminal authentication.

### `kiro-cli acp-client --agent <AGENT>` (hidden)

ACP test client. **L**

- `--agent <AGENT>`: path to the ACP agent executable.

### `kiro-cli version [OPTIONS]` (hidden)

**L** `kiro-cli version --help`

- `--changelog [<CHANGELOG>]`: show the changelog; `--changelog=all` or `--changelog=x.x.x`.

### `kiro-cli uninstall [OPTIONS]` (hidden)

- `-y, --no-confirm`: uninstall without confirmation. **L**

### `kiro-cli telemetry <COMMAND>` (hidden)

**L** `kiro-cli telemetry --help` and subcommands

- `telemetry enable`: turn telemetry on. No own flags.
- `telemetry disable`: turn telemetry off. No own flags.
- `telemetry status`: show whether telemetry is on.
  - `-f, --format <FORMAT>`: `plain` (default), `json`, `json-pretty`.
- `telemetry help`.

### `kiro-cli voice [OPTIONS]` (hidden)

Record voice and print the transcription to stdout; used by the TUI. **L**

- `--ptt`: push-to-talk (no silence auto-stop).
- `--confirm-download`: download the speech model if missing; without it a missing model emits `status:needs_download` and exits.

### `kiro-cli voice-serve [OPTIONS]` (hidden)

Voice recording server for remote or cloud desktops. **L**

- `--port <PORT>`: port (default 19876).
- `--bind <BIND>`: bind address (default 127.0.0.1).

### `kiro-cli voice-cloud-setup [OPTIONS] <HOST>` (hidden)

Set up voice for a cloud desktop, run locally; `<HOST>` is a hostname or SSH config alias. **L**

- `--port <PORT>`: voice server port (default 19876).
- `--remote-bin <REMOTE_BIN>`: path to the kiro binary on the cloud desktop.
- `-i, --identity <IDENTITY>`: SSH identity file.

### `kiro-cli init [ARGS]...` (hidden)

Accepts and ignores the old autocomplete bundle's shell-integration `init` calls. **L**

### `kiro-cli doctor` (hidden, removed)

Prints "`kiro-cli doctor` has been removed" and points to `diagnostic` or `issue`; ignores its arguments. **L** `kiro-cli doctor --help`, `kiro-cli doctor --all`

### `kiro-cli _ <COMMAND>` (hidden)

"Hidden helpers run by installers. Not for direct use." **L** `kiro-cli _ --help` and subcommands

- `_ cleanup-autocomplete-artifacts`: remove artifacts left by the autocomplete distribution.
  - `--dry-run`: report without removing.
  - `--force`: also remove legacy-named files and links (`q`, `qchat`, `kiro-cli-term`, ...) not proven to be from that install.
- `_ standalone-cohort`: print this user's `standalone` cohort as one JSON line.
- `_ standalone-cutover <COMMAND>`: switch a macOS desktop-app install to the standalone CLI.
  - `check`: print whether to switch now, as one JSON line.
  - `run`: install the standalone CLI at `~/.local/bin/kiro-cli`, then start `finish`.
    - `--wait-pid <WAIT_PID>`: pid of the desktop app that started `run`; `finish` then runs detached and waits for it.
  - `finish`: remove the desktop app once the standalone CLI is in place.
    - `--wait-pid <WAIT_PID>`: pid to wait for (up to 60 s) first.
- `_ extract-runtime`: install the embedded runtime into a shared directory and remove other versions.
  - `--dir <DIR>`: runtime root; default `KIRO_RUNTIME_DIR`, else `<prefix>/lib/kiro-cli`.

### Kiro IDE launcher: `kiro [options] [paths...]`

VS Code launcher grammar; append `-` to read stdin. Each option below is printed by `kiro --help`. **L**

Options:
- `-d, --diff <file> <file>`: compare two files.
- `-m, --merge <path1> <path2> <base> <result>`: three-way merge.
- `-a, --add <folder>`: add folders to the last active window.
- `--remove <folder>`: remove folders from the last active window.
- `-g, --goto <file:line[:character]>`: open a file at a position.
- `-n, --new-window`: force a new window.
- `-r, --reuse-window`: force an already open window.
- `--agents`: open the agents window (Kiro-specific).
- `-w, --wait`: wait for the files to close before returning.
- `--locale <locale>`: UI locale.
- `--user-data-dir <dir>`: user data directory (separate instances).
- `--profile <profileName>`: open with a profile, creating it if missing.
- `-h, --help`: print usage.

Extensions management:
- `--extensions-dir <dir>`: extensions root.
- `--list-extensions`: list installed extensions.
- `--show-versions`: show versions with `--list-extensions`.
- `--category <category>`: filter `--list-extensions` by category.
- `--install-extension <ext-id | path>`: install or update an extension (id, `id@version`, or VSIX).
- `--pre-release`: install the pre-release version.
- `--uninstall-extension <ext-id>`: uninstall an extension.
- `--update-extensions`: update installed extensions.
- `--enable-proposed-api <ext-id>`: enable proposed API for extensions.

Model Context Protocol:
- `--add-mcp <json>`: add an MCP server definition to the user profile, e.g. `'{"name":"server-name","command":...}'`.

Troubleshooting:
- `-v, --version`: print version.
- `--verbose`: verbose output (implies `--wait`).
- `--log <level>`: log level (`critical` ... `off`, or `${publisher}.${name}:${logLevel}`).
- `-s, --status`: print process usage and diagnostics.
- `--prof-startup`: CPU profiler during startup.
- `--disable-extensions`: disable all extensions (new window only).
- `--disable-extension <ext-id>`: disable one extension (new window only).
- `--sync <on | off>`: turn settings sync on or off.
- `--inspect-extensions <port>`: debug the extension host.
- `--inspect-brk-extensions <port>`: debug the extension host, paused at start.
- `--disable-lcd-text`: disable LCD font rendering.
- `--disable-gpu`: disable GPU acceleration.
- `--disable-chromium-sandbox`: for sudo on Linux or elevated AppLocker on Windows.
- `--locate-shell-integration-path <shell>`: print the shell integration script path (`bash`, `pwsh`, `zsh`, `fish`).
- `--telemetry`: show all telemetry events Kiro collects.
- `--transient`: run with temporary data and extension dirs.

Subcommands:
- `kiro chat [options] [prompt]`: run a prompt in a chat session in the cwd (append `-` for stdin). **L** `kiro chat --help`
  - `-m, --mode <mode>`: `ask`, `edit`, `agent` (default) or a custom mode id.
  - `-a, --add-file <path>`: add files as context.
  - `--maximize`: maximize the chat view.
  - `-r, --reuse-window`: use the last active window.
  - `-n, --new-window`: open an empty window.
  - `--profile <profileName>`: open with a profile.
- `kiro gateway [options]`: serve Agent Focus to a browser on this machine, with no window open. **L** `kiro gateway --help`
  - `--port <port>`: port (default 39275).
  - `--host <host>`: bind interface (default 127.0.0.1).
  - `--allowed-host <host>`: extra hostname to answer to (tunnel or proxy); repeatable.
  - `--pin <pin>`: six-digit pairing PIN instead of a random one.
- `kiro serve-web`: run a server that shows the editor UI in browsers. Help not readable here (helper binary missing).
- `kiro agent`: start and interact with AI agent hosts. Help not readable here.
- `kiro tunnel`: expose this machine to vscode.dev or other machines. Help not readable here.

## In-session commands

Source: **D** https://kiro.dev/docs/reference/slash-commands/ unless marked. Surfaces: TUI = kiro-cli interactive (V2 and V3 unless noted); the IDE has its own slash commands (not listed on that page); headless runs accept none, but a first message starting `@<prompt-name>` runs a prompt (2.33+, **D** headless page). ACP clients can run them through `_kiro.dev/commands/execute` (V2, **D** acp page).

| Command | Meaning | Surfaces / notes |
|---|---|---|
| `/help` | Help Agent, or classic help with `--legacy` | TUI |
| `/quit` (`/exit`, `/q`) | Exit | TUI |
| `/clear` | Reset history, keep the session | TUI |
| `/context` | Show, add, remove, clear context rules | TUI |
| `/model` | Pick model and reasoning, fallbacks | TUI |
| `/effort` | Set reasoning level | TUI (V2, V3) |
| `/agent` | `list`, `create`, `generate`, `edit`, `schema`, `set-default`, `swap` | TUI; create/edit need local V3 |
| `/upgrade-agent` | Migrate agent configs to V3 format | TUI (V3) |
| `/spawn` | Start a parallel session (`--name`) | TUI |
| `/chat` | `new`, `resume`, `save`, `load` | TUI; V3 saves zip, 2.x JSON |
| `/sessions` | Session dashboard | TUI (V3) |
| `/session-id` | Print session ID | TUI |
| `/save`, `/load` | Save or load a conversation file | TUI |
| `/editor`, `/reply` | Compose in `$EDITOR`; reply quoting the last answer | TUI |
| `/fullscreen` | Toggle inline/fullscreen | TUI (V2, V3) |
| `/checkpoint` | Workspace checkpoints | TUI, classic only, experimental |
| `/rewind` | Fork at an earlier turn (replaces `/checkpoint` in V3) | TUI (V3) |
| `/plan` | Plan agent | TUI |
| `/spec` | Specs: list, create, run, view | TUI; not in cloud sessions |
| `/guide` | Guide agent | TUI only |
| `/knowledge` | Knowledge base | TUI; default on in V3 |
| `/compact` | Summarize to free context | TUI |
| `/paste` | Paste clipboard image | TUI |
| `/tools` | `schema`, `trust`, `untrust`, `trust-all`, `reset` | TUI |
| `/permissions` | Policies for unresolved actions | TUI (interactive V3, 2.36+) |
| `/autonomous` | Local autonomous mode on/off | TUI (local V3) |
| `/sandbox` | Local command sandbox | TUI (local V3, 2.31+) |
| `/prompts` | Manage prompts; V3 also `/<prompt-name>` | TUI |
| `/hooks` | Active hooks | TUI |
| `/usage` | Billing and credits | TUI |
| `/mcp`, `/mcp auth`, `/mcp cancel-auth`, `/mcp logout` | MCP status and OAuth | TUI |
| `/config` | Review agents, MCP, Powers, steering, skills, hooks | TUI (V3) |
| `/powers` | List, install, uninstall Powers | TUI; install needs local V3 |
| `/settings` | Settings menu | TUI |
| `/experiment` | Toggle experimental features | TUI |
| `/theme`, `/title` | Colors; terminal title | TUI |
| `/copy`, `/transcript` | Copy last answer; transcript pager or save | TUI |
| `/code` | Code intelligence `init`, `overview`, `status`, `logs` | TUI |
| `/tangent` | Side conversation, `merge` back | TUI |
| `/todos` | To-do list | TUI |
| `/workflow` | Workflow history and control | TUI (when enabled) |
| `/goal` | Iterative goal loop | TUI |
| `/issue`, `/logdump`, `/changelog` | Report issue; zip logs; release notes | TUI |
| `/<skill-name>` | Invoke a skill | TUI |

Keybindings (TUI, **D** slash-commands and terminal-ui pages): `Ctrl+C` cancel/exit, `Ctrl+D` exit, `Ctrl+G` subagent monitor, `Ctrl+J`/`Shift+Enter`/`Alt+Enter` newline, `Ctrl+O` expand output, `Ctrl+R` history search, `Ctrl+S` fuzzy command search, `Ctrl+X` activity tray, `Shift+Tab` plan mode, `Esc` close/cancel/clear queue. Configurable keys **L** (`settings list --all`): `chat.keybindings.cancelStream`, `.closeMenu`, `.quit`, `.toggleSessionDashboard`, `.moveToBackground`, `.toggleInterruptBehavior` (default `ctrl+s`), plus `chat.skimCommandKey`, `chat.tangentModeKey`, `chat.delegateModeKey`, `chat.autocompletionKey`.

## Settings and environment

Paths:
- Global CLI settings `~/.kiro/settings/cli.json`; workspace `.kiro/settings/cli.json`. **L** (`ls ~/.kiro/settings`) **D** https://kiro.dev/docs/reference/settings/
- MCP: `~/.kiro/settings/mcp.json` (global); per agent via `mcp add --agent`. **L** `ls`, `mcp add --help`
- Agents `~/.kiro/agents/*.json` (and `.kiro/agents/`), steering `~/.kiro/steering/`, skills `~/.kiro/skills/`, hooks `~/.kiro/hooks/*.json`, permissions `~/.kiro/permissions.yaml`, sessions `~/.kiro/sessions/`. **L** `ls ~/.kiro`
- IDE user settings `%APPDATA%\Kiro\User\settings.json`; launcher args `~/.kiro/argv.json`. **L** `ls`
- Install, engine and TUI bundle: `%LOCALAPPDATA%\Kiro-Cli\` (`kiro-cli.exe`, `kas\`, `tui.js`, `bun.exe`, `node.exe`, `data.sqlite3`). **L** `ls`

`kiro-cli settings list --all` prints 146 keys on 2.37.0. The ones an orchestrator most needs (**L**):

| Key | Meaning |
|---|---|
| `chat.agentEngine` | Default engine `v1`, `v2` (default), `v3` |
| `acp.agentEngine` | Engine for `kiro-cli acp`: `v2` (default) or `v3` |
| `chat.defaultModel` / `chat.defaultAgent` | Defaults for new chats |
| `chat.ui` / `chat.uiMode` | `legacy` or `tui`; `lite`/`tui` or `structured` |
| `chat.disableTrustAllConfirmation` | Skip the trust-all confirmation gate at startup |
| `chat.enableSubagent`, `chat.enableDelegate` | Subagents; delegate tool for background sessions |
| `chat.enableWorkflows`, `chat.workflowLaunch` | KAS workflows: `when-asked`, `large-tasks`, `delegate-all` |
| `chat.defaultInterruptBehavior` | Follow-up delivery `steer` or `queue` |
| `chat.disableInheritingDefaultResources` | Custom agents stop inheriting steering, skills, AGENTS.md |
| `chat.enableAutoAgentUpgrade` | Auto-upgrade V2 agent configs on V3 launch (default true) |
| `mcp.initTimeout`, `mcp.noInteractiveTimeout` | MCP start timeouts |
| `api.timeout`, `api.subagentTimeout`, `api.streamIdleSoftTimeout`, `api.streamIdleHardTimeout` | Request and stream timeouts (seconds) |
| `chat.enableNotifications`, `chat.notificationMethod` | Desktop notifications, `auto`/`bel`/`osc9` |
| `memory.mode`, `memory.reflection` | KAS memory `read_write`/`read_only`/`disabled` |
| `chat.disableAutoCompaction`, `compaction.*` | Compaction control |
| `app.disableAutoupdates` | No auto-update at start |
| `cleanup.periodDays` | Age at which old conversations are deleted |

Environment variables:
- Documented (**D** https://kiro.dev/docs/reference/settings/, https://kiro.dev/docs/cli/headless/, https://kiro.dev/docs/cli/terminal-ui/): `KIRO_HOME` (relocate `~/.kiro`), `KIRO_API_KEY` (headless auth), `KIRO_HEADLESS_WORKFLOW_TIMEOUT_SECS` (default 21600), `KIRO_LOG_LEVEL`, `KIRO_LOG_NO_COLOR`, `NO_COLOR`, `KIRO_CHAT_UI`, `KIRO_SCREEN_READER`, `KIRO_ACP_RECORD_PATH`, `KIRO_CLI_TOOL_SEARCH_MATCHING_THRESHOLD`, `KIRO_ASCII_MODE`.
- Present as strings in the 2.37.0 binary but undocumented (**L** `strings kiro-cli.exe`; meaning **I** from the name): `KIRO_AGENT_ENGINE`, `KIRO_AGENT_CONFIG_DIR`, `KIRO_RUNTIME_DIR`, `KIRO_DATA_DIR`, `KIRO_SESSION_ID`, `KIRO_REQUIRE_MCP_STARTUP_TIMEOUT_SECS`, `KIRO_SUBAGENT_STALL_TIMEOUT_MS`, `KIRO_FORCE_INTERACTIVE`, `KIRO_NO_AUTO_UPDATE`, `KIRO_CHAT_LOG_FILE`, `KIRO_KAS_SERVER_PATH`, `KIRO_KAS_NODE_PATH`, `KIRO_ENABLED_FEATURES`, `KIRO_CLI_IS_CHILD_PROCESS`.

## Couldn't verify

- **Version drift with [harnesses.md](../harnesses.md):** it says "probed 2.31.0" and mentions 2.34; the local install is 2.37.0. Its model row ("Opus 4.5 on 2.16.0") was not re-checked (no `--list-models` call made). Its `--trust-tools=fs_read` read-only recipe matches the 2.37.0 grammar; per the headless docs V3 non-interactive matches exact internal tool IDs, so `fs_read` may not be the V3 ID. **L** vs **D**
- **Docs list subcommands the install rejects** (https://kiro.dev/docs/reference/cli-commands/): `translate`, `theme`, `integrations`, `inline` all give "unrecognized subcommand"; `doctor` (docs: `--all`, `--strict`, `--format`) is removed; `update --relaunch-dashboard` and `--rollout` are rejected. Trust the install. **L**
- **Docs omit flags the install has:** `--output-format`, `--sessions`, `--trust-workspace`, `--mode`, `--agent-engine`, `--all-cwds`, `--session-source` and the `acp`, `serve`, `user`, `telemetry`, `voice*`, `version`, `uninstall` commands are absent from the CLI commands page. `--sandbox` is documented but hidden from `--help`. `--help-all` is documented as "help for all subcommands" but prints only top-level help on 2.37.0.
- **Headless auth:** docs say headless "requires" `KIRO_API_KEY`; harnesses.md runs `chat --no-interactive` on a logged-in session. Not re-run here (no work sessions started), so which one 2.37.0 needs per engine is unknown.
- **`serve` protocol:** not started; WebSocket message format, auth and whether it serves several clients are unverified. Not in the docs read.
- **ACP on V3:** methods and the `_meta.kiro.extensionMethods` list are documented, not observed; `--auth-method client` flow untested.
- **`stream-json` event names:** not observed; the docs give no event list.
- **`--show-legacy-warning`:** parses, effect unknown.
- **IDE:** `kiro serve-web`, `kiro agent` and `kiro tunnel` fail with `spawn ...\bin\kiro-tunnel.exe ENOENT`, so their flags are unrecorded. IDE slash commands, notifications, sandboxing, worktrees and whether the IDE uses the V3/KAS engine are not covered in the docs read. Autopilot/Supervised are documented in Agent Focus; "vibe" mode was not found.
- **Worktrees:** no flag, setting or doc page found on any surface.
- **Keybinding conflict in docs:** the slash-commands page binds `Ctrl+T` to tangent mode; the terminal-ui page binds it to the transcript pager.
- **`crew -y`:** docs say Windows needs a separate install; not tested.
- **Settings snapshot:** the saved `kiro-settings-all.txt` and a live `settings list --all` list the same keys; five `Current:` values differed between the two reads. Values are not recorded here.

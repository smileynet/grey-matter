# Antigravity surfaces: agy CLI and TUI, Antigravity app, Antigravity IDE

Google Antigravity ships three programs on this machine: the `agy` binary, which is both the CLI and the TUI; the Antigravity 2.x desktop app; and the Antigravity IDE, a VS Code fork. Evidence marks follow the [README](./README.md): **L** local install, with the command named; **D** documented, with the URL; **I** inferred, with the reason. Where the docs and the install disagree, both are recorded and the install wins. For deployment of grey-matter skills to agy, see [harnesses.md](../harnesses.md#agy-ancillary-google-antigravity-cli). For sub-agent orchestration, see [harness-orchestration-primitives](../research/harness-orchestration-primitives.md#spike-results-agy-2026-10-31).

## Versions

Gathered 2026-11-01 on Windows 11 Pro 10.0.26300, Git Bash.

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI | `%LOCALAPPDATA%\agy\bin\agy.exe` | 1.4.12 | `agy --version` (L) | `8db8bb69e55f` |
| GUI: desktop app | `%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe` | 2.28.2 | `version` field of `package.json` inside `resources\app.asar`, read in place (L) | none: the app has no `--help` |
| GUI: IDE | `%LOCALAPPDATA%\Programs\Antigravity IDE\bin\antigravity-ide` | 1.107.0 (VS Code base), IDE 2.5.5, commit `ecfbad74` | `antigravity-ide --version` and `ideVersion` in `resources\app\product.json` (L) | `819e5620572d` |
| API: stream-json, `agentapi` | same `agy.exe` | 1.4.12 | as above (L) | `agentapi --help`: `77a08412f01e` |

- **The agy help goes to stderr.** `agy --help` prints nothing on stdout and exits 0. The README pipeline `agy --help | tr -d '\r' | sha256sum` therefore hashes the empty string (`e3b0c44298fc`). The hash in the table uses `agy --help 2>&1 | tr -d '\r' | sha256sum | cut -c1-12` (L).
- The desktop app's `resources\..\version` file says `44.5.1`. That is probably the Electron runtime, not the app version (I: the file sits beside the Electron DLLs, and the app's `package.json` says 2.28.2).
- The docs changelog lists App v2.28.2 (2026-10-29) as latest, which matches the install. Its CLI section stops at v1.4.10, two releases behind the install's 1.4.12. Its IDE extensions list v2.6.0, ahead of the install's 2.5.5 (D: https://antigravity.google/docs/changelog). So the docs lag the CLI and the local IDE lags the docs.
- Earlier probes of this machine recorded agy 1.1.14, 1.2.0, 1.4.5, 1.4.10 and 1.4.12 ([harnesses.md](../harnesses.md), [orchestration primitives](../research/harness-orchestration-primitives.md)). The binary auto-updates (`~/.gemini/antigravity-cli/updater/`, L), so re-check the hash before trusting this file.

Subcommand help hashes (`agy <sub> --help 2>&1 | tr -d '\r' | sha256sum | cut -c1-12`, L):

| Subcommand | Hash | | Subcommand | Hash |
|---|---|---|---|---|
| `agent`, `agents` | `efb73bb80ea8` | | `mcp add` | `5964c88330bb` |
| `changelog` | `68366255fd48` | | `mcp remove` | `cdce7db3d97e` |
| `install` | `a58924f656c6` | | `mcp list` | `5c444d1e5454` |
| `mcp` | `673b231375e1` | | `mcp enable` | `cd64f8f5da78` |
| `mic-serve` | `586aa47959c8` | | `mcp disable` | `3af622fe9db2` |
| `models` | `d488d5f420f1` | | `plugin validate` | `10ad31799791` |
| `plugin`, `plugins` | `6cc51dc26bdb` | | `remote-control status` | `6da0a57f456e` |
| `remote-control` | `8758c1ed23fa` | | `update` | `08eaabe6131d` |
| `help` (`help --help` errors) | `ce90ba390157` | | `agentapi` (hidden) | `77a08412f01e` |

## Surfaces

**CLI.** `agy -p "<prompt>"` (also `--print`, `--prompt`) runs one headless turn and exits; `--output-format text|json|stream-json` shapes the result (L: `agy --help`). Management subcommands (`mcp`, `plugin`, `models`, `remote-control`, ...) run without starting a session (L). Install: `irm https://antigravity.google/cli/install.ps1 | iex` puts the binary in `%LOCALAPPDATA%\agy\bin` (D: https://antigravity.google/docs/getting-started?tab=cli; L: the binary is there and on `PATH`). Config is `~/.gemini/antigravity-cli/settings.json`, plus the shared `~/.gemini/config/` (L, D).

**TUI.** Running `agy` with no one-shot mode, or `agy -i "<prompt>"`, opens the interactive terminal UI in the current directory (L: `--help`; D: getting-started?tab=cli). It owns the slash commands, the `/config` panel, `Shift+Tab` mode cycling, the `/diff` viewer and the sub-agent question picker. Keybindings live in `~/.gemini/antigravity-cli/keybindings.json` (D: https://antigravity.google/docs/settings?tab=cli). Same config as the CLI.

**GUI: Antigravity desktop app (2.x).** The Electron app `Antigravity.exe`, described in its `package.json` as "Antigravity - Agentic Desktop Application" (L). It has no command line. Its agent data sits in `~/.gemini/antigravity/` (`brain/`, `conversations/`, `mcp_config.json`, `user_settings.pb`, L) and its Electron profile in `%APPDATA%\Antigravity\` (L). It bundles its own `resources\bin\language_server.exe` (L). The docs present it as "the App": permission presets, worktree-backed projects, a Marketplace tab, and Remote Control under Settings > Application (D: https://antigravity.google/docs/features, https://antigravity.google/docs/permissions, https://antigravity.google/docs/remote-control). It shares sign-in with the CLI and the IDE extensions (D: https://antigravity.google/docs/ide/extensions/). It updates from `antigravity-hub-auto-updater-…run.app` (L: `resources\app-update.yml`).

**GUI: Antigravity IDE.** A VS Code 1.107.0 fork (`applicationName: antigravity-ide`, `dataFolderName: .antigravity-ide`, L: `product.json`), with a built-in `antigravity` extension 0.2.0 plus `antigravity-code-executor`, `antigravity-dev-containers`, `antigravity-remote-openssh` and `antigravity-remote-wsl` (L: `resources\app\extensions\`). Launch with `antigravity-ide [paths...]` or `antigravity-ide chat "<prompt>"` (L: `--help`). Config lives in `%APPDATA%\Antigravity IDE\User\settings.json` and `~/.antigravity-ide/extensions/` (L), and its agent data in `~/.gemini/antigravity-ide/` (L). `serve-web` and `tunnel` fail locally with `spawn …\bin\antigravity-tunnel.exe ENOENT`: the tunnel binary isn't shipped (L). The docs page https://antigravity.google/docs/ide returned 403, and the extensions page doesn't describe the IDE as a product (D), so its agent features below are mostly **?**.

**API.** Three programmatic entry points, all through `agy.exe`:
- **stream-json.** `agy -p --input-format stream-json --output-format stream-json` reads one NDJSON message per line from stdin and runs one turn per message in a single conversation (L: `--help`). Input is `{"event":"user","message":{"content":"..."}}`, where content is a string or a list of `text` blocks. Output is the events `init` (with `cwd`, `tools`, `permission_mode`), `step_update` (with `step_index`, `state` `ACTIVE|DONE`, `step_type`, `text_delta`) and a final `result` with the same shape as `json` output (D: https://antigravity.google/docs/cli/headless/). `result` carries `finished_reason` (`print_timeout`, `interrupted` or `error`; absent on normal completion) since 1.4.11, and usage with `cache_read_tokens` (L: `agy changelog`). The 2026-10-31 spike drove stream-json headless successfully (L: [primitives](../research/harness-orchestration-primitives.md#spike-results-agy-2026-10-31)).
- **Remote Control.** `--remote-control` or `/remote-control` gives a session-scoped tunnel; `agy remote-control start|status|stop` runs a background daemon registered with the OS service manager (L: `--help`, `agy changelog` 1.2.6/1.2.0). The remote side is a browser at `https://antigravity.google.com`, with links of the form `/r/<instance-id>?p=c%2F<conversation-id>` (D: https://antigravity.google/docs/remote-control). `agy remote-control status` printed `Daemon status: not registered` (L).
- **`agentapi` (hidden).** Not listed in `agy --help`. `~/.gemini/antigravity-cli/bin/agentapi.bat` forwards to `agy.exe agentapi %*`. It offers `get-conversation-metadata`, `new-conversation` and `send-message` (L: `agy agentapi --help`). It is probably what agents and the app use to start and message conversations (I: the name and the `.bat` shim in the agent's `bin/`; the binary also contains RPC names such as `GetRemoteControlInfo`). It is undocumented.

## Feature-to-surface matrix

CLI = `agy -p`; TUI = interactive `agy`; GUI = desktop app (A) / IDE (E); API = stream-json, Remote Control or `agentapi`.

| Feature | CLI | TUI | GUI | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `-p` | ~ `-i` runs an initial prompt, then stays interactive | A ✗; E ~ `antigravity-ide chat "<prompt>"` opens a chat in the IDE window | ✓ stream-json turn; `agentapi new-conversation <prompt>` | L: `agy --help`, `antigravity-ide chat --help`, `agy agentapi --help` |
| Structured output | ✓ `--output-format json\|stream-json`, `--json-schema` | ✗ | ? | ✓ stream-json events | L: `--help`; D: cli/headless |
| Model selection | ✓ `--model`, `--effort`; `agy models` lists them | ✓ `/model`, `/effort` | A ? E ? | ~ `agentapi new-conversation --model=<flash_lite\|flash\|pro\|model_id>` | L: `--help`, `agy models`, `agentapi --help` |
| Approvals and permission modes | ~ `--mode`, `--dangerously-skip-permissions`, session `--settings` rules. Headless can't prompt, so unapproved tools are denied | ✓ prompts, `Shift+Tab`, `/permissions`, `/config` | A ✓ presets Request Review / Default / Auto / Turbo; E ? | ~ Remote Control can approve; settings editable from the browser | L: `--help`, spike P3; D: permissions, remote-control |
| Sandboxing | ✓ `--sandbox` | ✓ `enableTerminalSandbox` in `/config` | A ✓ part of the Default/Auto presets; E ? | ? | L: `--help`, `config.json` key; D: permissions |
| Sub-agents | ✓ `invoke_subagent`, `define_subagent`, `send_message` tools | ✓ plus `/agents` | A ✓; E ? | ~ `agentapi send-message` (I) | L: spike P1; D: features |
| Worktrees | ✓ sub-agent `Workspace: "branch"` makes a git worktree | ✓ same | A ✓ worktree-backed projects; E ? | ? | L: spike P2; D: features ("Worktrees: App") |
| Background or parallel sessions | ~ a sub-agent runs in the background; `-p` waits for it up to the `--print-timeout` deadline | ✓ `/agents`, `/tasks` | A ✓; E ? | ✓ Remote Control daemon; one tunnel per session | L: spike P6, `agy changelog`; D: remote-control |
| Session resume | ✓ `-c`/`--continue`, `--conversation <id>` | ✓ `/resume` | A ✓ (I: shared conversation store) | ✓ `agentapi get-conversation-metadata` | L: `--help`; D: getting-started?tab=cli |
| Hooks | ✓ honoured headless | ✓ `/hooks` | A ✓; E ? | ✗ | L: `~/.gemini/config/hooks.json` holds a `PreInvocation` hook; D: features, settings?tab=cli |
| MCP | ✓ `agy mcp add\|remove\|list\|enable\|disable` | ✓ `/mcp` | A ✓; E ✓ `--add-mcp <json>` | ~ MCP calls carry `_meta["antigravity.google/root_conversation_id"]` | L: `mcp --help`, `antigravity-ide --help`, `agy changelog` 1.4.4 |
| Skills or plugins | ✓ `agy plugin …`; `-p "/skill …"` expands skills unless `--disable-slash-commands` | ✓ `/plugin`, `/skills` | A ✓ Marketplace tab; E ✓ VS Code extensions | ✗ | L: `plugin --help`, `agy plugin list` (grey-matter 48 skills, tkt 4) |
| Notifications | ✗ | ✓ `notifications` setting; OSC 7501 tab status | A ✓ (via Remote Control push) | ✓ browser push on the remote side | L: `settings.json` has `"notifications": true`, `agy changelog` 1.4.0; D: remote-control |
| Remote or cloud runs | ~ `--remote-control` on a `-p` run (?) | ✓ `--remote-control`, `/remote-control on\|off` | A ✓ Settings > Application > Enable Remote Control; E ✗ (`tunnel` binary missing) | ✓ `remote-control start` daemon; browser dashboard | L: `--help`, `remote-control status`, IDE `tunnel` ENOENT; D: remote-control |
| Voice dictation | ✗ | ✓ `/voice`, `F5`; `agy mic-serve` forwards a microphone over SSH | ? | ✗ | L: `mic-serve --help`, `agy changelog` |
| Scheduling | ✓ `schedule` tool | ✓ `/schedule` | A ✓ | ? | L: spike P7 tool list; D: slash-commands |

## CLI reference

### agy (global)

```
agy [flags] [prompt]
agy [flags] -p <prompt>
agy <subcommand> [flags] [args]
```

Printed by `agy --help` (L). Go-style parsing: `--flag value` and `--flag=value` both appear in the docs and changelog; `-p` takes no value of its own, and the prompt is the trailing argument (I: help gives no `<value>` for `-p`; the changelog for 1.1.18 says a valueless prompt flag no longer swallows the next flag, and a stray trailing argument is now an error). Put the flags first and the prompt last, as [harnesses.md](../harnesses.md) says.

| Flag | Meaning |
|---|---|
| `--add-dir <dir>` | Add a directory to the workspace; repeatable (default `[]`). |
| `--agent <name>` | Agent for this session. Headless runs exit 1 and list agents when the name matches none (L: changelog 1.3.4). |
| `-c` | Short alias for `--continue`. |
| `--continue` | Continue the most recent conversation. |
| `--conversation <id>` | Resume a previous conversation by ID. |
| `--dangerously-skip-permissions` | Auto-approve every tool permission request (`always-proceed`). Plans in `/plan` still wait for review (L: changelog 1.3.2). |
| `--disable-slash-commands` | Disable slash command and skill expansion in print mode. |
| `--effort <level>` | Reasoning effort for this session: `low\|medium\|high\|xhigh\|max`. |
| `-i <prompt>` | Short alias for `--prompt-interactive`. |
| `--input-format <fmt>` | Print-mode input: `text` (default) or `stream-json`. `stream-json` reads NDJSON from stdin, one turn per line, and requires `--output-format stream-json`. |
| `--json-schema <schema\|path>` | JSON schema, inline or a file, to enforce on structured output; for stream-json, only the final result. The root must be `"type": "object"`, or startup fails with exit 1 (L: changelog 1.2.14). |
| `--log-file <path>` | Override the CLI log file path (default `~/.gemini/antigravity-cli/log/cli-<timestamp>.log`, L). |
| `--mode <mode>` | Execution mode for this session: `accept-edits`, `auto`, `plan`. |
| `--model <model>` | Model for this session; slugs come from `agy models`. Print mode fails non-zero on an unknown model. |
| `--new-project` | Create a new project for this session. |
| `--output-format <fmt>` | Print-mode output: `text` (default), `json`, `stream-json`. |
| `-p` | Short alias for `--print`. |
| `--print` | Run a single prompt non-interactively and print the response. |
| `--print-timeout <dur>` | Time limit for print mode; `0` waits until the turn completes (default `0s`). On expiry, prints the partial output, warns and exits 0 with `finished_reason: print_timeout`. |
| `--project <id\|name>` | Project ID or project name for this session. |
| `--prompt` | Alias for `--print`. |
| `--prompt-interactive <prompt>` | Run an initial prompt interactively and continue the session. Combining it with `--print` exits 2. |
| `--remote-control` | Create a Remote Control connection for the session at start-up. |
| `--sandbox` | Run with the terminal sandbox enabled. |
| `--settings <json\|path>` | Session-only settings, never saved: a JSON object of `settings.json` keys, inline or a file path. Undocumented on the reference page (D: https://antigravity.google/docs/cli/reference/ omits it). |

Docs vs install for the global flags:
- `--print-timeout`: help says default `0s` (L); the reference page agrees (D: cli/reference); the headless page says the default is five minutes (D: cli/headless). The changelog says headless runs became unlimited in 1.2.6, and from about 1.2.10 wait for background tasks "up to a 30-minute cap" (L: `agy changelog`). The spike saw `waiting up to 40m0s for 1 background task(s)` (L: spike P6). Trust `0s`, and treat the background-task cap as unverified.
- `--mode auto` on Windows: the docs say Windows needs CLI 1.4.4+, Windows 11 24H2 with the August 2026 update, and a non-business account; in headless runs, `auto` warns and continues in `default` (D: https://antigravity.google/docs/cli/modes/). The spike saw `--mode auto` refused on this machine with "not available for this account" (L: spike P3). That fits the account rule (I). [Primitives](../research/harness-orchestration-primitives.md) quotes the 1.3.5 changelog line ("Linux and macOS only"), which 1.4.4 superseded (L: `agy changelog` 1.4.4).

Exit codes: 0 success, including soft-denied tools and an expired `--print-timeout`; 1 for startup errors such as a bad `--json-schema`, unknown `--agent` or `--model`, or malformed stream-json input; 2 for usage errors such as `--print` plus `--prompt-interactive`, or stream-json control messages; 3 for a turn ended by a model or agent error, which also prints `AGY_ERROR: {...}` on stderr (L: `agy changelog` 1.3.4, 1.2.6, 1.2.10; D: cli/headless for 1 and 2). The headless page doesn't mention `AGY_ERROR`, exit 3 or `finished_reason` (D).

### agy agent | agy agents

```
agy agent [flags]
```

List available agents. `agents` is identical (same help hash). Printed nothing with no custom agents (L).

| Flag | Meaning |
|---|---|
| `-h`, `--help` | Show help. |

The changelog says `models` and `agents` gained `--output-format json|stream-json` (L: `agy changelog`, about 1.1.12). On 1.4.12 both reject it with `Error: flags provided but not defined: -output-format`, exit 1 (L: `agy models --output-format json`). Trust the rejection.

### agy changelog

```
agy changelog [flags]
```

Print the changelog and release notes to stdout and exit, without starting a session (L: 1,073 lines, exit 0). Flags: `-h`, `--help`.

### agy help

```
agy help [subcommand]
```

Show help for subcommands; `agy help` alone repeats the global help (L). `agy help --help` fails with `Error: unknown subcommand: --help`, exit 1 (L).

### agy install

```
agy install [flags]
```

Configure environment paths and shell settings. Not run (it edits the shell profile).

| Flag | Meaning |
|---|---|
| `--dir <dir>` | Custom directory to configure PATH for. |
| `--skip-aliases` | Skip purging shell-profile aliases. |
| `--skip-path` | Skip appending to the shell-profile PATH. |
| `-h`, `--help` | Show help. |

### agy mcp

```
agy mcp <subcommand> [flags] [args]
```

Manage MCP servers in the user-level `mcp_config.json` (L: `mcp --help`; changelog 1.1.16). `agy mcp list` printed `No MCP servers configured.` (L).

| Subcommand | Usage | Meaning |
|---|---|---|
| `add` | `agy mcp add [flags] <name> <commandOrUrl> [args...]` | Add or update a server. Flags must come before `<name>`; use `--` before a command or argument that starts with `-`. |
| `remove` | `agy mcp remove <name> [flags]` | Remove a server. |
| `list` | `agy mcp list [flags]` | List configured servers. |
| `enable` | `agy mcp enable <name> [flags]` | Enable a server. |
| `disable` | `agy mcp disable <name> [flags]` | Disable a server. |

`mcp add` flags (the others have only `-h`, `--help`):

| Flag | Meaning |
|---|---|
| `-e` | Short alias for `--env`. |
| `--env <KEY=value>` | Environment variable for a stdio server; repeatable. An http server rejects it. |
| `-H` | Short alias for `--header`. |
| `--header <"Key: Value">` | HTTP header; repeatable. |
| `-t` | Short alias for `--type`. |
| `--type <stdio\|http>` | Server type (default `stdio`); http/https URLs are detected automatically. |
| `-h`, `--help` | Show help. |

### agy mic-serve

```
agy mic-serve [flags]
```

Serve this machine's microphone to a CLI on another host, for `/voice` over SSH. Not run.

| Flag | Meaning |
|---|---|
| `--addr <host:port>` | Address to listen on; keep it on loopback (default `127.0.0.1:4713`). |
| `-h`, `--help` | Show help. |

### agy models

```
agy models [flags]
```

List available models as `slug<TAB>label`. Flags: `-h`, `--help`; `--output-format` is rejected (see `agent`). It listed 13 slugs, such as `gemini-4-argon-low|medium|high`, `gemini-3.8-flash-*`, `claude-opus-5-5-*`, `claude-sonnet-5-5-*` and `gpt-oss-120b-medium` (L).

### agy plugin | agy plugins

```
agy plugin <command> [arguments]
```

Manage plugins. `plugins` is an alias (same help hash). Sub-commands as printed by `agy plugin --help` (L):

| Command | Usage | Meaning |
|---|---|---|
| `list` | `agy plugin list [--json]` | List installed plugins with version, source and component counts. It rejects `--help` (`only --json is supported`, exit 1). |
| `import` | `agy plugin import [source]` | Import plugins from `gemini` or `claude`. |
| `install` | `agy plugin install <target>` | Install a plugin from a directory or `plugin[@marketplace]`, such as `@antigravity-plugins-official`. |
| `uninstall` | `agy plugin uninstall <name>` | Uninstall a plugin. |
| `enable` | `agy plugin enable <name>` | Enable a plugin. |
| `disable` | `agy plugin disable <name>` | Disable a plugin. |
| `validate` | `agy plugin validate [path] [--strict] [--json]` | Check a manifest and its files the way the loader reads them; exits non-zero on errors, or on warnings with `--strict`. |
| `link` | `agy plugin link <mp> <target>` | Generate a link to a marketplace. |
| `help` | `agy plugin help` | Show the plugin help. |

| Flag | On | Meaning |
|---|---|---|
| `--json` | `list`, `validate` | Machine-readable output. |
| `--strict` | `validate` | Also fail on warnings. |
| `-h`, `--help` | `validate` | Show help. |

The `--help` of `import`, `install`, `uninstall`, `enable`, `disable` and `link` was **not run**: `list` treats `--help` as an argument, so these could act on a target named `--help`. Their usage lines come from `agy plugin --help` only.

### agy remote-control

```
agy remote-control <subcommand> [flags]
```

Manage the Remote Control background daemon (L: `remote-control --help`).

| Subcommand | Meaning | Evidence |
|---|---|---|
| `start` | Register and start the daemon with the OS service manager. | L: help line; `--help` not run, since it could start the daemon |
| `status` | Show the daemon's status and instance name. Flags: `-h`, `--help`. | L: `remote-control status --help`, `remote-control status` |
| `stop` | Stop the daemon and unregister it. | L: help line; `--help` not run |
| `serve` | Run Remote Control in the foreground (I). Not in help. | L: `agy changelog` 1.3.4 mentions "`agy remote-control serve` sessions"; not run |

`start` flags, which don't appear in any printed help:

| Flag | Meaning | Evidence |
|---|---|---|
| `--name <label>` | Machine label in the Remote Control instance list. | L: `agy changelog` 1.2.0, and the binary string "Set this machine's instance name shown in Remote Control"; D: remote-control |
| `--session` | Scope the service to the active login session. | L: `agy changelog` 1.2.0 only |

### agy update

```
agy update
```

Update the CLI. `agy update --help` prints only `Usage of update:` and exits 2, so it shows no flags (L). Not run.

### agy agentapi (hidden)

```
agy agentapi <command> [args]
```

Not in `agy --help` and undocumented; found through `~/.gemini/antigravity-cli/bin/agentapi.bat` (L: `agy agentapi --help`). None of its commands were run.

| Command | Usage | Meaning (I, from the names) |
|---|---|---|
| `get-conversation-metadata` | `agentapi get-conversation-metadata <conversation_id>` | Read a conversation's metadata. |
| `new-conversation` | `agentapi new-conversation [--model=<flash_lite\|flash\|pro\|model_id>] [--title=<title>] [--profile=<profile>] <prompt>` | Start a conversation with a prompt. |
| `send-message` | `agentapi send-message [--title=<title>] <recipient_id> <content>` | Send a message to a conversation or agent. |

| Flag | On | Meaning |
|---|---|---|
| `--model=<flash_lite\|flash\|pro\|model_id>` | `new-conversation` | Model tier or model ID; the same tiers as `invoke_subagent`'s `Model`. |
| `--title=<title>` | `new-conversation`, `send-message` | Conversation title. |
| `--profile=<profile>` | `new-conversation` | Profile to use. |

The `=` form is the only form the help shows.

### antigravity-ide (IDE launcher)

```
antigravity-ide [options] [paths...]
antigravity-ide chat [options] [prompt]
```

The stock VS Code CLI, renamed (L: `antigravity-ide --help`). Pass `-` to read from stdin.

| Flag | Meaning |
|---|---|
| `-d`, `--diff <file> <file>` | Compare two files. |
| `-m`, `--merge <path1> <path2> <base> <result>` | Three-way merge. |
| `-a`, `--add <folder>` | Add folders to the last active window. |
| `--remove <folder>` | Remove folders from the last active window. |
| `-g`, `--goto <file:line[:character]>` | Open a file at a position. |
| `-n`, `--new-window` | Force a new window. |
| `-r`, `--reuse-window` | Force an already opened window. |
| `-w`, `--wait` | Wait for the files to close before returning. |
| `--locale <locale>` | UI locale. |
| `--user-data-dir <dir>` | User data directory; allows separate instances. |
| `--profile <profileName>` | Open with a named profile, creating it if missing. |
| `-h`, `--help` | Print usage. |
| `--extensions-dir <dir>` | Root path for extensions. |
| `--list-extensions` | List installed extensions. |
| `--show-versions` | Show versions with `--list-extensions`. |
| `--category <category>` | Filter `--list-extensions` by category. |
| `--install-extension <ext-id \| path>` | Install or update an extension or VSIX. |
| `--pre-release` | Install the pre-release version. |
| `--uninstall-extension <ext-id>` | Uninstall an extension. |
| `--update-extensions` | Update installed extensions. |
| `--enable-proposed-api <ext-id>` | Enable proposed APIs for extensions. |
| `--add-mcp <json>` | Add an MCP server definition to the user profile. |
| `-v`, `--version` | Print the version. |
| `--verbose` | Verbose output; implies `--wait`. |
| `--log <level>` | Log level, global or per extension. |
| `-s`, `--status` | Print process usage and diagnostics. |
| `--prof-startup` | CPU profile during start-up. |
| `--disable-extensions` | Disable all extensions for the new window. |
| `--disable-extension <ext-id>` | Disable one extension for the new window. |
| `--sync <on \| off>` | Turn settings sync on or off. |
| `--inspect-extensions <port>` | Debug the extension host. |
| `--inspect-brk-extensions <port>` | Debug the extension host, paused at start. |
| `--disable-lcd-text` | Disable LCD font rendering. |
| `--disable-gpu` | Disable GPU acceleration. |
| `--disable-chromium-sandbox` | Disable the Chromium sandbox (elevated or applocker cases). |
| `--locate-shell-integration-path <shell>` | Print a shell-integration script path (`bash`, `pwsh`, `zsh`, `fish`). |
| `--telemetry` | Show the telemetry events collected. |
| `--transient` | Run with temporary data and extension directories. |

| Subcommand | Meaning | Local result |
|---|---|---|
| `chat` | Run a prompt in a chat session in the current directory. | `--help` works (L) |
| `serve-web` | Serve the editor UI to browsers. | `antigravity-tunnel.exe ENOENT` (L) |
| `tunnel` | Make the machine reachable through a secure tunnel. | `antigravity-tunnel.exe ENOENT` (L) |

`chat` flags:

| Flag | Meaning |
|---|---|
| `-m`, `--mode <mode>` | `ask`, `edit`, `agent` (default) or a custom mode ID. |
| `-a`, `--add-file <path>` | Add files as context. |
| `--maximize` | Maximize the chat view. |
| `-r`, `--reuse-window` | Use the last active window. |
| `-n`, `--new-window` | Open an empty window. |
| `--profile <profileName>` | Use a named profile. |

## In-session commands

The docs list 24 slash commands for the App and the CLI, `/generative_ui` being App-only, and say nothing about the IDE (D: https://antigravity.google/docs/slash-commands). Commands with **-p** also answer non-interactively in print mode, as tab-separated records or JSON, without starting a turn (L: `agy changelog`, about 1.1.11-1.1.12).

| Command | Meaning | CLI -p | TUI | App | Evidence |
|---|---|---|---|---|---|
| `/agents` | Switch between active sub-agents. | ? | ✓ | ✓ | D |
| `/boost` | Multi-agent deep reasoning for hard problems. | ? | ✓ | ✓ | D |
| `/browser` | Sandboxed Chrome sub-agent. | ? | ✓ | ✓ | D |
| `/btw` | Background side question. | ? | ✓ | ✓ | D; L: changelog |
| `/changelog` | Show the changelog. | ✓ | ✓ | ✓ | L: changelog; D |
| `/codesearch` (`/cs`, `/search`) | Regex code search panel. | ? | ✓ | ✓ | L: changelog; D |
| `/compact [message]` | Compact the conversation. | ? | ✓ | ? | L: changelog 1.3.5 |
| `/config` (`/settings`) | Settings panel. | ✓ | ✓ | ? | L: changelog |
| `/context` | Context usage. | ? | ✓ | ✓ | D; L: changelog |
| `/credits` | AI credits. | ✓ | ✓ | ✓ | L: changelog; D |
| `/diff` | Diff viewer (All Changes, Per Turn, Commit Tree). | ? | ✓ | ✓ | L: changelog; D |
| `/effort` | Reasoning-effort gauge. | ✓ | ✓ | ✓ | L: changelog; D |
| `/generative_ui` | Interactive widgets. | ✗ | ✗ | ✓ | D |
| `/goal` | Work until an objective is met. | ? | ✓ | ✓ | D |
| `/grill-me` | Interview to align on the task. | ? | ✓ | ✓ | D |
| `/help` | Help and shortcuts. | ✓ | ✓ | ? | L: changelog |
| `/hooks` | List active hooks. | ✓ | ✓ | ? | L: changelog |
| `/keybindings` | Edit keybindings in `$EDITOR`. | ? | ✓ | ? | L: changelog |
| `/learn` | Turn corrections into rules or skills. | ? | ✓ | ✓ | D |
| `/mcp` | MCP server status. | ? | ✓ | ? | L: changelog |
| `/model` | Model picker. | ✓ | ✓ | ? | L: changelog |
| `/permissions` | Allow, ask and deny rules. | ✓ | ✓ | ✓ | L: changelog; D |
| `/plan` | Plan before coding. | ? | ✓ | ✓ | D |
| `/plugin` (`/plugins`) | Plugin manager. | ? | ✓ | ~ natural language | D; L: changelog |
| `/quota`, `/usage` | Quota and credit use. | ✓ | ✓ | ✓ | L: changelog; D |
| `/remote-control [on\|off]` | Session Remote Control tunnel. | ✗ | ✓ | ✗ (a Settings toggle instead) | L: changelog; D |
| `/resume` | Conversation picker. | ? | ✓ | ✓ | D |
| `/rewind` | Rewind to an earlier message. | ? | ✓ | ? | L: changelog |
| `/schedule` | Run once or on a cron schedule. | ? | ✓ | ✓ | D |
| `/skills` | List skills. | ✓ | ✓ | ? | L: changelog |
| `/statusline` | Configure the status line. | ? | ✓ | ✓ | D |
| `/tasks` | Background tasks and timers. | ? | ✓ | ? | L: changelog |
| `/teamwork` | Multi-agent team campaigns. | ? | ✓ | ✓ | D |
| `/title [on\|off]` | Terminal title. | ? | ✓ | ✓ | D; L: changelog |
| `/voice` | Dictation (`F5`). | ✗ | ✓ | ✓ | D; L: changelog |
| `/add-dir` | Add a workspace directory. | ? | ✓ | ? | L: changelog |
| `/<plugin>:<skill>` | Expand a skill; `-p` expands it unless `--disable-slash-commands`. | ✓ | ✓ | ? | L: changelog 1.1.9; [harnesses.md](../harnesses.md) |

TUI keys: `Shift+Tab` cycles modes; `Ctrl+K` or `a` in a sub-agent view opens its question picker; `Ctrl+G` opens the external editor; `alt+m` sends against the Queued Messages setting; `Ctrl+R` opens artifact review; `Ctrl+C` interrupts; `Ctrl+D` exits (L: `agy changelog`; D: getting-started?tab=cli).

## Settings and environment

Config files (L: listing of `~/.gemini`, names only; D: https://antigravity.google/docs/settings?tab=cli):

| Path | Holds |
|---|---|
| `~/.gemini/antigravity-cli/settings.json` | CLI settings. On this machine it is **not strict JSON**: `trustedWorkspaces` paths contain unescaped Windows backslashes. Read it with a lenient parser; never rewrite it. A `settings.json.bak-<timestamp>` sits beside it (L). |
| `~/.gemini/antigravity-cli/keybindings.json` | TUI keybindings (D). |
| `~/.gemini/config/config.json` | Shared `userSettings`, also read by the app: `autoExecutionPolicy`, `enableTerminalSandbox`, `globalPermissionGrants.allow`, `nonWorkspaceFileAccessPolicy`, `permissionPreset` (here `AGENT_PERMISSION_PRESET_TURBO`), `remoteControlHostname` (L). The docs name `cliRemoteControlHostname` for the CLI daemon and say `remoteControlHostname` belongs to the editor (D: remote-control). |
| `~/.gemini/config/hooks.json`, `<workspace>/.agents/hooks.json` | Hooks. A `hooks` key in `settings.json` is never loaded (D). |
| `~/.gemini/config/mcp_config.json`, `<workspace>/.agents/mcp_config.json` | MCP servers (D; L: the user file exists, empty). |
| `~/.gemini/config/plugins/<plugin>/`, `<workspace>/.agents/plugins/<plugin>/` | Plugins (D; L: `grey-matter`, `tkt`). |
| `~/.gemini/antigravity-cli/worktrees/<parent conversation>/subagent-…` | Sub-agent `branch` worktrees; not auto-removed after `-p` (L: spike P2, P12). |
| `~/.gemini/antigravity-cli/log/cli-<timestamp>.log` | One log per CLI start, including `models`/`agents` listings (L). |
| `~/.gemini/antigravity/` | Desktop app agent data (L). |
| `~/.gemini/antigravity-ide/`, `%APPDATA%\Antigravity IDE\User\settings.json` | IDE agent data and editor settings (L). |
| `~/.gemini/settings.json` | Old Gemini CLI settings (`security.auth.selectedType`, `ui.theme`), not read by agy (I: its keys match Gemini CLI, not the documented agy keys). |

`settings.json` keys an orchestrating agent is most likely to need (D: settings?tab=cli, unless marked):

| Key | Values | Note |
|---|---|---|
| `agentMode` | `""`/unset (`default`), `accept-edits`, `auto`, `plan` | Here `accept-edits` (L). `--mode` overrides it per run. |
| `toolPermission` | `request-review` (default), `proceed-in-sandbox`, `strict`, `always-proceed` | `strict` and `always-proceed` override `auto` (D: permissions). |
| `artifactReviewPolicy` | `asks-for-review` (default), `agent-decides`, `always-proceed` | Plans wait for review even under `--dangerously-skip-permissions` (L: changelog 1.3.2). |
| `permissions.allow`, `.ask`, `.deny` | arrays of `action(target)` rules | Deny > Ask > Allow; unparsable rules are ignored. |
| `enableTerminalSandbox`, `allowNonWorkspaceAccess` | booleans | |
| `disableSlashCommands` | boolean | Headless only; same as the flag. |
| `model`, `modelProvider` | strings | `modelProvider: "gemini"` with `GEMINI_API_KEY`. |
| `trustedWorkspaces` | string array | |
| `notifications`, `queuedMessages`, `verbosity` | | `queuedMessages`: `queue` or `send-immediately`. |

**Permission rules: docs vs observation.**
- Docs: rules are `action(target)`, such as `command(git status)`, `read_url(github.com)` and `write_file(.env)`. Command targets may be `command(prefix)`, `command(regex:pattern)` or `command(*)`, and `*` "matches all targets within that entire action namespace" (D: https://antigravity.google/docs/permissions, settings?tab=cli). The headless page says a tool that needs an approval it can't get doesn't block the run: the run continues, exits 0, and names the tool on stderr (D: cli/headless). The changelog says headless runs soft-deny such tools and print the allow-rule needed (L: changelog 1.1.3). It also says a rule with zero command words, such as `command(time)`, matches nothing (L: changelog 1.1.11).
- Observed, headless, 2026-10-31, agy 1.4.12, session rules via `--settings`: `command(git)`, `command(git *)`, `command(git:*)` and an exact `command(git rev-parse --show-toplevel)` were all **denied**; only `command(*)` let the command run. The denied sub-agent was then cancelled ("explicitly canceled by the user") rather than reporting BLOCKED (L: [spike P3](../research/harness-orchestration-primitives.md#spike-results-agy-2026-10-31)).
- Trust the observation. Headless on Windows, plan on `command(*)` in a disposable checkout only, `--dangerously-skip-permissions`, or an interactive session. `command(regex:…)` was not tried.

Environment variables (L: `agy changelog`, unless marked):

| Variable | Effect |
|---|---|
| `GEMINI_API_KEY` | Use the Gemini API directly, with `modelProvider: "gemini"` (also D: cli/reference). |
| `GOOGLE_GEMINI_BASE_URL` | Custom Gemini API endpoint. |
| `AGY_ADC_AUTH` | Sign in with Application Default Credentials; Remote Control is unsupported under ADC (changelog 1.3.3). |
| `AGY_CLI_OSC7501` | `off` or `on`: terminal status reporting. `AGY_CLI_OSC7501_MESSAGES=brief` hides the details. |
| `AGY_CLI_HIDE_LOGO` | Suppress the banner art. |
| `AGY_CLI_DISABLE_ESCAPE_SEQUENCE_OPTIMIZATIONS` | Bypass renderer diffing. |
| `CLI_GRAPHICS=kitty` | Force inline image mode. |
| `NO_COLOR`, `CLICOLOR`, `CLICOLOR_FORCE` | Colour in `plugin` output. |
| `EDITOR` | `editor` setting and `Ctrl+G` (D: cli/reference). |
| Set by agy for agent commands | `GIT_EDITOR`, `HGEDITOR`, `JJ_EDITOR` set to `false`; `PAGER`, `GIT_PAGER`, `JJ_PAGER` set to `cat`. |

## Couldn't verify

- Help for `plugin import|install|uninstall|enable|disable|link` and `remote-control start|stop|serve` was not run, because each might act on a target named `--help`. Their flags beyond the usage lines are unknown, apart from `start --name` and `--session` from the changelog.
- `agentapi`: what each command does, whether it's stable, and how it authenticates. None of its commands were run.
- The stream-json event schema was read from the docs; this pass didn't capture a stream (the spike did, without recording the schema). `finished_reason` and exit code 3 come from the changelog only.
- `command(regex:…)` rules; whether any narrow `command(...)` rule works in an interactive session; whether docs-style `command(git status)` works on Linux or macOS.
- The background-task wait cap for `-p`: the changelog says 30 minutes, the spike saw 40 minutes.
- Whether `--remote-control` works on a `-p` run.
- Antigravity IDE agent features (modes, MCP, rules, sub-agents, worktrees): https://antigravity.google/docs/ide returned 403, and no IDE agent session was run. Whether the IDE's `antigravity` extension shares conversations with the CLI and the app.
- Desktop app: no CLI, so no help hash. Its feature set comes from the docs. The meaning of `44.5.1` in its `version` file is inferred.
- `%APPDATA%\Antigravity\` holds VS Code-style folders (`User/`, `CachedExtensionVSIXs/`) last written 2026-05-22, alongside an `app_storage.json` updated today. It may be left over from an earlier VS Code-based "Antigravity" before the IDE was renamed (I).
- Docs pages https://antigravity.google/docs/modes (404) and https://antigravity.google/docs/cli (redirects to getting-started?tab=cli); the CLI modes page at /docs/cli/modes/ was used instead.

# Claude Code surfaces

Claude Code's surfaces are the `claude` CLI (`-p`), the TUI, the Claude desktop app (Windows), the VS Code and JetBrains extensions, and the Agent SDK. Grammar, marks and template: [README](./README.md). Deployment and skill testing: [harnesses.md](../harnesses.md#claude-code-ancillary).

## Versions

Gathered 2026-11-01 on Windows 11 Pro (10.0.26300), from Git Bash.

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI | `C:\Users\uosmi\.local\bin\claude.exe` | 2.1.316 (Claude Code) | `claude.exe --version` (L) | `5ca3a9dac202` (`claude.exe --help \| tr -d '\r' \| sha256sum \| cut -c1-12`) (L) |
| (wrapper) | `C:\Users\uosmi\.local\bin\claude` | n/a | `claude --version` fails in Git Bash: `/usr/bin/env: 'zsh': No such file or directory`. The file is a zsh script that execs an nvm copy (L) | `e3b0c44298fc` (empty output) (L) |
| GUI: desktop app | MSIX package `Claude` (`Claude_pzs8sxrjxfjjc`) | 4.4212.0.0 | `Get-AppxPackage *Claude*` (L) | n/a |
| GUI: JetBrains | `claude-code-jetbrains-plugin` | 0.1.14-beta | jar name in `%APPDATA%\JetBrains\{PyCharm2026.2,PyCharm2026.3,Rider2026.2}\plugins\claude-code-jetbrains-plugin\lib` (L) | n/a |
| GUI: VS Code | `anthropic.claude-code` | not installed | `~/.vscode/extensions` (a link to `D:\dev-tools\vscode-extensions`) holds only `saoudrizwan.claude-dev-3.45.0`, which is Cline and not Anthropic's extension (L) | n/a |
| API: Agent SDK | `@anthropic-ai/claude-agent-sdk`, `claude-agent-sdk` (Python) | not installed | `npm ls -g`, `pip show` found neither (L) | n/a |

In this repo, call `claude.exe` (or `claude` from PowerShell/cmd, where `.exe` resolves) and not the bare `claude` from Git Bash (L).

## Surfaces

- **CLI**: `claude -p "<prompt>"` runs a single non-interactive turn loop and exits. It skips the workspace trust dialog and silently ignores settings files that fail validation (L, `--help`). `--output-format json|stream-json` makes it scriptable, and `--permission-prompts none` makes it headless (L). It uses the same config as the TUI.
- **TUI**: `claude [prompt]` with no `-p` opens the interactive session (L, `--help`). The renderer is `tui` setting / `/tui` (`default` or `fullscreen`) (D, [commands](https://code.claude.com/docs/en/commands)). The same binary also provides background sessions (`--bg`, `claude agents`, `attach`) and Remote Control (`--remote-control`, hidden `remote-control` server) (L).
- **GUI, Claude desktop app**: this is the Code tab of the Claude app. A session runs Local, Cloud, SSH or (on Windows) WSL, and has a folder, permission mode and model picker. Worktree toggle, side-by-side sessions, Browser preview pane (`.claude/launch.json`) and connectors are built in (D, [desktop](https://code.claude.com/docs/en/desktop)). It reads the same settings files as the CLI and ignores PowerShell profiles (D). You can launch it from the CLI with `claude --desktop` or `/desktop` (L, D). Windows builds: x64 and a separate ARM64 installer (D). This report was written from a desktop-app session: the `mcp__ccd_*` tools were available (I).
- **GUI, VS Code extension** (`anthropic.claude-code`, VS Code 1.94.0+): a graphical chat panel that bundles its own CLI and doesn't put `claude` on PATH. It shares `~/.claude/settings.json`, history, MCP and plugins with the CLI. `claudeCode.useTerminal` switches it to the TUI (D, [vs-code](https://code.claude.com/docs/en/vs-code)). The extension exposes a subset of commands. `!` bash mode and Tab completion are missing (D).
- **GUI, JetBrains plugin** (IntelliJ, PyCharm, Android Studio, WebStorm, PhpStorm, GoLand): runs the installed `claude` TUI in the IDE terminal and doesn't bundle a CLI. It adds IDE diffs, selection context and `mcp__ide__getDiagnostics` through a hidden `ide` MCP server, which writes a lock file at `~/.claude/ide/<port>.lock`. Settings live under **Settings → Tools → Claude Code [Beta]** (D, [jetbrains](https://code.claude.com/docs/en/jetbrains)). `/ide` connects an external terminal (D). `~/.claude/ide/` exists locally (L).
- **API, Agent SDK**: a library that runs the bundled Claude Code binary. TypeScript `@anthropic-ai/claude-agent-sdk` (`query`), Python `claude-agent-sdk` (`query`, `ClaudeAgentOptions`). Options include `allowedTools`, `permissionMode`, `systemPrompt`, `mcpServers` and `pathToClaudeCodeExecutable` (D, [quickstart](https://code.claude.com/docs/en/agent-sdk/quickstart)). By default it loads skills, commands and memory from `.claude/` and `~/.claude/` (D, [overview](https://code.claude.com/docs/en/agent-sdk/overview)). Other API-shaped surfaces of the binary are `claude mcp serve` (stdio MCP server), `-p --input-format stream-json` (L), and `gateway` / `self-hosted-runner` for enterprise and cloud hosting (L).

## Feature-to-surface matrix

GUI = desktop app / VS Code / JetBrains. Each entry is a mark; the notes say how.

| Feature | CLI | TUI | GUI | API | Evidence and notes |
|---|---|---|---|---|---|
| One-shot prompt | ✓ | ✗ | ✗ | ✓ | `-p, --print` (L). SDK `query()` (D) |
| Structured output | ✓ | ✗ | ✗ | ✓ | `--output-format text\|json\|stream-json`, `--json-schema <schema>` (L). SDK structured outputs (D) |
| Model selection | ✓ | ✓ | ✓ | ✓ | `--model`, `--fallback-model`, `--effort` (L). `/model`, `/effort` (D). Desktop/VS Code pickers (D) |
| Approvals, permission modes | ✓ | ✓ | ~ | ✓ | `--permission-mode acceptEdits\|auto\|bypassPermissions\|manual\|dontAsk\|plan`, `--permission-prompts host\|none`, `--allowedTools`, `--disallowedTools` (L). Desktop has no `dontAsk` ("available only in the CLI"), no Shift+Tab cycling, and no bypass in cloud sessions (D). VS Code exposes Auto/Manual/Plan/Edit automatically, with bypass behind `claudeCode.allowDangerouslySkipPermissions` (D) |
| Sandboxing | ✓ | ✓ | ? | ? | `sandbox.*` settings for Bash on macOS, Linux and WSL2 (D, [settings-reference](https://code.claude.com/docs/en/settings-reference)). `/sandbox` "Available on supported platforms only" (D). `--restricted` removes the code-running tools (L). Native Windows support isn't stated (?) |
| Sub-agents | ✓ | ✓ | ✓ | ✓ | `--agent`, `--agents <json-or-file>`, `--forward-subagent-text` (L). `/subtask`, `/agents` (D). SDK subagents (D) |
| Worktrees | ✓ | ✓ | ✓ | ? | `-w, --worktree [name]`, `--tmux` (L). Desktop Worktree toggle, `.claude/worktrees/` (D). VS Code worktree banner (D) |
| Background or parallel sessions | ✓ | ✓ | ✓ | ? | `--bg`, `agents`, `attach`, `logs`, `stop`, `rm`, `respawn`, hidden `daemon` (L). `/background`, `/fork`, `/tasks` (D). Desktop side-by-side sessions, VS Code tabs (D) |
| Session resume | ✓ | ✓ | ✓ | ✓ | `-c`, `-r [value]`, `--fork-session`, `--session-id`, `--from-pr`, `-n` (L). VS Code conversations resume with `claude --resume` (D). SDK sessions (D) |
| Hooks | ✓ | ✓ | ✓ | ✓ | `hooks` settings key, `/hooks` (D). `--bare` skips them, `--include-hook-events` streams them (L). The user settings define `hooks` (L, key names only) |
| MCP | ✓ | ✓ | ✓ | ✓ | `mcp` subcommands, `--mcp-config`, `--strict-mcp-config` (L). `/mcp` (D). Desktop connectors (D) |
| Skills and plugins | ✓ | ✓ | ~ | ✓ | `plugin` subcommands, `--plugin-dir`, `--plugin-url`, `--disable-slash-commands` (L). Desktop: no plugin browser in cloud, no plugins in WSL (D). VS Code: subset (D) |
| Notifications | ✗ | ✓ | ? | ✗ | `preferredNotifChannel`, `inputNeededNotifEnabled`, `agentPushNotifEnabled` (D). The first and last are set in user settings (L, key names) |
| Remote or cloud runs | ✓ | ✓ | ✓ | ? | `--cloud`, `--environment`, `--teleport`, `--remote-control`, `ultrareview` (L). `remote-control` server (L, hidden). Desktop Cloud/SSH environments (D) |
| IDE integration | ✗ | ✓ | ✓ | ✗ | `--ide` (L). `/ide` and the `ide` MCP server (D) |
| Browser automation | ✓ | ✓ | ✓ | ? | `--chrome`, `--no-chrome` (L). Desktop Browser pane, VS Code `@browser` (D) |

## CLI reference

All entries are L from `claude.exe <subcommand...> --help` (2.1.316) unless marked otherwise. Every subcommand also takes `-h, --help` ("Display help for command"). Commander groups print a `help [command]` subcommand (auth, auto-mode, mcp, plugin, plugin marketplace), which is not counted below.

### `claude [options] [command] [prompt]`

`prompt` is the initial prompt (L).

| Flag | Meaning |
|---|---|
| `--add-dir <directories...>` | Additional directories to allow tool access to |
| `--agent <agent>` | Agent for this session; overrides the `agent` setting |
| `--agents <json-or-file>` | JSON object of custom agents, or with `--print` a path to a file holding one |
| `--allow-dangerously-skip-permissions` | Make bypass available as an option without starting in it |
| `--allowedTools, --allowed-tools <tools...>` | Comma- or space-separated tools to allow, e.g. `"Bash(git *) Edit"` |
| `--append-system-prompt <prompt>` | Append to the default system prompt |
| `--autocompact <auto\|tokens>` | Auto-compact window size (auto, or 100k–1M tokens) |
| `--ax-screen-reader` | Screen-reader-friendly flat output |
| `--bg, --background` | Start in the background and print the id for `attach`/`logs`/`stop`/`rm`. With `--resume <session-id>`, continue that session in the background |
| `--bare` | Minimal mode: skip hooks, LSP, plugin sync, auto-memory, keychain, CLAUDE.md discovery. Sets `CLAUDE_CODE_SIMPLE=1`. Auth only via `ANTHROPIC_API_KEY`/`apiKeyHelper` |
| `--betas <betas...>` | Beta headers for API requests (API key users only) |
| `--brief` | Enable the SendUserMessage tool |
| `--chrome` | Enable Claude in Chrome |
| `--cloud [description\|session_id\|url]` | Create a cloud session, or attach to one by id/URL |
| `-c, --continue` | Continue the most recent conversation in this directory |
| `--dangerously-skip-permissions` | Bypass all permission checks |
| `-d, --debug [filter]` | Debug mode with optional category filter (`--debug=hooks,mcp`, `'!hooks'`) |
| `--debug-file <path>` | Write debug logs to a file (implies debug) |
| `--desktop` | Open in the Claude Desktop app instead of the terminal. With `--continue`/`--resume <id>`, pick the session |
| `--disable-slash-commands` | Disable all skills and commands |
| `--disallowedTools, --disallowed-tools <tools...>` | Comma- or space-separated tools to deny |
| `--effort <level>` | Effort: low, medium, high, xhigh, max |
| `--environment <environment_id>` | New cloud session on a self-hosted environment (`ccpool_...`) |
| `--exclude-dynamic-system-prompt-sections` | Move per-machine prompt sections into the first user message, for cache reuse (default: false) |
| `--fallback-model <model>` | Comma-separated fallback chain when the model is overloaded or unavailable |
| `--file <specs...>` | Download file resources at startup: `file_id:relative_path` |
| `--fork-session` | On resume, create a new session id (with `--resume`/`--continue`) |
| `--forward-subagent-text` | Forward subagent text/thinking with `parent_tool_use_id` (`--print` + `stream-json` only) |
| `--from-pr [value]` | Resume a session linked to a PR number/URL, or open the picker |
| `-h, --help` | Display help |
| `--ide` | Auto-connect to the IDE if exactly one is available |
| `--include-hook-events` | Include hook lifecycle events in the stream (`stream-json` only) |
| `--include-partial-messages` | Include partial message chunks (`--print` + `stream-json` only) |
| `--input-format <format>` | `--print` input: `text` (default) or `stream-json` |
| `--json-schema <schema>` | JSON Schema for structured output validation (`--print` only) |
| `--max-budget-usd <amount>` | Spending cap in dollars (`--print` only) |
| `--mcp-config <configs...>` | Load MCP servers from JSON files or strings |
| `--model <model>` | Model alias (`fable`, `opus`, `sonnet`) or full name |
| `-n, --name <name>` | Display name for the session |
| `--no-chrome` | Disable Claude in Chrome |
| `--no-session-persistence` | Don't save the session to disk (`--print` only) |
| `--output-format <format>` | `--print` output: `text` (default), `json`, `stream-json` |
| `--permission-mode <mode>` | `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk`, `plan` |
| `--permission-prompts <target>` | Who answers prompts with `--print`: `host` (default; SDK host or `--permission-prompt-tool`) or `none` (auto-deny) |
| `--plugin-dir <path>` | Load a plugin dir or `.zip`, or a folder of plugins, for this session (repeatable) |
| `--plugin-url <url>` | Fetch a plugin `.zip` from a URL for this session (repeatable) |
| `-p, --print` | Print the response and exit. Skips the trust dialog and silently ignores invalid settings files |
| `--prompt-suggestions [value]` | Enable prompt suggestions; in print/SDK mode, emit `prompt_suggestion` messages |
| `--remote-control [name]` | Interactive session with Remote Control enabled |
| `--remote-control-session-name-prefix <prefix>` | Prefix for auto-generated Remote Control names (default: hostname) |
| `--replay-user-messages` | Re-emit stdin user messages on stdout (`stream-json` in and out) |
| `--restricted` | Remove code-running tools and WebFetch unless `--tools` names them. Ignore user/project/local settings, confine file tools, refuse bypass |
| `-r, --resume [value]` | Resume by session id or name, or open the picker |
| `--safe-mode` | Disable all customizations (CLAUDE.md, skills, plugins, hooks, MCP, …). Sets `CLAUDE_CODE_SAFE_MODE=1` |
| `--session-id <uuid>` | Use a specific session UUID |
| `--setting-sources <sources>` | Comma-separated sources to load: user, project, local |
| `--settings <file-or-json>` | Extra settings from a file or JSON string |
| `--strict-mcp-config` | Use only `--mcp-config` servers |
| `--system-prompt <prompt>` | Replace the system prompt |
| `--system-prompt-snapshot <on\|off>` | Record the system prompt once per conversation (`on`) or render it fresh each request (`off`) |
| `--teleport [session]` | Resume a teleport (cloud) session |
| `--tmux` | Create a tmux session for the worktree (requires `--worktree`). `--tmux=classic` gives traditional tmux |
| `--tools <tools...>` | Built-in tool set: `""` none, `"default"`, or names (`"Bash,Edit,Read"`) |
| `--verbose` | Override the verbose setting |
| `-v, --version` | Print the version |
| `-w, --worktree [name]` | Create a git worktree for this session |

**Hidden top-level flags** (absent from `--help`). The docs list them: "`claude --help` does not list every flag" (D, [cli-reference](https://code.claude.com/docs/en/cli-reference)). For each, the flag string with its argument form is present in `claude.exe` (L, `grep -a` over the binary). That proves the flag is present in the binary but none was run.

| Flag | Meaning (D) |
|---|---|
| `--advisor <model>` | Enable the server-side advisor tool with a model |
| `--append-subagent-system-prompt <prompt>` | Append text to every subagent's system prompt (`-p` only) |
| `--append-subagent-system-prompt-file <file>` | Same, from a file (`-p` only) |
| `--append-system-prompt-file <file>` | Append a file to the default system prompt |
| `--channels <servers...>` | (Research preview) MCP channel notifications to listen for: `plugin:<name>@<marketplace>` |
| `--dangerously-load-development-channels <servers...>` | Enable non-allowlisted channels; ignored with `-p` |
| `--exec` | Run a shell command as a PTY-backed background job (with `--bg`) |
| `--init` | Run Setup hooks with the `init` matcher (print mode) |
| `--init-only` | Run Setup and SessionStart hooks, then exit |
| `--maintenance` | Run Setup hooks with the `maintenance` matcher (print mode) |
| `--max-turns <turns>` | Limit agentic turns (print mode) |
| `--permission-prompt-tool <tool>` | MCP tool (`mcp__<server>__<tool>`) that answers permission prompts non-interactively |
| `--ref <ref>` | With `--environment`, base the checkout on a named ref |
| `--remote` | Deprecated alias for `--cloud` |
| `--rc` | Alias for `--remote-control` |
| `--system-prompt-file <file>` | Replace the system prompt with a file |
| `--teammate-mode <mode>` | Agent-team display: `in-process`, `auto`, `tmux`, `iterm2` |
| `--enable-auto-mode` | Removed in v2.1.111 (D). The string is still in the binary (L) |

### Background sessions

| Invocation | Meaning |
|---|---|
| `claude agents [options]` | Manage background agents (agent view; `--json` works without a TTY) |
| `claude attach <id\|name>` | Open a background session in this terminal. `←` returns to agent view, Ctrl+Z to the shell. A partial name works |
| `claude logs <id\|name>` | Print a background session's recent terminal output |
| `claude stop\|kill <id>` | Stop a background session and keep its conversation |
| `claude rm <id> [--discard-unpushed <commit>@<worktree-id>] [--force-remove-worktree <worktree-id>]` | Delete a background session and its worktree; works on exited sessions |
| `claude respawn <id>\|--all` | Restart a session (or all) on the current binary. Top-level help prints `respawn [options] [id]` |

`claude agents` flags:

| Flag | Meaning |
|---|---|
| `--add-dir <directory>` | Extra directory for dispatched sessions (repeatable) |
| `--agent <agent>` | Default agent for dispatched sessions |
| `--all` | With `--json`: include completed background sessions |
| `--allow-dangerously-skip-permissions` | Make bypass available to dispatched sessions |
| `--cwd <path>` | Show only sessions started under `<path>` |
| `--dangerously-skip-permissions` | Alias for `--permission-mode bypassPermissions` |
| `--effort <level>` | Default effort for dispatched sessions |
| `--json` | Print active sessions as a JSON array and exit |
| `--mcp-config <config>` | MCP config for dispatched sessions (repeatable) |
| `--model <model>` | Default model for dispatched sessions |
| `--permission-mode <mode>` | Default permission mode for dispatched sessions |
| `--plugin-dir <path>` | Plugins for agent view and dispatched sessions (repeatable) |
| `--restricted` | Start dispatched sessions in restricted mode |
| `--setting-sources <sources>` | Setting sources: user, project, local |
| `--settings <file-or-json>` | Settings for agent view and dispatched sessions |
| `--strict-mcp-config` | Only `--mcp-config` servers in dispatched sessions |

`claude rm` flags: `--discard-unpushed <commit>@<worktree-id>` also discards the worktree's unpushed commits and uncommitted changes. `--force-remove-worktree <worktree-id>` deletes a worktree directory that git or the hook couldn't remove. Pass the value an earlier `claude rm` reported (L).

**Hidden: `claude daemon [subcommand] [options]`**. It is absent from top-level help; `claude daemon --help` works (L). It manages the background-session supervisor. The help says "Service install is disabled in this version — the daemon runs on demand" (L).

| Subcommand or flag | Meaning |
|---|---|
| `run [json-path]` | Run the supervisor in the foreground |
| `status` | Show daemon pid, version, uptime |
| `logs` | Tail the daemon log |
| `uninstall` | Remove the background service (launchctl/systemd) |
| `stop [--any] [--keep-workers]` | Shut down the supervisor. `--any` also stops a transient daemon; `--keep-workers` leaves detached sessions running |
| `--json-path <p>` | Config file (default `~/.claude/daemon.json`) |
| `--log-file <p>` | Log file (default `~/.claude/daemon.log`) |
| `--help, -h` | Show help |

### `claude auth`

| Invocation | Flags |
|---|---|
| `auth login [options]`: sign in | `--claudeai` Claude subscription (default); `--console` Anthropic Console (API billing); `--email <email>` pre-fill the email; `--sso` force SSO |
| `auth logout` | none |
| `auth status [options]` | `--json` JSON output (default); `--text` human-readable output |
| `setup-token` (top-level): long-lived token, needs a subscription | none |

### `claude auto-mode`

| Invocation | Flags |
|---|---|
| `auto-mode config`: print the effective auto mode config as JSON | none |
| `auto-mode critique [options]`: AI feedback on custom rules | `--model <model>` |
| `auto-mode defaults [options]`: print the default environment/allow/soft_deny/hard_deny rules | `--label <prefix>` filter by label prefix (case-insensitive) |
| `auto-mode reset [options]`: remove `autoMode` from user settings | `-y, --yes` skip confirmation |

### `claude mcp`

| Invocation | Flags |
|---|---|
| `mcp add [options] <name> <commandOrUrl> [args...]` | `--callback-port <port>` fixed OAuth callback port; `--client-id <clientId>` OAuth client id; `--client-secret` prompt for the secret (or `MCP_CLIENT_SECRET`); `-e, --env <env...>` env vars; `-H, --header <header...>` HTTP/SSE headers; `-s, --scope <scope>` local\|user\|project (default local); `-t, --transport <transport>` stdio\|sse\|http (default stdio) |
| `mcp add-from-claude-desktop [options]`: import from Claude Desktop ("Mac and WSL only") | `-s, --scope <scope>` |
| `mcp add-json [options] <name> <json>` | `--client-secret`; `-s, --scope <scope>` |
| `mcp get <name>` | none. Unapproved `.mcp.json` servers show as pending; approved ones are health-checked |
| `mcp list` | none. Same approval and health-check behaviour |
| `mcp login [options] <name>`: OAuth for HTTP, SSE or a claude.ai connector | `--no-browser` print the URL instead of opening a browser |
| `mcp logout <name>` | none |
| `mcp remove [options] <name>` | `-s, --scope <scope>` (default: whichever scope it is in) |
| `mcp reset-project-choices` | none |
| `mcp serve [options]`: run Claude Code as an MCP server | `-d, --debug`; `--verbose` |

### `claude plugin|plugins`

| Invocation | Flags |
|---|---|
| `plugin configure [options] <plugin>`: show or set options | `--json`; `--values-stdin` read values as JSON from stdin |
| `plugin details [options] <name>`: component inventory and token cost | none |
| `plugin disable [options] [plugin]` | `-a, --all`; `--json`; `-s, --scope <scope>` user\|project\|local |
| `plugin enable [options] <plugin>` | `--json`; `-s, --scope <scope>` |
| `plugin eval [options] [command] [target]`: run eval cases against a plugin | see below |
| `plugin eval init [options] [name]`: author an eval suite | `--bare` blank template; `--eval-dir <dir>`; `-i, --interactive` |
| `plugin init\|new [options] <name>`: scaffold at `~/.claude/skills/<name>/` | `--author <name>`; `--author-email <email>`; `--description <text>`; `-f, --force`; `--with <components...>` skills, agents, hooks, mcp, lsp, output-style, channel |
| `plugin install\|i [options] <plugin>` | `--accept-command <sha256>` accept a reported marketplace command; `--config <key=value>` set a userConfig option (repeatable); `--json`; `--marketplace <source>`; `--registry <url>` npm registry; `-s, --scope <scope>` (default user); `-y, --yes` accept the shown command (required without a TTY) |
| `plugin list [options]` | `--available` include marketplace plugins (needs `--json`); `--data-size [plugin]` (needs `--json`); `--json` |
| `plugin prune\|autoremove [options]`: remove unneeded auto-installed deps | `--dry-run`; `-s, --scope <scope>` (default user); `-y, --yes` |
| `plugin tag [options] [path]`: create a `{name}--v{version}` git tag | `--dry-run`; `-f, --force`; `-m, --message <msg>`; `--push`; `--remote <name>` (default origin) |
| `plugin test [dir]`: run a mod's `*.test.ts(x)` | none |
| `plugin uninstall\|remove [options] <plugin>` | `--json`; `--keep-data`; `--prune`; `-s, --scope <scope>` (default user); `-y, --yes` |
| `plugin update [options] <plugin>`: restart required to apply | `--accept-command <sha256>`; `--json`; `-s, --scope <scope>` user\|project\|local\|managed; `-y, --yes` |
| `plugin validate [options] <path>` | `--json`; `--profile <name>` (`directory`) apply catalog submission checks; `--strict` treat warnings as errors |
| `plugin marketplace add [options] <source>` | `--claudeai` add a claude.ai-hosted marketplace; `--json`; `--scope <scope>`; `--sparse <paths...>` sparse checkout |
| `plugin marketplace list [options]` | `--json` |
| `plugin marketplace remove\|rm [options] <name>` | `--json`; `--scope <scope>` (default: every scope) |
| `plugin marketplace update [options] [name]`: all if no name | `--json` |

`plugin eval` flags:

| Flag | Meaning |
|---|---|
| `--ablation <mode>` | `none` \| `with-without` no-plugin baseline arm and score delta |
| `--allow-real-servers` | With `--mocks record`, also start real MCP servers that have no mock |
| `--allow-tools <tools...>` | Grant gated tools (Bash, Write, Edit, WebFetch, `mcp__*`) |
| `--case <glob>` | Filter cases by name |
| `-j, --concurrency <n>` | Parallel agent runs (1-8, default 1) |
| `--disallow-tools <tools...>` | Built-in tools to withhold in every case |
| `--eval-dir <dir>` | Eval directory below the plugin (default `evals/`) |
| `--json [path]` | Full run result as JSON to stdout or a file |
| `--judge-model <model>` | LLM-grader model (default haiku) |
| `--keep-temp` | Keep scaffold dirs |
| `--max-cost-usd <usd>` | Hard cost ceiling (exit 2) |
| `--mocks <mode>` | `record` \| `off` MCP mocks |
| `--model <model>` | Model for all cases |
| `--no-publish` | Keep the HTML report local |
| `--no-scaffold` | Skip `scaffold_script` |
| `--output-dir <dir>` | Directory for `aggregate-result.json` |
| `--publish-report` | Require publishing the report to claude.ai |
| `--report <path>` | Write the HTML report to a path |
| `--runs <n>` | Runs per case (default `case.runs ?? 3`) |
| `--scaffold` | Run each case's `scaffold_script` |
| `--tag <tag...>` | Filter cases by tag |
| `--threshold <0..1>` | Exit 1 if any case scores below it (default 1.0) |
| `--trust-plugin` | Skip the first-run trust prompt (CI) |
| `--verbose` | Log per-message trace events to the debug log |

### Remote, review, and hosting

| Invocation | Flags |
|---|---|
| `claude ultrareview [target] [options]`: cloud multi-agent review of the branch, a PR or a base | `--json` raw `bugs.json`; `--no-post` (default); `--post` post findings to the PR; `--timeout <minutes>` (default 45); `--trust-workspace` trust the folder for this run |
| `claude gateway [options]`: enterprise auth/telemetry gateway | `--config <path>` gateway YAML |
| **Hidden** `claude remote-control [options]`: Remote Control server for claude.ai/code or mobile (L, `remote-control --help`) | `--name <name>`; `--remote-control-session-name-prefix <prefix>`; `-c, --continue` reattach to the last recorded session here; `--session-id <id>`; `--permission-mode <mode>` (lists `default`, not `manual`); `--[no-]chrome`; `-d, --debug[=<filter>]`; `--debug-file <path>`; `-v, --verbose`; `-h, --help`; `--spawn <mode>` same-dir\|worktree\|session; `--capacity <N>` (default 32); `--[no-]create-session-in-dir` |
| **Hidden** `claude self-hosted-runner [options]`: register this machine as a cloud-session runner (L) | Connection: `--api-url <url>`, `--environment-secret-file <path>` (deprecated alias `--pool-secret-file`), `--lock-to-account <id>`, `--client-label <label>`, `--proxy-authorization-command <shell command>`, `--proxy-authorization-file <path>`, `--agent-proxy-url <url>`. Runtime: `--capacity <n>`, `--base-dir <path>` (required on Windows), `--exec-path <path>`, `--hooks-dir <path>`, `--session-stop-grace-sec <n>`, `--post-session-hook-timeout-sec <n>`, `--checkout-hook-timeout-min <n>`, `--drain-wait-sec <n>` (deprecated alias `--drain-wait-bg-tasks-sec`), `--drain-marker-file <path>`, `--git-ssh-rewrite <host>`, `--git-host-rewrite <f>=<t>`, `--use-anthropic-git-proxy` (replaces the HOME git config), `--configure-git`, `--push-outcome-on-release`, `--trust-workspace [bool]`, `--remove-session-state [bool]`, `--diff-finds-nested-repository [bool]`, `--confine-repo-settings <mode>`, `--server-auto-mode-lists <mode>`, `--host-config-snapshot <disk\|memory>`, `--health-port <port>`, `--log-level <level>`, `--log-file <path>`. Lifecycle: `--exit-if-unused-min <n>`, `--drain-grace-sec <n>`, `--retire-at <epoch-seconds>`, `--defer-shutdown-max-min <m>`. Watchdogs: `--release-idle-session-min <n>`, `--hold-idle-file <path>`, `--max-hold-min <n>`, `--startup-timeout-min <n>`, `--kill-session-after-min <n>`. Debug: `--debug-token-dir <path>` (writes live tokens). `--help, -h`. The help prints the host-config-dir option as `[env: SELF_HOSTED_RUNNER_HOST_CONFIG_DIR]` with no flag name |
| `self-hosted-runner setup [args...]`: interactive setup wizard; extra args go to the session | none |
| `self-hosted-runner doctor [args...]`: interactive diagnosis wizard | none |
| `self-hosted-runner orchestrator [options]`: run the `spawn-runner` hook per spawn hint | `--api-url <url>`, `--environment-secret-file <path>`, `--hooks-dir <path>` (required), `--hook-concurrency <n>`, `--hook-timeout <sec>`, `--expected-spawn-seconds <n>`, `--min-idle <n>`, `--scm-connector-host <h[:p]>`, `--scm-connector-id <n>`, `--scm-connector-provider <s>`, `--scm-connector-ca-file <path>`, `--scm-connector-host-rewrite <from>=<to_host:to_port>`, `--shutdown-drain-sec <n>`, `--health-port <port>`, `--log-level <level>`, `--agent-proxy-url <url>`, `--debug-dir <path>`, `--help, -h` |

### Maintenance

| Invocation | Flags |
|---|---|
| `claude doctor`: read-only health check; reads cwd settings without a trust prompt | none |
| `claude import [options] [source]`: import config from codex, gemini or cursor | `--dry-run`; `--yes` (on headless surfaces `--yes=<digest>` from the `/import` preview) |
| `claude install [options] [target]`: install the native build (stable, latest or a version) | `--force` |
| `claude update\|upgrade`: check for and install updates | none |
| `claude purge [options] [path]`: delete a project's local Claude Code data and its `~/.claude.json` entry | `--all` (exclusive with path); `--dry-run`; `-i, --interactive`; `-y, --yes` |

## In-session commands

Source: the "all commands" table (D, [commands](https://code.claude.com/docs/en/commands)). None were run for this file. Unless the Surfaces column says otherwise, a command is documented for the TUI. The JetBrains plugin runs the TUI, so it gets the same commands (D, [jetbrains](https://code.claude.com/docs/en/jetbrains)). The VS Code panel shows "a subset", and typing `/` lists them. The docs name `/btw`, `/usage`, `/copy`, `/tasks`, `/mcp` and `/plan` (D, [vs-code](https://code.claude.com/docs/en/vs-code)). Desktop names `/btw` (D, [desktop](https://code.claude.com/docs/en/desktop)). `/config` "is part of the terminal interface"; the VS Code panel and desktop don't open it (D, [settings](https://code.claude.com/docs/en/settings)). (skill) marks a bundled skill, which `-p` can also invoke as `/name` (I, from the skill model in harnesses.md).

| Command | Meaning | Surfaces beyond TUI |
|---|---|---|
| `/add-dir <path>` | Add a working directory | |
| `/advisor [model\|off]` | Toggle the advisor tool | |
| `/agents` | Reminder for managing subagents | |
| `/artifact-capabilities`, `/artifact-diagramming` | (skill) Artifact references | |
| `/artifacts` | List, attach or open artifacts | |
| `/auto-mode-setup` | Draft `autoMode.environment` entries | |
| `/autocompact [auto\|<tokens>]` | Set the auto-compact window | |
| `/autofix-pr [prompt]` | Cloud session that fixes the PR on CI failures or comments | |
| `/background [prompt]` | Detach to a background agent | |
| `/batch <instruction>` | (skill) Parallel large-scale change | |
| `/branch [name]` | Branch the conversation | |
| `/btw [question]` | Side question outside the conversation | VS Code, desktop |
| `/bug [report]`, `/feedback [report]` | Report a bug or send feedback | |
| `/cd <path>` | Move the session to another directory | |
| `/chrome` | Claude in Chrome settings | |
| `/claude-api [...]` | (skill) Claude API reference and workflows | |
| `/claude-in-chrome [task]` | (skill) Browser task via Chrome | |
| `/clear [name]` | New empty conversation | |
| `/code-review [...]`, alias `/review` | (skill) Review a diff/PR/branch. harnesses.md: a repo `code-review` skill shadows `/code-review` but not `/review` | |
| `/color [color\|default]` | Prompt bar color | |
| `/compact [instructions]` | Summarize to free context | |
| `/config [key=value ...]` | Settings UI | not VS Code panel, not desktop |
| `/context [all]` | Context usage grid | |
| `/copy [N]` | Copy a response | VS Code |
| `/cost`, `/stats` | Aliases of `/usage` | |
| `/dataviz [request]` | (skill) Chart design guidance | |
| `/debug [description]` | (skill) Enable and read debug logs | |
| `/deep-research <question>` | (workflow) Cited web research | |
| `/design [brief]`, `/design consent`, `/design revoke`, `/design-login`, `/design-sync [hint]` | Claude Design | |
| `/desktop`, alias `/app` | Continue in the desktop app (macOS, x64 Windows) | |
| `/diff` | Review working-tree changes | |
| `/doctor [prompt-audit [path]]` | (skill) Setup checkup with fixes | |
| `/effort [level\|auto\|status\|ultracode [on\|off]]` | Effort level | |
| `/exit`, alias `/quit` | Exit, or detach from a background session | |
| `/export [filename]` | Export the conversation as text | |
| `/fast [on\|off]` | Fast mode | |
| `/fewer-permission-prompts` | (skill) Build an allowlist from transcripts | |
| `/focus` | Focus view | |
| `/fork [prompt]` | Copy into a new background session | |
| `/goal [condition\|clear]` | Keep working until a condition holds | |
| `/heapdump` | Heap snapshot for memory issues | |
| `/help` | Help and commands | |
| `/hooks` | View hooks | |
| `/ide` | IDE integrations and status | JetBrains (connect from an external terminal) |
| `/import [codex\|gemini\|cursor] [--dry-run] [--yes]` | Import other agents' config | `-p` lists findings |
| `/init` | Create `CLAUDE.md` | |
| `/insights` | HTML report of recent sessions | |
| `/install-github-app`, `/install-slack-app` | Install integrations | |
| `/keybindings` | Open the keybindings file | |
| `/list-agents` | Messageable agents and sessions | |
| `/login`, `/logout` | Account sign in/out | |
| `/loop [interval] [prompt]` | (skill) Repeat a prompt | |
| `/mcp [reconnect\|enable\|disable ...]` | Manage MCP servers | VS Code |
| `/memory` | Edit CLAUDE.md, auto memory | |
| `/mobile`, aliases `/ios`, `/android` | App QR code | |
| `/model [model]` | Switch and save the model | |
| `/output-style [style]` | Output styles | |
| `/passes` | Share a free week (eligible accounts) | |
| `/permissions` | Allow/ask/deny rules | |
| `/plan [description]` | Enter plan mode | VS Code |
| `/plugin [subcommand]` | Plugin manager | |
| `/plugin-authoring` | (skill) Mod-writing reference | |
| `/powerup` | Interactive lessons | |
| `/privacy-settings` | Privacy settings (Pro/Max/Ultra) | |
| `/radio` | Lo-fi radio | |
| `/rate-limit-options` | Options when a usage limit blocks you | |
| `/recap` | One-line session summary | |
| `/release-notes` | Changelog picker | |
| `/reload-plugins [--force]`, `/reload-skills` | Reload plugins or skills | |
| `/remote-control` | Make this session available via Remote Control | |
| `/remote-env` | Default cloud environment | |
| `/rename [name]` | Rename the session | `-p` |
| `/restart` | Restart to apply an update (macOS/Linux native) | |
| `/resume [session]` | Resume or open the picker | |
| `/rewind`, aliases `/checkpoint`, `/undo` | Rewind conversation and/or code | |
| `/run`, `/run-skill-generator`, `/verify` | (skill) Launch, record a recipe, verify the app | |
| `/sandbox` | Toggle sandbox (supported platforms) | |
| `/schedule [description]` | Cloud scheduled tasks | |
| `/scroll-speed` | Wheel scroll speed (fullscreen only) | not JetBrains terminal |
| `/security-review` | Security review of the branch diff | |
| `/setup-bedrock`, `/setup-vertex` | Provider wizards (hidden from the menu) | |
| `/simplify [target]` | (skill) Cleanup review and fixes | |
| `/skill-doctor` | Skill context cost and usage | not over Remote Control |
| `/skills` | List skills | |
| `/slides [brief]` | (skill) Slide deck artifact | |
| `/status` | Status tab: version, model, account, setting sources | |
| `/statusline` | Configure the status line | |
| `/stickers` | Order stickers | |
| `/stop` | Stop the attached background session | |
| `/subtask <task>` | Forked background subagent | |
| `/tasks`, alias `/bashes` | Background work in this session | VS Code |
| `/team-onboarding` | Onboarding guide from usage | |
| `/teleport`, alias `/tp` | Pull a cloud session here | |
| `/terminal-setup` | Shift+Enter newline binding | |
| `/theme` | Color theme | |
| `/tui [default\|fullscreen]` | Renderer | |
| `/ultrareview [PR or branch]` | Cloud multi-agent review | |
| `/update-config [request]` | (skill) Edit settings from a description | |
| `/upgrade` | Plan upgrade page | |
| `/usage` | Cost, limits, stats | VS Code |
| `/usage-credits` | Usage credits | |
| `/voice [hold\|tap\|off]` | Voice dictation | |
| `/web-setup` | Connect GitHub for cloud sessions | |
| `/workflow-authoring` | (skill) Workflow script reference | |
| `/workflows` | Workflow progress view | |

Removed (D): `/pr-comments` (v2.1.91), `/vim` (v2.1.92), `/ultraplan`.

## Settings and environment

**Files** (D, [settings](https://code.claude.com/docs/en/settings)). Precedence, highest first: managed, `--settings`, `.claude/settings.local.json`, `.claude/settings.json`, `~/.claude/settings.json`. List keys merge. On Windows `~/.claude` is `%USERPROFILE%\.claude`, which `CLAUDE_CONFIG_DIR` relocates. `~/.claude.json` holds account details, MCP servers, per-project trust and global config keys such as `diffTool`. Settings files are reloaded on change, except `model`/`effortLevel` (D).

**Local layout** (L, `ls ~/.claude`; contents not read): `settings.json`, `settings.local.json`, `CLAUDE.md`, `skills/`, `commands/`, `hooks/`, `plugins/`, `projects/`, `sessions/`, `session-env/`, `shell-snapshots/`, `file-history/`, `history.jsonl`, `ide/`, `daemon/`, `chrome/`, `backups/`, and a credentials file. `C:\Users\uosmi\.claude.json` exists. A second, smaller `.claude.json` sits inside `~/.claude/`, and its purpose wasn't checked. `CLAUDE_CONFIG_DIR` is unset. The user `settings.json` top-level keys are `hooks`, `autoUpdatesChannel`, `agentPushNotifEnabled`, `tui`, `env` (`CLAUDE_CODE_RETRY_WATCHDOG`), `preferredNotifChannel` (key names only). This repo has no `.claude/settings.json` or `settings.local.json`.

**Keys an orchestrator needs** (D, [settings-reference](https://code.claude.com/docs/en/settings-reference)): `permissions.allow`, `permissions.ask`, `permissions.deny`, `permissions.defaultMode` (project/local files can't set `auto` or `bypassPermissions`), `permissions.additionalDirectories`, `permissions.disableBypassPermissionsMode`, `autoMode`, `model`, `effortLevel`, `fallbackModel`, `env`, `hooks`, `disableAllHooks`, `enabledPlugins`, `extraKnownMarketplaces`, `agent`, `sandbox.enabled`, `sandbox.failIfUnavailable`, `worktree.baseRef`, `worktree.symlinkDirectories`, `worktree.sparsePaths`, `enableAllProjectMcpServers`, `enabledMcpjsonServers`, `disableBundledSkills`, `skillOverrides`, `attribution.commit`, `attribution.pr`, `apiKeyHelper`, `cleanupPeriodDays`, `tui`, `viewMode`, `preferredNotifChannel`. Desktop dev servers: `.claude/launch.json` (`autoVerify`) (D).

**VS Code settings** (D, [vs-code](https://code.claude.com/docs/en/vs-code)): `claudeCode.useTerminal`, `claudeCode.initialPermissionMode`, `claudeCode.allowDangerouslySkipPermissions`, `claudeCode.environmentVariables`, `claudeCode.disableLoginPrompt`, `claudeCode.claudeProcessWrapper`, `claudeCode.preferredLocation`.

**Environment variables** (D, [env-vars](https://code.claude.com/docs/en/env-vars)):

| Variable | Meaning |
|---|---|
| `ANTHROPIC_API_KEY` | API key; overrides subscription login |
| `ANTHROPIC_AUTH_TOKEN` | Custom `Authorization: Bearer` value |
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth token for SDK/automation (see `setup-token`) |
| `ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_MODEL` | Model override / new-session default |
| `ANTHROPIC_DEFAULT_{SONNET,OPUS,HAIKU}_MODEL` | Alias targets |
| `CLAUDE_CODE_SUBAGENT_MODEL` | Default model for subagents, teammates and workflows |
| `CLAUDE_CODE_EFFORT_LEVEL` | Effort; overrides `--effort` and `/effort` |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Output token cap |
| `CLAUDE_CONFIG_DIR` | Config directory |
| `CLAUDE_CODE_GIT_BASH_PATH` | Path to `bash.exe` when Git Bash isn't on PATH (Windows) |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | PowerShell tool on/off on Windows |
| `CLAUDE_CODE_SHELL` | Bash tool shell (`bash`/`zsh` path; an invalid value is ignored) |
| `BASH_DEFAULT_TIMEOUT_MS`, `BASH_MAX_TIMEOUT_MS` | Foreground command timeout default (120000) / max (600000) |
| `MCP_TIMEOUT`, `MCP_TOOL_TIMEOUT` | MCP startup (30000) / tool execution timeout |
| `CLAUDE_CODE_SIMPLE`, `CLAUDE_CODE_SAFE_MODE` | Same as `--bare` / `--safe-mode` |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY` | Don't write history or transcripts |
| `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT` | Same as `--forward-subagent-text` |
| `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` | Subagent depth (3) / concurrency (20) |
| `CLAUDE_CODE_DEBUG_LOGS_DIR`, `CLAUDE_CODE_DEBUG_LOG_LEVEL` | Debug log path / level |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `DISABLE_TELEMETRY`, `DISABLE_ERROR_REPORTING`, `DISABLE_AUTOUPDATER` | Turn off traffic, telemetry, error reports, auto-update |
| `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`, `CLAUDE_CODE_USE_ANTHROPIC_AWS` | Third-party providers |
| `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX` | Remote Control name prefix (also printed in `remote-control --help`, L) |
| `MCP_CLIENT_SECRET` | OAuth client secret for `mcp add` (L, `mcp add --help`) |

## Couldn't verify

- **Bare `claude` in Git Bash.** harnesses.md says "Binary `claude`" and gives the test as "`claude -p "<prompt>" --allowedTools Read`". Locally, `claude` resolves to `C:\Users\uosmi\.local\bin\claude`, a zsh wrapper ("`#!/usr/bin/env zsh` … exec "$NVM_DIR/versions/node/v22.21.1/bin/claude""), and fails with "`/usr/bin/env: 'zsh': No such file or directory`" (L). `claude.exe` beside it works. Trust the install: call `claude.exe` from Git Bash. Whether the nvm copy exists, or matches 2.1.316, wasn't checked.
- **Version drift.** harnesses.md says "probed 2.1.303" and "Local source verification (CLI 2.1.310)". Local is "2.1.316 (Claude Code)" (L). harnesses.md's `claude plugin list --json` `readFromFolder`/`folderVersion` claim and its "`--plugin-dir` + piped stdin can hang" warning weren't re-tested.
- **`--permission-mode` values.** Top-level help prints `"manual"` and no `default`. `remote-control --help` prints "(acceptEdits, auto, bypassPermissions, default, dontAsk, plan)" (L). The docs say both values work ("`claude --help` lists it in place of `default`, and both values work") (D). Not exercised.
- **`--effort ultracode`.** Documented ("Options: `low`, `medium`, `high`, `xhigh`, `max`, or `ultracode`") (D). Help prints "(low, medium, high, xhigh, max)" (L).
- **Hidden flags and subcommands.** The docs list the hidden flags (D), and their strings are in the binary (L). None was run. Hidden subcommands `daemon`, `remote-control` and `self-hosted-runner` print help (L), but their behaviour wasn't run. The docs' `daemon` list omits the `uninstall` subcommand and the `--json-path`/`--log-file` flags that local help prints. `--remote <name>` in the binary may belong to `plugin tag`, not to the deprecated `--remote`.
- **`mcp add-from-claude-desktop`.** It says "(Mac and WSL only)" (L). Not tried on Windows.
- **Desktop app.** MSIX `Claude 4.4212.0.0` is installed (L). Whether that is the Store build or the direct download is unknown. The docs say SSH needs "the download version of Desktop, not the Microsoft Store version" (D). Every desktop feature claim is D, from a page read only to 100000 of 208758 characters.
- **VS Code.** `anthropic.claude-code` isn't installed, so every VS Code claim is D.
- **JetBrains.** Plugin 0.1.14-beta is present (L) but wasn't launched. Behaviour claims are D.
- **Agent SDK.** Not installed. Package names, `query`, the options and the bundled binary are D.
- **Slash commands.** None were run. Per-surface availability is mostly undocumented. The VS Code subset is only partly listed (D).
- **Truncated doc pages.** settings-reference was read to 100000 of 442645 characters and env-vars to roughly 185000 of 187066. Keys and variables come only from the portions read.
- **Native Windows sandboxing.** The docs name macOS, Linux and WSL2 for `sandbox.*` (D). Native Windows behaviour is unknown.

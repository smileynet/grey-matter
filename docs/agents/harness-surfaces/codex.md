# Codex surfaces

OpenAI Codex: the `codex` CLI and its TUI, the Codex desktop app, the IDE extension, Codex cloud, and the API surfaces (app-server, the shared agents daemon, remote control, exec-server). Grammar and marks follow [README.md](./README.md). For skill deployment and testing, see [harnesses.md](../harnesses.md#codex-secondary).

## Versions

Gathered 2026-11-01 on Windows 11 Pro (10.0.26300), Git Bash.

| Surface | Program | Version | How read | Help hash |
|---|---|---|---|---|
| CLI, TUI, API | `codex.exe` (vendored, see below) | `codex-cli 0.166.0` | `codex.exe --version` (L) | `c45272069305` |
| GUI: desktop app | `OpenAI.Codex` MSIX package | `26.1027.3384.0` | `Get-AppxPackage *codex*` (L) | n/a |
| GUI: IDE extension | `openai.chatgpt` | not installed | extension-folder scan of `~/.vscode`, `~/.cursor`, `~/.windsurf`, `~/.kiro`, `~/.antigravity` found none (L) | n/a |
| Cloud | hosted service | n/a | reached only through `codex cloud` (L) | n/a |

Help hash command: `codex.exe --help | tr -d '\r' | sha256sum | cut -c1-12`.

**Binary used.** The bun shim `codex` on PATH was reported broken for this task, so every probe here used the vendored binary:
`~/.bun/install/global/node_modules/@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe`.
In this session the shim did answer (`codex --version` gave 0.166.0 in Git Bash and pwsh, same help hash), which may be because `~/.bun/bin/codex.exe` is a full 371,735,856-byte copy of the binary dated six minutes after the vendored one. See Couldn't verify. (L: `ls -la`, `Get-Command codex -All`)

## Surfaces

- **CLI.** `codex exec [PROMPT]` (alias `e`) runs one headless turn and exits. Related one-shots: `codex exec resume`, `codex exec fork`, `codex exec review`, `codex review`, `codex cloud exec`. The rest of the subcommands manage login, MCP, plugins, sessions, features, the daemon and the sandbox. `codex exec` takes no `-a` and no `--search`: approvals are settled with `-s`, `--approve-for-me` or `--dangerously-bypass-approvals-and-sandbox`. Config: `~/.codex/config.toml`, `-c key=value`, `-p <name>` (`$CODEX_HOME/<name>.config.toml`). (L: `exec --help`, `exec -a never --help` gives "unexpected argument '-a'")
- **TUI.** `codex [PROMPT]` with no subcommand; `codex resume` and `codex fork` reopen saved sessions in it; `codex agents` opens the agent command center across sessions on the shared daemon. By default it attaches to a shared local background app-server (the "shared background server"); `--no-daemon` runs without it, `--remote <ADDR>` attaches to a remote app-server. `--no-alt-screen` keeps scrollback. Same config files as the CLI. (L: `--help`; D: [CLI reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli))
- **GUI: desktop app.** The ChatGPT/Codex desktop app, installed here as MSIX `OpenAI.Codex`. `codex app [PATH]` launches it, or opens the installer if missing (`--download-url` overrides the installer URL). The TUI's `/app` continues the current session in the app. Docs say on Windows `codex app` prints the path to open rather than opening it. The app uses the same `~/.codex` home (I: `~/.codex` holds `models_cache.codex_work_desktop.json`, `[desktop]` table in `config.toml`, `computer-use/`, `pets/`, `dictation-history/`). (L: `codex app --help`, `Get-AppxPackage`; D: [app surface](https://learn.chatgpt.com/docs/developer-commands?surface=app))
- **GUI: IDE extension.** The `openai.chatgpt` extension for VS Code and forks (Cursor, Windsurf, VS Code Insiders); Xcode and JetBrains have their own integrations. Opened from the Codex sidebar icon or **Codex: Open Codex Sidebar**. Can delegate longer tasks to Codex cloud. Not installed on this machine. (D: [IDE](https://learn.chatgpt.com/docs/ide/))
- **GUI/API: Codex cloud.** Hosted task runs in published cloud environments (repos, setup, secrets, network policy) started from ChatGPT web, mobile, desktop, Slack or the CLI. From the terminal: `codex cloud` (TUI browser, alias `cloud-tasks`), `codex cloud exec --env <ENV_ID>`, `status`, `list`, `diff`, `apply`, and `codex apply <TASK_ID>`. Marked `[EXPERIMENTAL]` in help. (L: `cloud --help`, `cloud-tasks --help`; D: [cloud](https://learn.chatgpt.com/docs/cloud/))
- **API: app-server.** `codex app-server` is the JSON-RPC protocol server the TUI, desktop app and IDE drive (I: from `--remote` attaching the TUI to it, and docs naming it the replacement for the removed `mcp-server`). Transports: `stdio://` (default), `unix://`, `unix://PATH`, `ws://IP:PORT`, `off`; WebSocket auth by capability token or signed JWT. `generate-ts` and `generate-json-schema` emit the protocol bindings. `codex app-server daemon ...` manages the shared local daemon; `codex app-server proxy` pipes stdio to its control socket. Marked `[experimental]`. (L: `app-server --help`; D: CLI reference)
- **API: remote control.** `codex remote-control [start|stop|pair]` runs the app-server daemon with remote control enabled and prints short-lived pairing codes; `--no-daemon` runs an embedded app-server in the foreground. `[experimental]`. (L)
- **API: exec-server.** `codex exec-server` runs a standalone command executor over WebSocket or stdio and can register itself (`--remote`, `--environment-id`) as a remote environment; `forward` registers an existing one. `[EXPERIMENTAL]`. (L)
- **MCP server: absent.** There is no `codex mcp-server` in 0.166.0: `codex mcp-server --help` falls through to the top-level help (the word is taken as a prompt). Docs say it was removed and the app-server replaces it. `codex mcp` only manages MCP *client* entries. (L; D: CLI reference)

## Feature-to-surface matrix

GUI = desktop app unless noted; IDE = IDE extension. API = app-server family.

| Feature | CLI | TUI | GUI | API | Evidence |
|---|---|---|---|---|---|
| One-shot prompt | ✓ `codex exec`, `codex review`, `codex cloud exec` | ✗ `[PROMPT]` only seeds an interactive session | ✗ | ✓ app-server turns | L (`--help`); API I |
| Structured output | ✓ `--json` (JSONL events), `--output-schema <FILE>`, `-o <FILE>` | ✗ | ✗ | ✓ protocol schema via `generate-json-schema` | L; GUI I |
| Model selection | ✓ `-m`, `-c model=...`, `-c model_reasoning_effort=...` | ✓ `-m`, `/model`, `/fast` | ? | ? | L (flags); D (slash commands, config ref) |
| Approvals and permission modes | ~ no `-a`; `--approve-for-me`, `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`) | ✓ `-a on-request\|never`, `--approve-for-me`, `/permissions`, `/approve` | ? | ? | L (flags, aliases parse); D (`/permissions`, `/approve`, `approval_policy`) |
| Sandboxing | ✓ `-s read-only\|workspace-write\|danger-full-access`, `codex sandbox` (Windows restricted token) | ✓ `-s`, `/setup-default-sandbox` (Windows) | ? | ✓ `codex sandbox --sandbox-state-json` | L; D (slash) |
| Sub-agents | ~ feature `multi_agent` stable/on; `agents.*` config | ✓ `/agents`, `/subagents` | ? | ? | L (`features list`); D (config ref, slash) |
| Worktrees | ✓ `--worktree` on `exec`, `exec resume/fork/review` | ✓ `--worktree`, `/worktree` | ? | ? | L; D (slash). Feature `worktrees` is `removed`/`true` (graduated, I) |
| Background or parallel sessions | ✓ `codex queue`, `codex agents` | ✓ shared daemon, `/ps`, `/stop`, `/daemon`, `/side` | ? | ✓ `app-server daemon` | L; D (slash) |
| Session resume | ✓ `exec resume [--last]`, `exec fork` | ✓ `resume`, `fork`, `/resume`, `/fork` | ? | ? | L; D |
| Hooks | ✓ `--dangerously-bypass-hook-trust`; feature `hooks` stable/on | ✓ `/hooks` | ? | ? | L (flag, `~/.codex/hooks.json`); D (config ref events) |
| MCP (client) | ✓ `codex mcp list\|get\|add\|remove\|login\|logout` | ✓ `/mcp` | ✓ `/mcp` (app, IDE) | ? | L; D |
| MCP (as server) | ✗ removed | ✗ | ✗ | ✗ use app-server | L (absent); D |
| Skills and plugins | ✓ `codex plugin ...`, `~/.codex/skills/` | ✓ `/skills`, `/plugins`, `/apps` | ? | ✓ `--cloud-skills-snapshot` | L; D |
| Web search | ✗ `exec --search` rejected | ✓ `--search` | ? | ? | L |
| Images in prompt | ✓ `-i <FILE>...` | ✓ `-i`, `/mention` | ? | ? | L; D |
| Notifications | ~ `notify` (user-level command hook) | ~ same | ? (docs nav lists "Notifications") | ? | D (config ref, app page) |
| Remote or cloud runs | ✓ `codex cloud exec`, `codex apply` | ✓ `codex cloud`, `--remote <ADDR>` | ✓ (docs: cloud from app/web/mobile) | ✓ `remote-control`, `exec-server --remote` | L; GUI D |
| Code review | ✓ `codex review`, `codex exec review` | ✓ `/review` | ✓ `/review` (app, IDE) | ? | L; D |

## CLI reference

Notation per the README. Flags are copied from `--help` of 0.166.0. **Hidden** = works or is documented but not printed by `--help`.

### Flag sets reused below

- **Common** (on every subcommand, 79 of 79 help pages):
  - `-c, --config <key=value>`: override a `config.toml` value for this run; dotted path, value parsed as TOML.
  - `--enable <FEATURE>`: enable a feature (repeatable); same as `-c features.<name>=true`.
  - `--disable <FEATURE>`: disable a feature (repeatable); same as `-c features.<name>=false`.
  - `-h, --help`: print help.
- **Session** (root `codex`, `resume`, `fork`, `archive`, `delete`, `unarchive`):
  - `--remote <ADDR>`: connect the TUI to a remote app-server (`ws://host:port`, `wss://host:port`, `unix://`, `unix://PATH`).
  - `--remote-auth-token-env <ENV_VAR>`: env var holding the bearer token for a remote app-server WebSocket.
  - `--strict-config`: error on `config.toml` fields this version does not recognize.
  - `-i, --image <FILE>...`: image(s) to attach to the initial prompt.
  - `-m, --model <MODEL>`: model to use.
  - `--oss`: use the open-source (local) provider.
  - `--local-provider <OSS_PROVIDER>`: `lmstudio` or `ollama`.
  - `-p, --profile <CONFIG_PROFILE_V2>`: layer `$CODEX_HOME/<name>.config.toml` over the user config.
  - `-s, --sandbox <SANDBOX_MODE>`: `read-only`, `workspace-write`, `danger-full-access`.
  - `--approve-for-me`: route approval requests to automatic review under the workspace-write sandbox. Hidden alias `--not-so-yolo` (L parses; D).
  - `--dangerously-bypass-approvals-and-sandbox`: no prompts, no sandbox; for externally sandboxed environments only. Hidden alias `--yolo` (L parses; D).
  - `--dangerously-bypass-hook-trust`: run enabled hooks without persisted hook trust for this invocation.
  - `-C, --cd <DIR>`: working root for the agent.
  - `--worktree`: run in a new managed Git worktree.
  - `--add-dir <DIR>`: extra writable directory alongside the workspace.
- **Interactive** (root `codex`, `resume`, `fork` only):
  - `-a, --ask-for-approval <APPROVAL_POLICY>`: `on-request` (model decides) or `never` (failures go straight back to the model).
  - `--search`: enable the native Responses `web_search` tool, no per-call approval.
  - `--no-alt-screen`: inline mode, keeps terminal scrollback.
  - `--no-daemon`: run without the shared background server even if it is running.
  - `-V, --version`: print version.
- **Exec** (`exec`, `exec resume`, `exec fork`, `exec review`):
  - `--strict-config`, `-m, --model <MODEL>`, `--dangerously-bypass-approvals-and-sandbox`, `--dangerously-bypass-hook-trust`, `--worktree`: as in Session.
  - `--thread-source <SOURCE>`: source classification for new or forked threads.
  - `--cyber-access-program <PROGRAM>`: request an experimental Cyber access program (`standard`, `daybreak_blue`, `daybreak_red`); OpenAI provider only, not with review.
  - `--skip-git-repo-check`: allow running outside a Git repository.
  - `--ephemeral`: do not persist session files.
  - `--ignore-user-config`: skip `$CODEX_HOME/config.toml` (auth still uses `CODEX_HOME`).
  - `--ignore-rules`: skip user and project execpolicy `.rules` files.
  - `--output-schema <FILE>`: JSON Schema for the final response.
  - `--json`: print events to stdout as JSONL.
  - `-o, --output-last-message <FILE>`: write the agent's last message to a file.
- **WebSocket auth** (`app-server`, `exec-server`):
  - `--ws-auth <MODE>`: `capability-token` or `signed-bearer-token`.
  - `--ws-token-file <PATH>`: absolute path to the capability-token file.
  - `--ws-token-sha256 <HEX>`: SHA-256 of the capability token.
  - `--ws-shared-secret-file <PATH>`: shared secret for signed JWT bearer tokens.
  - `--ws-issuer <ISSUER>`: expected JWT issuer.
  - `--ws-audience <AUDIENCE>`: expected JWT audience.
  - `--ws-max-clock-skew-seconds <SECONDS>`: allowed JWT clock skew.
- **Remote executor** (`exec-server`, `exec-server forward`):
  - `--strict-config`: as above.
  - `--linux-sandbox-pid-namespace <MODE>`: `isolate` (default) or `inherit`.
  - `--proxy-private-ips-via-upstream`: let permitted private-IP destinations use the upstream proxy.
  - `--remote <URL>`: register as a remote environment at this base URL.
  - `--remote-transport <REMOTE_TRANSPORT>`: `noise` (default) or `direct`.
  - `--environment-id <ID>`: environment to attach to when registering.
  - `--name <NAME>`: human-readable environment name.
  - `--use-agent-identity-auth`: authenticate registration with Agent Identity from `CODEX_ACCESS_TOKEN`.
  - `--executor-credential-stdin`: read rotating executor credentials from stdin; exit when the pipe closes.
  - `--aws-sigv4`: sign Direct registration and WebSocket handshakes with AWS SigV4.
  - `--aws-profile <PROFILE>`: AWS profile for SigV4.
  - `--aws-region <REGION>`: AWS signing region.
  - `--aws-service <SERVICE>`: AWS signing service (default `execute-api`).
  - `--exit-on-stdin-close`: exit when the parent-owned stdin closes.

### Root and TUI

```
codex [OPTIONS] [PROMPT]
codex [OPTIONS] <COMMAND> [ARGS]
```
- `[PROMPT]`: optional prompt to start the interactive session.
- Flags: Common, Session, Interactive.

### Sessions

```
codex resume [OPTIONS] [SESSION_ID] [PROMPT]
```
Resume an interactive session (picker by default). Common, Session, Interactive, plus:
- `--last`: continue the most recent session without the picker.
- `--all`: show all sessions (no cwd filter, adds CWD column).
- `--include-non-interactive`: include `exec` sessions in the picker and `--last`.

```
codex fork [OPTIONS] [SESSION_ID] [PROMPT]
```
Fork a session into a new interactive one. Common, Session, Interactive, plus `--last` (fork the most recent) and `--all` (no cwd filter). Docs: `--worktree` here needs an explicit id, not `--last` (D).

```
codex agents [OPTIONS]
```
Browse all agent sessions on the shared local app-server daemon. Common, plus `--remote <ADDR>`, `--remote-auth-token-env <ENV_VAR>`, `-C, --cd <DIR>` (directory for new tasks on a remote server), `--no-alt-screen`.

```
codex queue [OPTIONS] --thread <THREAD> --message <TEXT>
```
Queue a message for an existing session. Common, plus:
- `--thread <THREAD>`: session UUID or exact session name.
- `--message <TEXT>`: message text.
- `--resume`: after queueing, try to resume the thread on the local daemon or `--remote` server.
- `--remote <ADDR>`, `--remote-auth-token-env <ENV_VAR>`, `-p, --profile <CONFIG_PROFILE_V2>`, `--strict-config`, `-C, --cd <DIR>`: as in Session.

```
codex archive [OPTIONS] <SESSION>
codex unarchive [OPTIONS] <SESSION>
codex delete [OPTIONS] <SESSION>
```
Archive, restore, or permanently delete a saved session (UUID or name). Common and Session (help prints them; their effect on these commands is untested, I). `delete` adds `--force`: delete without prompting; SESSION must be a UUID.

```
codex migrate-rollouts [OPTIONS]
```
Inspect or migrate legacy sessions to paginated thread history. Common, plus `--apply` (publish; otherwise report only), `--thread <THREAD_ID>` (restrict to thread ids), `--max-mib-per-second <MIB>` (throughput cap), `--json` (full report), `--verbose` (one line per rollout).

```
codex migrate-nfs-db [OPTIONS]
```
`[experimental]` Migrate configured SQLite databases to DELETE journal mode in place. Common, plus `--staging-dir <STAGING_DIR>`: local directory for the database and WAL (default: system temp).

### Non-interactive runs

```
codex exec [OPTIONS] [PROMPT]
codex exec [OPTIONS] <COMMAND> [ARGS]
```
Alias `e`. `[PROMPT]`: instructions; read from stdin if absent or `-`; piped stdin plus a prompt is appended as a `<stdin>` block. Common, Exec, plus:
- `-i, --image <FILE>...`, `--oss`, `--local-provider <OSS_PROVIDER>`, `-p, --profile <CONFIG_PROFILE_V2>`, `-s, --sandbox <SANDBOX_MODE>`, `--approve-for-me`, `-C, --cd <DIR>`, `--add-dir <DIR>`: as in Session.
- `--color <COLOR>`: `always`, `never`, `auto` (default).
- `-V, --version`: print version.

```
codex exec resume [OPTIONS] [SESSION_ID] [PROMPT]
```
Resume by id or thread name (UUID wins), or `--last`. Common, Exec, plus `--last` (newest session), `--all` (no cwd filter), `-i, --image <FILE>` (images for the follow-up prompt).

```
codex exec fork [OPTIONS] <SESSION_ID> [PROMPT]
```
Fork a session by id or thread name. Common, Exec, plus `-i, --image <FILE>`.

```
codex exec review [OPTIONS] [PROMPT]
codex review [OPTIONS] [PROMPT]
```
Code review of the current repository; `[PROMPT]` is custom instructions (`-` reads stdin). Both take Common plus:
- `--uncommitted`: review staged, unstaged and untracked changes.
- `--base <BRANCH>`: review against a base branch.
- `--commit <SHA>`: review one commit.
- `--title <TITLE>`: commit title for the summary.
- `--strict-config`.
`exec review` also takes the Exec set; top-level `review` takes nothing else (no `-m`).

### Auth

```
codex login [OPTIONS] [COMMAND]
codex login status [OPTIONS]
codex logout [OPTIONS]
```
`login`: Common, plus `--with-api-key` (read API key from stdin), `--with-access-token` (read access token from stdin), `--device-auth` (device-code login; help prints no description). `login status` and `logout`: Common only.

### MCP client entries

```
codex mcp list [OPTIONS]                 # --json: configured servers as JSON
codex mcp get [OPTIONS] <NAME>           # --json: one server as JSON
codex mcp add [OPTIONS] <NAME> (--url <URL> | -- <COMMAND>...)
codex mcp remove [OPTIONS] <NAME>
codex mcp login [OPTIONS] <NAME>
codex mcp logout [OPTIONS] <NAME>
```
All take Common. `mcp` subcommands print no descriptions in help.
- `add`: `--env <KEY=VALUE>` (stdio only), `--url <URL>` (streamable HTTP server), `--bearer-token-env-var <ENV_VAR>` (HTTP only), `--oauth-client-id <CLIENT_ID>`, `--oauth-client-secret <CLIENT_SECRET>`, `--oauth-client-registration <AUTO|CIMD|DCR>` (`auto`, `cimd`, `dcr`; immediate login only), `--oauth-resource <RESOURCE>`.
- `login`: `--no-browser` (print the auth URL, accept the callback URL), `--scopes <SCOPE,SCOPE>` (OAuth scopes), `--oauth-client-registration <AUTO|CIMD|DCR>`.

### Plugins

```
codex plugin add [OPTIONS] <PLUGIN[@MARKETPLACE]>
codex plugin list [OPTIONS]
codex plugin remove [OPTIONS] <PLUGIN[@MARKETPLACE]>
codex plugin marketplace add [OPTIONS] <SOURCE>
codex plugin marketplace list [OPTIONS]
codex plugin marketplace upgrade [OPTIONS] [MARKETPLACE_NAME]
codex plugin marketplace remove [OPTIONS] <MARKETPLACE_NAME>
```
All take Common and `--json` (machine-readable result).
- `add`, `remove`: `-m, --marketplace <MARKETPLACE>` when the selector lacks `@MARKETPLACE`.
- `list`: `-m, --marketplace <MARKETPLACE>` (filter), `--available` (include uninstalled plugins in JSON).
- `marketplace add`: `<SOURCE>` is a local path, `owner/repo[@ref]`, HTTPS or SSH Git URL; `--ref <REF>` (Git ref), `--sparse <PATH>` (sparse-checkout path, repeatable).
- `marketplace upgrade`: omit the name to refresh all Git marketplaces.

### App-server, daemon, remote control

```
codex app-server [OPTIONS] [COMMAND]
```
`[experimental]` Run the app server. Common, WebSocket auth, plus:
- `--listen <URL>`: `stdio://` (default), `unix://`, `unix://PATH`, `ws://IP:PORT`, `off`.
- `--stdio`: same as `--listen stdio://`.
- `--startup-sign-out`: sign out via the managed auth path before loading startup requirements.
- `--print-startup-config`: validate config and print requirements as JSON without starting.
- `--startup-client-info <STARTUP_CLIENT_INFO>`: ClientInfo JSON for config/auth request identity.
- `--cloud-skills-snapshot <PATH>`: load frozen cloud skills from a JSON snapshot.
- `--code-mode-host <URL>`: use a remote code-mode host instead of a local one.
- `--strict-config`.
- `--analytics-default-enabled`: enable analytics by default.

```
codex app-server daemon bootstrap [OPTIONS]   # --remote-control: launch with remote control on
codex app-server daemon start [OPTIONS]
codex app-server daemon restart [OPTIONS]
codex app-server daemon update [OPTIONS]      # --from-cli: copy and pin this CLI package; -y, --yes: no prompt
codex app-server daemon enable-remote-control [OPTIONS]
codex app-server daemon disable-remote-control [OPTIONS]
codex app-server daemon stop [OPTIONS]
codex app-server daemon version [OPTIONS]     # CLI and running daemon versions as JSON
codex app-server proxy [OPTIONS]              # --sock <SOCKET_PATH>: control socket to connect to
codex app-server generate-ts [OPTIONS] --out <DIR>
codex app-server generate-json-schema [OPTIONS] --out <DIR>
```
All take Common. `bootstrap` installs durable daemon management for SSH-driven use. `generate-ts`: `-o, --out <DIR>`, `-p, --prettier <PRETTIER_BIN>`, `--experimental` (include experimental methods). `generate-json-schema`: `-o, --out <DIR>`, `--experimental`. Both `[experimental]`.

```
codex remote-control [OPTIONS] [COMMAND]
codex remote-control start|stop|pair [OPTIONS]
```
`[experimental]`. All take Common and `--json`. Bare `remote-control` adds `--no-daemon`: run an embedded app-server in the foreground until Ctrl-C. `pair` prints a short-lived pairing code.

```
codex exec-server [OPTIONS] [COMMAND]
codex exec-server forward [OPTIONS] --remote <URL> --environment-id <ID> --connect <URL>
```
`[EXPERIMENTAL]`. `exec-server`: Common, WebSocket auth, Remote executor, plus `--concurrent-requests <COUNT>` (per connection, default 1) and `--listen <URL>` (`ws://IP:PORT` default, `stdio`, `stdio://`). `forward`: Common, Remote executor, plus `--connect <URL>` (destination exec-server WebSocket).

### Cloud

```
codex cloud [OPTIONS] [COMMAND]          # alias cloud-tasks; bare form opens the task browser
codex cloud exec [OPTIONS] --env <ENV_ID> [QUERY]
codex cloud status [OPTIONS] <TASK_ID>
codex cloud list [OPTIONS]
codex cloud apply [OPTIONS] <TASK_ID>
codex cloud diff [OPTIONS] <TASK_ID>
codex apply [OPTIONS] <TASK_ID>          # alias a
```
All take Common. `cloud` adds `-V, --version`.
- `exec`: `--env <ENV_ID>` (target environment), `--attempts <ATTEMPTS>` (best-of-N, default 1), `--branch <BRANCH>` (default current branch).
- `list`: `--env <ENV_ID>` (filter), `--limit <N>` (1-20, default 20), `--cursor <CURSOR>`, `--json`.
- `apply`, `diff`: `--attempt <N>` (1-based attempt).
- `codex apply`: apply the latest diff from a Codex task as `git apply` to the working tree.

### Sandbox and exec policy

```
codex sandbox [OPTIONS] [COMMAND]... [COMMAND]
codex sandbox uninstall [OPTIONS]
```
Run a command under the Windows restricted-token sandbox (this build). Common, plus:
- `--sandbox-state-json <JSON>`: opaque `codex/sandbox-state` value to apply.
- `--sandbox-state-readable-root <SANDBOX_STATE_READABLE_ROOT>`: add a readable root (repeatable).
- `--sandbox-state-disable-network`: disable direct network access.
- `-P, --permission-profile <NAME>`: named permissions profile from the active config.
- `-p, --profile <CONFIG_PROFILE>`: layer `$CODEX_HOME/<name>.config.toml`.
- `-C, --cd <DIR>`: working directory for profile resolution and the command.
- `--include-managed-config`: include managed requirements when resolving `-P`.
`uninstall`: remove the legacy Windows sandbox's machine-wide accounts and network rules (Common only).

```
codex execpolicy check [OPTIONS] --rules <PATH> <COMMAND>...
```
**Hidden** (not in top-level help; documented as experimental, D). Common, plus `-r, --rules <PATH>` (rule files, repeatable), `--pretty` (pretty JSON), `--resolve-host-executables` (match absolute paths against basename rules, gated by `host_executable()`).

### Features

```
codex features list [OPTIONS]                # name, stage, effective state
codex features enable [OPTIONS] <FEATURE>    # writes features.<name>=true to config.toml
codex features disable [OPTIONS] <FEATURE>   # writes features.<name>=false to config.toml
```
All take Common. See [Feature flags](#feature-flags).

### Diagnostics and maintenance

```
codex doctor [OPTIONS]
```
Diagnose install, config, auth and runtime. Common, plus `--json` (redacted report), `--network-only`, `--summary`, `--all` (expand lists), `--no-color`, `--ascii`.

```
codex debug models [OPTIONS]                       # --bundled: skip refresh, dump the bundled catalog
codex debug app-server send-message-v2 [OPTIONS] <USER_MESSAGE>
codex debug prompt-input [OPTIONS] [PROMPT]        # -i, --image <FILE>...: images for the prompt
```
All take Common. `prompt-input` renders the model-visible prompt input list as JSON.

```
codex app [OPTIONS] [PATH]        # --download-url <DOWNLOAD_URL_OVERRIDE>; PATH default "."
codex completion [OPTIONS] [SHELL]  # bash (default), elvish, fish, powershell, zsh
codex update [OPTIONS]
```
All take Common only beyond what is shown.

### Hidden internal subcommands

Not listed by `codex --help`; found by probing names (L).

```
codex responses-api-proxy [OPTIONS]
codex stdio-to-uds [OPTIONS] <SOCKET_PATH>
```
- `responses-api-proxy` ("Internal: run the responses API proxy"): Common, plus `--port <PORT>` (ephemeral if unset), `--server-info <FILE>` (write startup JSON with the port), `--http-shutdown` (enable `GET /shutdown`), `--upstream-url <UPSTREAM_URL>` (default `https://api.openai.com/v1/responses`), `--dump-dir <DIR>` (request/response dumps), `--github-oidc` (authenticate with GitHub Actions workload identity; stdin carries the OIDC request token), `--oidc-audience <AUDIENCE>`, `--identity-provider-id <ID>`, `--service-account-id <ID>`, `--github-oidc-request-url <URL>`.
- `stdio-to-uds` ("Internal: relay stdio to a Unix domain socket"): Common only.
- Probed and absent (fall through to top-level help): `mcp-server`, `proto`, `tui`, `chat`, `serve`, `linux-sandbox`, `windows-sandbox`, `seatbelt`, `landlock`, `sessions`, `history`.

### Feature flags

`codex.exe features list` on 0.166.0 (L). The third column is the effective state; it matched the default exactly when rerun with `CODEX_HOME` pointed at an empty directory, so this column is the default. 194 flags: 58 stable, 4 experimental, 82 under development, 3 deprecated, 47 removed. A `removed` flag reporting `true` has graduated into always-on behaviour (I).

| Name | Stage | Default |
|---|---|---|
| `agent_message_board` | under development | false |
| `analytics_plan_history` | experimental | false |
| `api_key_cyber_access_programs` | stable | true |
| `api_key_model_discovery` | stable | true |
| `app_server_websocket_compression` | under development | false |
| `apply_patch_freeform` | removed | false |
| `apply_patch_preserve_line_endings` | removed | false |
| `apply_patch_streaming_events` | under development | false |
| `apps` | stable | true |
| `apps_mcp_path_override` | removed | false |
| `artifact` | under development | false |
| `async_compaction` | under development | false |
| `auth_elicitation` | stable | true |
| `background_paginated_rollout_migration` | under development | false |
| `bedrock_setup_wizard` | stable | true |
| `browser_annotation_api` | stable | true |
| `browser_use` | stable | true |
| `browser_use_external` | stable | true |
| `browser_use_full_cdp_access` | stable | true |
| `chronicle` | under development | false |
| `cli_daybreak` | stable | true |
| `code_mode` | under development | false |
| `code_mode_buffered_exec` | removed | false |
| `code_mode_host` | stable | true |
| `code_mode_host_grpc` | under development | false |
| `code_mode_interrupt` | stable | true |
| `code_mode_only` | under development | false |
| `code_mode_only_strict_3p_tools` | under development | false |
| `code_mode_prewarm` | under development | false |
| `code_mode_tool_description_first` | removed | false |
| `code_mode_tool_search` | under development | false |
| `codex_apps_mcp_2026_07_28` | under development | false |
| `codex_git_commit` | removed | false |
| `collaboration_modes` | removed | true |
| `compaction_image_budget` | stable | true |
| `computer_use` | stable | true |
| `concurrent_reasoning_summaries` | under development | false |
| `content_item_kinds` | stable | true |
| `context_management` | under development | false |
| `credential_masking` | under development | false |
| `critical_path_timing` | under development | false |
| `current_time_reminder` | under development | false |
| `cwd_relative_turn_diffs` | under development | false |
| `daemon_auto_start` | stable | true |
| `default_mode_request_user_input` | under development | false |
| `defer_mailbox_preemption` | under development | false |
| `deferred_executor` | under development | false |
| `deferred_tool_world_state` | under development | false |
| `elevated_windows_sandbox` | removed | false |
| `enable_fanout` | removed | false |
| `enable_mcp_apps` | under development | false |
| `enable_request_compression` | stable | true |
| `exec_permission_approvals` | under development | false |
| `executed_tool_call_metadata` | under development | false |
| `executor_capability_discovery` | under development | false |
| `executor_capability_discovery_v2` | under development | false |
| `experimental_windows_sandbox` | removed | false |
| `external_agent_memory_import` | under development | false |
| `external_migration` | removed | false |
| `fast_mode` | stable | true |
| `goals` | stable | true |
| `guardian_approval` | stable | true |
| `guardian_conversation_history_tools` | under development | false |
| `guardian_enhanced_node_repl_transcripts` | under development | false |
| `guardian_ext` | removed | false |
| `guardian_native_multi_agent_history` | under development | false |
| `guardian_node_repl_transcript_images` | under development | false |
| `guardian_recorded_items` | under development | false |
| `guardian_reuse_parent_compaction` | stable | true |
| `guardian_root_handoff_context` | under development | false |
| `guardian_trust_orchestrator_connectors` | under development | false |
| `guardianv2` | under development | false |
| `guardianv2.thread_context` | removed | false |
| `guardianv2_decisions_comparison` | under development | false |
| `guardianv3` | under development | false |
| `hooks` | stable | true |
| `image_detail_original` | removed | false |
| `image_generation` | stable | true |
| `image_resize_notice` | under development | false |
| `in_app_browser` | stable | true |
| `in_app_chat` | stable | true |
| `in_app_dictation` | stable | true |
| `in_app_local_automation` | stable | true |
| `in_app_updates` | stable | true |
| `in_app_voice` | stable | true |
| `incremental_tools` | stable | true |
| `instant_interrupt` | under development | true |
| `item_ids` | removed | true |
| `js_repl` | removed | false |
| `js_repl_tools_only` | removed | false |
| `local_thread_store_compression` | under development | false |
| `local_thread_store_shared_compression` | removed | false |
| `login_shell_package_path` | experimental | false |
| `mcp_2026_07_28` | under development | false |
| `mcp_connection_sharing` | under development | false |
| `mcp_oauth_refresh_coordination` | stable | true |
| `mcp_tool_list_changed` | under development | false |
| `memories` | stable | false |
| `mentions_v2` | stable | true |
| `model_catalog_in_context` | under development | false |
| `multi_agent` | stable | true |
| `multi_agent_mode` | removed | false |
| `multi_agent_v2` | stable | false |
| `multi_agent_v2_dynamic_tools` | under development | false |
| `multi_env_copy_file` | under development | false |
| `network_proxy` | experimental | false |
| `non_prefixed_mcp_tool_names` | under development | false |
| `nonfatal_clock_read_errors` | under development | false |
| `omit_app_server_notification_media` | under development | false |
| `omit_skill_descriptions` | under development | false |
| `output_token_replay` | under development | false |
| `personality` | removed | false |
| `plugin_discovery_prefetch` | stable | true |
| `plugin_hooks` | removed | false |
| `plugin_sharing` | stable | true |
| `plugins` | stable | true |
| `powershell_shell_version` | under development | false |
| `prediction_preserve_parent_tools` | stable | true |
| `prefer_mxc` | under development | false |
| `prevent_idle_sleep` | experimental | false |
| `psp` | under development | false |
| `realtime_conversation` | removed | true |
| `reasoning_effort_override` | stable | true |
| `recommended_plugins` | stable | false |
| `remote_compaction_v2` | removed | false |
| `remote_control` | removed | false |
| `remote_models` | removed | false |
| `remote_plugin` | stable | true |
| `request_permissions_tool` | under development | false |
| `request_rule` | removed | false |
| `resize_all_images` | removed | true |
| `respect_system_proxy` | under development | false |
| `responses_websockets` | removed | false |
| `responses_websockets_v2` | removed | false |
| `retain_client_developer_messages` | under development | false |
| `retain_client_tool_outputs` | under development | false |
| `rollout_budget` | under development | false |
| `runtime_agent_instances` | under development | false |
| `runtime_metrics` | under development | false |
| `search_tool` | removed | false |
| `secret_auth_storage` | stable | true |
| `send_async_message` | removed | false |
| `send_message_to_user_async` | under development | false |
| `shell_snapshot` | stable | true |
| `shell_snapshot_v2` | under development | false |
| `shell_tool` | stable | true |
| `shell_zsh_fork` | removed | false |
| `simplified_selection_hints` | under development | false |
| `skill_catalog_deltas` | under development | false |
| `skill_env_var_dependency_prompt` | removed | false |
| `skill_mcp_dependency_install` | stable | true |
| `skill_search` | stable | true |
| `skip_host_skill_discovery` | under development | false |
| `sleep_tool` | stable | true |
| `sqlite` | removed | true |
| `stable_environment_tools` | removed | false |
| `standalone_web_search` | under development | false |
| `steer` | removed | true |
| `step_model_switching` | under development | false |
| `subagent_default_context_limits` | under development | false |
| `subagent_thread_environments` | under development | false |
| `system_proxy_fallback` | stable | true |
| `terminal_resize_reflow` | removed | true |
| `terminal_visualization_instructions` | under development | false |
| `token_budget` | under development | false |
| `tool_call_mcp_elicitation` | stable | true |
| `tool_search` | removed | false |
| `tool_search_always_defer_mcp_tools` | removed | true |
| `tool_suggest` | stable | true |
| `transcript_v2` | removed | false |
| `tui_app_server` | removed | true |
| `tui_multi_backend` | under development | false |
| `ultrafast_mode` | stable | true |
| `unavailable_dummy_tools` | removed | false |
| `unbounded_connection_retries` | stable | true |
| `undo` | removed | false |
| `unified_exec` | stable | true |
| `unified_exec_tty` | stable | true |
| `unified_exec_zsh_fork` | removed | false |
| `unified_image_budget` | under development | false |
| `untrusted_as_tool_output` | under development | false |
| `use_agent_identity` | under development | false |
| `use_legacy_landlock` | deprecated | false |
| `use_linux_sandbox_bwrap` | removed | false |
| `use_xaa` | under development | false |
| `view_image` | stable | true |
| `wake_on_agent_messages` | under development | false |
| `web_search_cached` | deprecated | false |
| `web_search_request` | deprecated | false |
| `windows_sandbox_service` | under development | false |
| `workspace_dependencies` | stable | true |
| `workspace_owner_usage_nudge` | removed | false |
| `worktrees` | removed | true |
| `write_stdin_approval` | stable | true |

## In-session commands

TUI slash commands from the [CLI slash-command page](https://learn.chatgpt.com/docs/cli/slash-commands/) (D); none were typed into a live session here. The desktop app and IDE composers are documented with a shorter list: `/feedback`, `/goal`, `/init`, `/mcp`, `/plan`, `/review`, `/status` ([app](https://learn.chatgpt.com/docs/developer-commands?surface=app), [IDE](https://learn.chatgpt.com/docs/ide/)) (D). Commands can be queued while a turn runs (D).

| Command | Meaning | TUI | App | IDE |
|---|---|---|---|---|
| `/permissions` | change what Codex can do without asking | ✓ | ? | ? |
| `/approve` | retry a recent auto-review denial once | ✓ | ? | ? |
| `/setup-default-sandbox` | set up the elevated Windows sandbox | ✓ | ? | ? |
| `/model` | choose model and reasoning effort | ✓ | ? | ? |
| `/fast` | toggle the Fast service tier | ✓ | ? | ? |
| `/plan` | switch to plan mode, optionally with a prompt | ✓ | ✓ | ✓ |
| `/goal` | set, edit, pause, resume, view or clear a task goal | ✓ | ✓ | ✓ |
| `/review` | review the working tree | ✓ | ✓ | ✓ |
| `/status` | session config and token usage | ✓ | ✓ | ✓ |
| `/usage` | account token usage, rate-limit reset | ✓ | ? | ? |
| `/init` | scaffold `AGENTS.md` | ✓ | ✓ | ✓ |
| `/mcp` | list MCP tools (`verbose` for details) | ✓ | ✓ | ✓ |
| `/feedback` | send logs to maintainers | ✓ | ✓ | ✓ |
| `/agents` | agent command center | ✓ | ? | ? |
| `/subagents` | switch the active subagent thread | ✓ | ? | ? |
| `/skills` | browse and use skills | ✓ | ? | ? |
| `/plugins` | browse plugins | ✓ | ? | ? |
| `/apps` | browse apps and insert into the prompt | ✓ | ? | ? |
| `/hooks` | view and manage lifecycle hooks | ✓ | ? | ? |
| `/memories` | configure memory use and generation | ✓ | ? | ? |
| `/experimental` | toggle experimental features | ✓ | ? | ? |
| `/debug-config` | config layer and requirements diagnostics | ✓ | ? | ? |
| `/ide` | include IDE context in the next prompt | ✓ | ? | ? |
| `/mention` | attach a file or folder | ✓ | ? | ? |
| `/import` | import Claude Code or Cursor setup and chats | ✓ | ? | ? |
| `/new` | new chat in the same CLI session | ✓ | ? | ? |
| `/clear` | clear terminal and start a fresh chat | ✓ | ? | ? |
| `/resume` | resume a saved chat | ✓ | ? | ? |
| `/fork` | fork the current chat | ✓ | ? | ? |
| `/side`, `/btw` | ephemeral side chat | ✓ | ? | ? |
| `/worktree` | start or continue in a managed worktree | ✓ | ? | ? |
| `/cd` | change working directory | ✓ | ? | ? |
| `/pwd`, `/cwd` | show working directory | ✓ | ? | ? |
| `/app` | continue this session in the desktop app | ✓ | ✗ | ✗ |
| `/daemon` | background server controls | ✓ | ? | ? |
| `/ps` | background terminals and output | ✓ | ? | ? |
| `/stop`, `/clean` | stop all background terminals | ✓ | ? | ? |
| `/compact` | summarize the chat to free tokens | ✓ | ? | ? |
| `/recap` | summarize the conversation | ✓ | ? | ? |
| `/export` | export the conversation as Markdown | ✓ | ? | ? |
| `/copy` | copy the latest output | ✓ | ? | ? |
| `/diff` | Git diff including untracked files | ✓ | ? | ? |
| `/rename` | rename the chat | ✓ | ? | ? |
| `/archive` | archive the session | ✓ | ? | ? |
| `/delete` | permanently delete the session | ✓ | ? | ? |
| `/warnings` | retained warnings and diagnostics | ✓ | ? | ? |
| `/statusline` | footer status-line items | ✓ | ? | ? |
| `/title` | terminal title items | ✓ | ? | ? |
| `/theme` | syntax-highlighting theme | ✓ | ? | ? |
| `/keymap` | remap TUI shortcuts | ✓ | ? | ? |
| `/vim` | toggle Vim mode | ✓ | ? | ? |
| `/raw` | toggle raw scrollback | ✓ | ? | ? |
| `/tui` | scrollback or fullscreen mode for next launch | ✓ | ? | ? |
| `/pets`, `/pet` | terminal pet | ✓ | ? | ? |
| `/logout` | sign out | ✓ | ? | ? |
| `/exit`, `/quit` | exit | ✓ | ✗ | ✗ |

`/app` and `/exit` are marked ✗ outside the TUI by inference (they act on the terminal session).

## Settings and environment

**Files** (L: listing of `~/.codex`, names only; contents of `auth.json` not read):

| Path | What |
|---|---|
| `~/.codex/config.toml` | user config; `-c` overrides per run. Holds `[agents]`, `[desktop]`, `[features]`, `[hooks.state]`, `[marketplaces.*]`, `[mcp_servers.*]`, `[plugins.*]`, `[projects.*]` tables here (L) |
| `$CODEX_HOME/<name>.config.toml` | profile layered by `-p <name>` (L: help) |
| `.codex/config.toml` | project config, loaded only for trusted projects; ignores `model_provider(s)`, `notify`, `profile(s)`, `otel` and a few base URLs (D: config ref) |
| `requirements.toml` | managed requirements (D: named, path not given) |
| `~/.codex/AGENTS.md` | global instructions, merged with repo `AGENTS.md` (L: exists; D per harnesses.md) |
| `~/.codex/hooks.json` | hook definitions; trust state is kept in `config.toml` `[hooks.state]` (L) |
| `~/.codex/skills/` | user skill root (L) |
| `~/.codex/rules/` | execpolicy `.rules` (L: dir exists; `--ignore-rules` skips them) |
| `~/.codex/sessions/`, `archived_sessions/`, `session_index.jsonl` | session rollouts (L) |
| `~/.codex/worktrees/` | managed worktrees (L) |
| `~/.codex/auth.json` | credentials: never print (L: exists) |
| `~/.codex/app-server-daemon/`, `app-server-control/` | shared daemon state (L) |

**Keys an orchestrator is likely to need** (D: [config reference](https://learn.chatgpt.com/docs/config-file/config-reference)):

- `model`, `model_reasoning_effort` (`low`, `medium`, `high`, `xhigh`, `max`, `ultra`, model-dependent), `plan_mode_reasoning_effort`.
- `approval_policy`: `on-request`, `never`, or `{ granular = { sandbox_approval, rules, mcp_elicitations, request_permissions, skill_approval } }`; `untrusted` unsupported, `on-failure` deprecated. `approvals_reviewer`: `user` or `auto_review`.
- `sandbox_mode`: `read-only`, `workspace-write`, `danger-full-access`. `sandbox_workspace_write.network_access`, `.writable_roots`, `.exclude_slash_tmp`, `.exclude_tmpdir_env_var`. `default_permissions` (`:read-only`, `:workspace`, `:danger-full-access`; not with `sandbox_mode`), `permissions.<name>.*`.
- `agents.enabled`, `agents.max_concurrent_threads_per_session` (legacy `agents.max_threads`), `agents.default_subagent_model`, `agents.default_subagent_reasoning_effort`, `agents.<name>.description`, `agents.<name>.config_file`.
- `mcp_servers.<id>.command|args|cwd|env|url|enabled|required|enabled_tools|disabled_tools|startup_timeout_sec|tool_timeout_sec|bearer_token_env_var|default_tools_approval_mode`.
- `features.<name>` (see the table), `hooks.<Event>` (`PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `Stop`, `UserPromptSubmit`), `notify` (user-level command array).
- `skills.config` (`{ path, enabled }`), `skills.max_context_tokens` (max 10000).
- `project_doc_fallback_filenames`, `project_doc_max_bytes`, `project_root_markers`, `model_instructions_file`, `developer_instructions`.
- `shell_environment_policy.inherit` (`all`, `core`, `none`), `.filters`, `.set`, `.ignore_default_excludes`.
- `history.persistence` (`save-all`, `none`), `sqlite_home`, `log_dir`, `projects.<path>.trust_level` (`trusted`, `untrusted`).

**Environment variables:**

- `CODEX_HOME`: config and state root, default `~/.codex` (L: help text for `-p`, `--ignore-user-config`; probe with an empty `CODEX_HOME` worked).
- `OPENAI_API_KEY`: piped to `codex login --with-api-key` (L: help example).
- `CODEX_ACCESS_TOKEN`: piped to `codex login --with-access-token`; read by `exec-server --use-agent-identity-auth` (L: help).
- Any name given to `--remote-auth-token-env` or `mcp add --bearer-token-env-var` (L).
- `CODEX_SHELL`: set in the app's command environment (per harnesses.md; not re-checked here).

## Couldn't verify

- **Shim.** The task reported the bun shim `codex` as broken. In this session all three PATH entries (`~/.bun/bin/codex` bash script that runs `node .../@openai/codex/bin/codex.js`, `codex.cmd`, `codex.exe`) resolved, and `codex --version` and `codex --help` matched the vendored binary (0.166.0, hash `c45272069305`). `~/.bun/bin/codex.exe` is the same size as the vendored binary and dated 2026-10-31 07:08 against 07:02, so it may have been copied in as a repair. Only `--version` and `--help` were tried through the shim.
- **harnesses.md vs local.** harnesses.md says the binary is "a `.ps1` shim via fnm", probed 0.163.0. Locally it is a bun global install at 0.166.0; `~/.codex/version.json` last recorded `latest_version` 0.163.0 (checked 2026-10-20). Both recorded; trust the install.
- **Approval values.** Local `-a` prints only `on-request` and `never`, and `codex exec` rejects `-a`. Older guides use `untrusted` and `on-failure`; the config reference calls them unsupported and deprecated. Not tested whether `-c approval_policy=...` with a granular table works headless.
- **Hidden aliases.** `--yolo` and `--not-so-yolo` parse on `exec`, `resume` and the root (L) and are in the docs (D) but not in `--help`. `--full-auto` is rejected (L). Docs say `--approve-for-me` conflicts with `--sandbox` and `--yolo`; not tested.
- **Cloud.** Docs give `--attempts` as 1-4; local help says only "default: 1". No cloud task was started, so `cloud` behaviour, environments and `apply` are help-text only.
- **Desktop app.** Installed (MSIX 26.1027.3384.0) but not launched; `codex app` not run. Docs say on Windows it prints the path to open. App slash commands and settings are D only.
- **IDE extension.** Not installed; everything about it is D.
- **TUI.** No session was started, so slash commands, keybindings and the daemon attach behaviour are D or inferred from help.
- **Sandbox per platform.** This Windows build's `codex sandbox` help names the Windows restricted-token sandbox; docs list macOS-only `--allow-unix-socket` and `--log-denials`, absent here (I: platform-gated builds).
- **Session-management flags.** `archive`, `unarchive` and `delete` print the full Session flag set (`-m`, `-i`, `-s`, ...); whether they do anything there is unknown.
- **app-server protocol.** Not exercised; `generate-ts` and `generate-json-schema` were not run (they write files). The claim that the TUI, app and IDE all drive app-server is inferred.
- **Hidden subcommands.** Found by guessing names; others may exist. `execpolicy` is documented (experimental); `responses-api-proxy` and `stdio-to-uds` appear in no doc read.
- **Docs pages read in part.** The CLI reference and config reference pages were longer than one fetch; the CLI page was read in full over two fetches, the config reference only to about 100,000 of 156,888 characters. The environment-variables page was not read.

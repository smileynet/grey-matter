# OpenCode 2.0 breaking changes research (2026-11-25)

Question: what changed in OpenCode 2.0 (current `v2.4.1`) compared with our recorded V1 baseline (`1.18.21` in [harnesses.md](../harnesses.md); `1.19.6` installed locally), and which `grey-matter` and `tkt` skills, plugins, scripts, and docs break or gain new capabilities?

Companion proposal: [24-opencode-v2-upgrade-path.md](../proposals/24-opencode-v2-upgrade-path.md).

## Release timeline and version status

- **Current V2 release:** `v2.4.1` (`2026-11-23T15:57:40Z`, non-prerelease) on `anomalyco/opencode` (inspected at tag `v2.4.1` and `dev`). Confidence: **high**.
- **Current V1 release (still marked GitHub `Latest`):** `v1.19.6` (`2026-11-17T07:21:32Z`), matching locally installed `~/.opencode/bin/opencode`. Its release notes introduce opt-in Desktop upgrades to 2.0:
  > "OpenCode 1 now offers the upgrade to OpenCode 2.0. OpenCode 2 downloads in the background and installs only when you choose: Restart to upgrade, Upgrade on quit, or Later. Your sessions, projects, and settings are kept. Plugins made for OpenCode 1 need an update."
  > — `anomalyco/opencode` GitHub Release `v1.19.6` (2026-11-17)
- **V2 tag cadence:** `v2.0.0` (`2026-09-11`), `v2.0.26` (`2026-10-08`, first `CHANGELOG.md` entry), `v2.1.0` (`2026-10-20`), `v2.2.0` (`2026-10-27`, first V2 GitHub Release object), `v2.2.1` (`2026-10-29`), `v2.2.3` (`2026-10-30`), `v2.2.7` (`2026-11-10`), `v2.3.0` (`2026-11-13`), `v2.4.0` (`2026-11-23`), `v2.4.1` (`2026-11-23`).
- **Installer and package changes** (`anomalyco/opencode@v2.4.1`: `services/site/src/docs/content/index.mdx`, `migrate-v1.mdx`, `packages/cli/package.json`). Confidence: **high**.
  > "OpenCode 1 and OpenCode 2 both use the `opencode` command and are no longer installed side by side by default. Remove a package-managed V1 installation before installing V2; the V2 curl installer replaces the V1 binary."
  - Install routes: `curl -fsSL https://opencode.ai/v2/install | bash`, `brew install anomalyco/tap/opencode-v2`, `npm install -g @opencode/cli` (ships `opencode` and `opencode2` bins), `mise use -g opencode` (requires `mise >= 2026.10.9`; older mise installs V1).
  - `"Windows package managers are not supported."` (WinGet path currently recorded in [versions.json](../harness-surfaces/versions.json) is obsolete for V2.)

## Verified breaking changes (V1 -> V2.4.1)

### 1. Headline breaking changes

Source: `anomalyco/opencode@v2.4.1`, `services/site/src/docs/content/migrate-v1.mdx` (2026-11-23). Confidence: **high**.

> "V2 has three intentional breaking changes:
> - Plugins use a new plugin API.
> - The server API and clients have new contracts.
> - Terminal client configuration moves from layered `tui.json(c)` files to one global `cli.json` file (auto-migrated)."

### 2. CLI commands, flags, and session export schema

Baseline: local `opencode 1.19.6 --help` / `run --help` / `export --help` vs `anomalyco/opencode@v2.4.1` `packages/cli/src/commands/commands.ts`, `packages/cli/src/commands/handlers/run.ts`, `packages/schema/src/session-transfer.ts`, `packages/schema/src/session-message.ts`, `packages/schema/src/model.ts`. Confidence: **high**.

1. **`opencode run --variant` removed**; reasoning variant is folded into `-m provider/model#variant`:
   > `model: Flag.String("model").pipe(Flag.withAlias("m"), Flag.withDescription("Model to use in the format provider/model#variant"), Flag.optional)`
   > — `packages/cli/src/commands/commands.ts:450-454` (`v2.4.1`)
2. **Top-level `opencode export` and `opencode import` removed** — moved under `opencode session export [session] [--sanitize]` and `opencode session import <file> [--directory <dir>]` (`commands.ts:476-525`).
3. **Exported session JSON schema replaced:**
   - V1 (parsed by [probe-critic-model.mjs](../../../scripts/probe-critic-model.mjs)): `messages[].info.{role, providerID, modelID, variant}`.
   - V2 (`packages/schema/src/session-transfer.ts:8-11`, `session-message.ts:223-229`, `model.ts:20-24`):
     > `export const Data = Schema.Struct({ info: Session.Info, messages: Schema.Array(SessionMessage.Info) })`
     > `export const Assistant = Schema.Struct({ ...Base, type: Schema.tag("assistant"), agent: Agent.ID, model: Model.Ref, content: AssistantContent.pipe(Schema.Array), ... })`
     > `export const Ref = Schema.Struct({ id: ID, providerID: Provider.ID, variant: VariantID.pipe(optional) })`
   - No `.info` wrapper; discriminant is `type: "assistant"` (not `role: "assistant"`); model fields live at `message.model.{providerID, id, variant}`.
   - `opencode run --format json` still emits top-level `sessionID` (`packages/cli/src/run/noninteractive.ts:370`).
4. **Daemon-sharing gotcha for `opencode run`:**
   - `packages/cli/src/commands/handlers/run.ts:9`: `"A one-off run uses the background service when it is already up, but never leaves a new one running"`.
   - `services/site/src/docs/content/cli/commands.mdx`: `"In CI, pass a provider API key as a secret and use standalone mode so the private server receives it."` Pass `--standalone` in isolated/CI probes.
5. **Other CLI command/flag removals (`1.19.6` -> `v2.4.1` `commands.ts`):**
   - Removed top-level commands: `completion`, `attach` (now global `--server <url>`), `providers` (into `auth`), `agent` (use `debug agents`), `web` (into `serve`/`pair`/`service`), `github` (GitHub Action removed in `v2.2.0`, `#59032`), `pr`, `db`, and **`opencode debug skill`** (only `debug agents|config|heap-dump|paths` remain).
   - Redesigned: `opencode plugin <module>` -> `opencode plugin {list, add, check, update, remove}` (`list --builtin`, npm/git specifiers).
   - Added: `service {start, restart, status, stop, get, set, unset}`, `api`, `pair`, `machine`, `reload`, `mini`.
   - Removed from `run`: `--variant`, `--attach`, `--port`, `-p/--password`, `-u/--username`, `--dir`, `--command`, `--pure`, `--log-level` (now `OPENCODE_LOG_LEVEL`), `-i/--interactive`.
   - Server auth (`migrate-v1.mdx:624-625`): `"OPENCODE_SERVER_USERNAME is no longer supported. The username is always opencode."`

### 3. Skills (discovery, frontmatter, invocation policy)

Sources: `anomalyco/opencode@v2.4.1` `services/site/src/docs/content/skills.mdx`, `migrate-v1.mdx`, `packages/core/src/config/plugin/{skill-file.ts,skill-scan.ts,skill.ts}`, `packages/core/src/tool/plugin/skill.ts` (2026-11-23). Confidence: **high**.

1. **Discovery paths unchanged:**
   > "Existing skill files and automatic `.opencode/skills/` discovery do not change." (`migrate-v1.mdx:322`)
   - User roots: `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`.
   - Project roots: `.opencode/skills`, `.claude/skills`, `.agents/skills` (plus legacy singular `skill/` in `config/plugin/skill.ts:91-92`).
   - System-wide (new): `/etc/opencode/skills` (Linux), `/Library/Application Support/opencode/skills` (macOS), `%ProgramData%\opencode\skills` (Windows).
   - Supports nested grouping dirs up to `MAX_DEPTH = 6` (`skill-scan.ts:7`); skill ID comes from the immediate parent folder name, while frontmatter `name` is display-only (`skill-file.ts:44-48`).
2. **New native invocation policy enforcement (`disable-model-invocation` & `metadata.opencode/autoinvoke`):**
   > "`metadata.opencode/autoinvoke` | Set to `false` to omit the skill from the model's available list"
   > "`disable-model-invocation` | Set to `true` for the same effect as `opencode/autoinvoke: false`"
   > "When both `disable-model-invocation` and `opencode/autoinvoke` are set, `opencode/autoinvoke` wins." (`skills.mdx`)
   - Confirmed in code (`packages/core/src/config/plugin/skill-file.ts:49-51`):
     ```ts
     const opencodeAutoinvoke = metadataBoolean(frontmatter.metadata, "opencode/autoinvoke")
     const disableModelInvocation = booleanValue(frontmatter["disable-model-invocation"])
     const autoinvoke = opencodeAutoinvoke ?? (disableModelInvocation ? false : undefined)
     ```
   - Directly invalidates the blanket statement in [skill-frontmatter.md](../skill-frontmatter.md) that `"no harness reads [metadata] to function. It is inert storage."`
   - User-triggered loading uses `@skill-id` in the prompt (`skills.mdx`).
3. **Config `skills` schema simplified:** V1 `{ "skills": { "paths": [...], "urls": [...] } }` -> V2 `{ "skills": ["./team-skills", "https://..."] }` (V1 still normalized in memory, `migrate-v1.mdx:305-320`).
4. **Runtime tool & plugin registration:** `skill` tool takes `{ id }` (`codemode: false`, direct tool, `tool/plugin/skill.ts:12`); V2 plugins can register skills programmatically via `ctx.skill.transform((editor) => editor.add(...))` (`plugin/skill.ts:27-46`).
5. **Skill edits no longer trigger full config reload (`v2.4.0`, `#62158`):** `"Config now reloads only when a file that feeds it changes, not on every write under .opencode such as editing a skill."`

### 4. Plugins (complete breaking rewrite)

Sources: `anomalyco/opencode@v2.4.1` `services/site/src/docs/content/build/plugins/{migrate-v1.mdx,index.mdx}`, `plugins.mdx`, `CHANGELOG.md` (2026-11-23). Confidence: **high**.

- **V1 plugins do not run in V2:**
  > "V1 plugin implementations do not run in V2. Moving a file or renaming its config entry is not enough." (`build/plugins/migrate-v1.mdx:16`)
- **Packages:** `@opencode-ai/plugin` -> `@opencode/plugin` (`./tui`, `./gui-experimental`, `./rpc`, `./effect/plugin`); `@opencode-ai/sdk` -> `@opencode/client` and `@opencode/sdk`.
- **Entrypoint:** Async function returning hook map -> `export default Plugin.define({ id: "...", async setup(ctx) { ... return () => cleanup() } })`. Temporary dual V1/V2 export (`{ ...Plugin.define(...), async server() {} }`) requires V1 `>= 1.18.29`.
- **Config & local path breakage:** `plugin` -> `plugins`; tuple `["./plugin/local.ts", opts]` -> `{ "package": "./plugin/local", "options": opts }`. **Configured local paths must name directories** (`./plugin/local/index.ts`; a configured `.ts` file is skipped with a warning, `build/plugins/migrate-v1.mdx:45-46`). Auto-discovered `.opencode/plugins/*.ts` still loads (`plugins.mdx:52`).
- **Context, hooks, tools, events replaced:**
  - `client` and `$` Bun shell helper removed; replaced by domain APIs (`ctx.session`, `ctx.permission`, `ctx.agent`, `ctx.skill`, `ctx.tool`, `ctx.storage`, etc.).
  - String hook keys (`"tool.execute.before"`, `"shell.env"`, `"chat.params"`, `"permission.ask"`) -> domain registrations (`ctx.tool.hook("execute.before", ...)`, `ctx.shell.hook("create.before", ...)`, `ctx.session.hook("context" | "prompt" | "model.request" | "http.request" | "compaction", ...)`, `ctx.permission.hook("evaluate", ...)`).
  - No 1-to-1 replacement for `command.execute.before`, `experimental.compaction.autocontinue`, `experimental.provider.small_model`, or `experimental.text.complete`.
  - Tools: `tool()` + Zod -> synchronous `ctx.tool.transform((editor) => editor.add({ name, description, input: <JSON Schema>, execute }))`.
  - Events: `event` callback -> `for await (const event of ctx.event.subscribe({ signal }))`.
- **Auto-updates (`v2.4.0`, `#64764`):** `name@latest`, semver ranges, Git branches, and Git `semver:` ranges auto-check on startup + every 24h and hot-reload. Exact versions, bare names, `@next`, Git tags, and commit SHAs stay pinned until `opencode plugin update`.
- **OpenTUI peer churn:** Bumped `0.7` (`v2.2.0`) -> `0.8` (`v2.2.3`) -> `0.9.4` + `registerCodeBlockRenderer` signature break (`v2.4.0`), relaxed to `>=0.8.0` in `v2.4.1` (`#65819`).

### 5. Instructions (`AGENTS.md` and `CLAUDE.md` fallback)

Sources: `anomalyco/opencode@v2.4.1` `instructions.mdx`, `migrate-v1.mdx`, `packages/core/src/config/plugin/instruction.ts` (2026-11-23). Confidence: **high**.

- Global path unchanged: `~/.config/opencode/AGENTS.md` (`instruction.ts:41`).
- **Per-directory fallback change (`migrate-v1.mdx:561-565`):**
  > "V2 keeps the V1 `CLAUDE.md` fallback: a directory without `AGENTS.md` uses its `CLAUDE.md`, and `~/.claude/CLAUDE.md` stands in for a missing global `AGENTS.md`. `OPENCODE_DISABLE_CLAUDE_CODE` skips every `CLAUDE.md`, and so does `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT`, which in V1 skipped only `~/.claude/CLAUDE.md`. Unlike V1, which stopped at the first file name found anywhere up the tree, V2 picks per directory, so an `AGENTS.md` at the root no longer hides a nested `CLAUDE.md`."
- Edits to global or upward-discovered `AGENTS.md` now inject live before the next model step (`instructions.mdx`).

### 6. Tools, permissions, agents, commands, MCP, config, and runtime

Sources: `anomalyco/opencode@v2.4.1` `migrate-v1.mdx`, `permissions.mdx`, `agents.mdx`, `tools.mdx`, `mcp-servers.mdx`, `packages/core/src/shell/select.ts`, `CHANGELOG.md` (2026-11-23). Confidence: **high**.

- **Tool/permission renames:**
  > "Permission actions also changed: `bash` is now `shell`, `task` is now `subagent`, and `write` and `patch` are now `edit`." (`migrate-v1.mdx:129`)
  - V1 `permission` object + `tools` booleans -> V2 ordered `permissions` array `{ action, resource, effect }` (last match wins).
- **Security default flip (`external_directory`):**
  > "V1 asks before accessing paths outside the project. V2 does not: `external_directory` is allowed by default. To keep the V1 behavior, add `{ "action": "external_directory", "resource": "*", "effect": "ask" }` to `permissions`." (`migrate-v1.mdx:144-145`)
- **Subagents always run in background (`tools.mdx`):** returns a `sessionID` immediately; parent receives `<subagent>` messages when child goes idle.
- **LSP removed at runtime (`migrate-v1.mdx:460-461`):** `"V2 accepts and preserves lsp configuration, but it does not run language servers, expose LSP tools, or produce LSP diagnostics."`
- **`todowrite` off by default** unless `"experimental": { "todo": true }`.
- **Code Mode (`execute`) is default for MCP tools** (`mcp-servers.mdx`: `codemode` defaults to `true`). `v2.4.0` renamed `experimental_image_generate` -> `generate_image` and moved `tools.opencode.session_rename` / `.session_move` -> `tools.opencode.session.rename` / `.move`.
- **Terminal config (`migrate-v1.mdx:569-578`):** layered `tui.json(c)` replaced by one global `~/.config/opencode/cli.json`; project-local client configs are not migrated.
- **Agent frontmatter no-mixing trap (`migrate-v1.mdx:513-516`):**
  > "A file that uses any of `permissions`, `request`, `system`, or `disabled` is read as V2, and V1 fields in it, such as `name`, `tools`, `permission`, or `temperature`, are ignored with a warning in the log."
  - Also `request.body` / V1 `temperature` / `top_p` / `options` on agents have no effect; set them on a model variant instead (`migrate-v1.mdx:187-188`).
- **MCP config:** servers move under `mcp.servers`, `enabled` -> inverse `disabled`, `timeout` -> `{ catalog, execution }`, OAuth keys -> snake_case. `v2.4.0` (`#65282`) probes newest MCP protocol first before falling back to legacy.
- **GitHub Copilot (`v2.4.0`, `#64697`):** no longer reads `GITHUB_TOKEN`; requires `COPILOT_GITHUB_TOKEN` or OAuth.
- **`zsh` shell execution change (`packages/core/src/shell/select.ts:176-183`):**
  ```ts
  // zsh aborts the whole line on an unmatched glob; pass it through literally as bash does.
  if (n === "zsh") return ["+o", "nomatch", "-c", command]
  ```
  `NOMATCH` no longer aborts unmatched globs on `zsh` (contradicting our V1 note in [harnesses.md](../harnesses.md)); `=word`, word-splitting, and `~/.zshenv` still apply.
- **Post-2.0 SDK/protocol breaks (`v2.1.0`–`v2.4.0`):** `v2.1.0` unified replay fields under `native`, removed `session.compacted`; `v2.2.0` switched `@opencode/ai` root to Promise API (`@opencode/ai/effect` for Effect) and removed the GitHub Action; `v2.2.3` split managed policy `integration.use` from `mcp.use`/`skill.use`/`plugin.use`; `v2.4.0` stopped blocking SDK startup 5s for plugins (`#63814`) and split assistant parts into separate SQLite rows (`#65039`).

## Impact map for `grey-matter` and `tkt`

### Hard breakages on V2
1. [scripts/probe-critic-model.mjs](../../../scripts/probe-critic-model.mjs) (+ `probe-critic-model-fixtures.mjs`, `probe-critic-model.test.mjs`): passes removed `--variant high`, calls removed top-level `opencode export <sid>`, and parses V1 `messages[].info.{role, providerID, modelID, variant}` instead of V2 `messages[].{type: "assistant", model: {providerID, id, variant}}`. Also lacks `--standalone`.
2. [docs/agents/harnesses.md](../harnesses.md): critic table (line 294) prescribes `--variant high`, `opencode export`, V1 field names, and `task` tool; read-only recipe (line 318) uses V1 `permission.edit: deny` and omits V2's default-allow `external_directory`; shell note (line 241) still claims `zsh` `NOMATCH` aborts globs.
3. [docs/agents/harness-surfaces/crush-opencode.md](../harness-surfaces/crush-opencode.md) and [docs/agents/harness-surfaces/versions.json](../harness-surfaces/versions.json): V1.18.21 CLI grammar is largely obsolete; WinGet install path in `versions.json` is unsupported on V2.

### New capabilities and doc drift
1. [docs/agents/skill-frontmatter.md](../skill-frontmatter.md): OpenCode V2 now enforces `disable-model-invocation: true` (and `metadata.opencode/autoinvoke: false`), so our user-invoked skills gain native invocation filtering in OpenCode V2 without skill edits, and the "metadata is never read by any harness" claim must be narrowed.
2. [skills/engineering/code-review/references/visual-critics.md](../../../skills/engineering/code-review/references/visual-critics.md): cites V1 `packages/opencode/src/tool/read.ts` (moved to `packages/core` in V2).

### Verified safe / unchanged
- [scripts/deploy.mjs](../../../scripts/deploy.mjs) and `tkt/tools/deploy.mjs`: `opencode` `HARNESSES()` entry (`~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`; project `.opencode`, `.claude`, `.agents`) is 100% compatible with V2.4.1.
- [scripts/install-agents-md.mjs](../../../scripts/install-agents-md.mjs): `~/.config/opencode/AGENTS.md` is unchanged in V2.4.1.
- [scripts/check-guidance.mjs](../../../scripts/check-guidance.mjs): skill root checks remain accurate.
- All 50 `grey-matter` `SKILL.md` files and all 4 `tkt` `SKILL.md` files: no broken V1 OpenCode plugin code or CLI commands embedded; frontmatter and `references/` remain natively compatible.

## Couldn't verify

1. **Live runtime behavior of OpenCode `v2.4.1` on this machine:** locally installed binary is `opencode 1.19.6`; all V2 claims were verified against `anomalyco/opencode@v2.4.1` source, schemas, `CHANGELOG.md`, and official MDX docs rather than a live V2 execution. Live probes of `disable-model-invocation: true`, `opencode run -m ...#high --standalone --format json`, and `opencode session export` are required after upgrading the local binary.
2. **Subagent model attribution inside parent `opencode session export`:** verified `task` -> `subagent` returning a child `sessionID` and verified `SessionMessage.Assistant.model`, but did not inspect `packages/core/src/tool/plugin/subagent.ts` to confirm whether parent tool metadata embeds the child's model or requires exporting the child session separately.
3. **MCP default `protocol` doc-vs-changelog mismatch:** `v2.4.0` `CHANGELOG.md` (`#65282`) says newest protocol is probed first before legacy fallback, whereas `mcp-servers.mdx` at `v2.4.1` still labels `legacy (default)`. MCP client source was not read to resolve the discrepancy.
4. **Early `v2.0.0`–`v2.0.25` release notes:** git tags exist from `v2.0.0` (`2026-09-11`), but `CHANGELOG.md` begins at `v2.0.26` and GitHub Release objects begin at `v2.2.0`.

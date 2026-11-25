# Qwen Code (`QwenLM/qwen-code`) plugin and skill compatibility research (2026-11-25)

Question: how do extensions/plugins, Agent Skills, global instructions, and hooks work in Qwen Code, and how should `grey-matter` and `tkt` package plugins for it?

Companion proposal: [25-dsh-and-qwen-plugins.md](../proposals/25-dsh-and-qwen-plugins.md).

## Primary sources inspected

- `QwenLM/qwen-code` tag `v0.28.4` (`2026-11-22T12:04:21Z`, commit `e8424c88ddd463c56602063efde57c328b917cd4`; `@qwen-code/qwen-code@0.28.4` on npm).
- Local packs: `.claude-plugin/{plugin.json,marketplace.json}` (`grey-matter` `0.2.0`, `tkt` `0.4.0`), `tkt/plugin.json`, `tkt/.claude-plugin/{claude-hooks.json,hooks/session-start.mjs}`, [scripts/deploy.mjs](../../../scripts/deploy.mjs), [scripts/install-agents-md.mjs](../../../scripts/install-agents-md.mjs).

## 1. Harness scope

Confidence: **high** (GitHub API, npm registry, and `v0.28.4` source).

- **Qwen Code CLI** (`QwenLM/qwen-code`, `packages/cli` + `packages/core`, `v0.28.4`) is the primary coding-agent harness.
- **Qwen Code Desktop** (`packages/desktop`) is a thin Tauri 2 wrapper around `qwen serve` and the Web Shell (`packages/desktop/README.md`: `"This package is an isolated Tauri 2 shell around the existing Web Shell. It does not contain a second UI."`). IDE companions (`packages/vscode-ide-companion`, `packages/zed-extension`) share the same `~/.qwen/` state.
- **`QwenLM/Qwen-Agent`** is a Python agent framework/SDK (not a coding-agent harness).
- Targeting `~/.qwen/` and `qwen-extension.json` covers Qwen Code CLI, Desktop, Web Shell, VS Code Companion, and Zed at once.

## 2. Extension / plugin system (`v0.28.4`)

Confidence: **high** (source verified in `packages/core/src/extension/`).

### Supported formats and precedence

Source: `packages/core/src/extension/extension-converter.ts:50-96` (`v0.28.4`):
```ts
export const SUPPORTED_EXTENSION_MANIFESTS = [
  EXTENSIONS_CONFIG_FILENAME, // 'qwen-extension.json'
  'gemini-extension.json',
  '.claude-plugin/marketplace.json',
  '.claude-plugin/plugin.json',
  QODER_PLUGIN_MANIFEST,
] as const;
```
Precedence in `convertCompatibleExtension()`:
1. Root `plugin.json` with `"$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json"` (`AgentPlugins`, native — ignores `hooks/`, commands, agents; `docs/users/extension/agent-plugins.md`).
2. Root `qwen-extension.json` (`QwenCode`, native — no conversion).
3. `gemini-extension.json` (converted).
4. Explicit marketplace `<source>:<pluginName>` -> `.claude-plugin/marketplace.json` (converted).
5. `.qoder-plugin/plugin.json` (converted).
6. Standalone `.claude-plugin/plugin.json` (converted).

### Native `qwen-extension.json` schema and source-vs-docs discrepancy

Source: `packages/core/src/extension/extensionManager.ts:206-228, 2003-2034, 2168-2174` (`v0.28.4`):
- Schema fields: `name`, `version`, `displayName`, `description`, `mcpServers`, `lspServers`, `contextFileName`, `commands`, `skills`, `skillStates`, `agents`, `workflows`, `settings`, `hooks`, `channels`.
- Hydrated variables: `${extensionPath}`, `${CLAUDE_PLUGIN_ROOT}` (aliased to `extensionDir`), `${workspacePath}`, `${/}`, `${pathSeparator}`.
- Install state: `~/.qwen/extensions/<name>/` (with `.qwen-extension-install.json`), `~/.qwen/extension-store/state.json` (v2), `~/.qwen/extensions/extension-enablement.json`.
- **CRITICAL SOURCE-VS-DOCS DISCREPANCY:** `docs/users/extension/introduction.md:311-313` documents `config.skills`, `config.commands`, and `config.agents` path overrides, **but `extensionManager.ts:2003-2034` ignores them and hardcodes fixed root subdirectories:**
  ```ts
  loadCommandsFromDir(`${effectiveExtensionPath}/commands`),
  loadSkillsFromDir(`${effectiveExtensionPath}/skills`, onSkillsDiscoveryError),
  loadSubagentFromDir(`${effectiveExtensionPath}/agents`, agentExecutorRefusals),
  loadExtensionWorkflows(effectiveExtensionPath, ..., config.workflows),
  ```
  Only `config.workflows`, `config.contextFileName`, and `config.hooks` honor custom manifest paths. A native Qwen extension **must** place skills directly at `<extRoot>/skills/<skill-name>/SKILL.md` (flat depth 1).

### Install, `link`, and update workflow

- `qwen extensions install <source>` supports local dir, `.zip`/`.tar.gz`, HTTPS archive URL, Git URL / `owner/repo` (tries GitHub Release assets first, then `git clone`/archive), npm `@scope/pkg`, or `<repo>:<pluginName>`. Interactive `/extensions` and `/reload-plugins` hot-reload.
- **`qwen extensions link <path>` (`extensionManager.ts:1849-1858, 2721-2743`):** writes `{"type": "link", "source": "<absPath>"}` into `~/.qwen/extensions/<name>/.qwen-extension-install.json` and loads directly from `source` — requires a native `qwen-extension.json` (or Agent Plugins v1 `plugin.json`) at `source` root; linking a `.claude-plugin/`-only directory fails on reload.

### Three critical gotchas in the Claude Code converter

Sources: `packages/core/src/extension/{claude-converter.ts,variables.ts,extensionManager.ts}` (`v0.28.4`). Confidence: **high**.

1. **`grey-matter`'s 3 skill buckets yield 0 skills:** `claude-converter.ts:966-985` copies `./skills/engineering`, `./skills/productivity`, `./skills/meta` into `skills/<bucket>/<skill>/SKILL.md` (depth 2). `loadSkillsFromDir()` (`skill-load.ts:68`) checks only `<baseDir>/<entry>/SKILL.md` (depth 1) -> **all 50 skills silently missed**.
2. **`.claude` -> `.qwen` rewrite corrupts `.md` files when hooks exist:** `extensionManager.ts:2803-2813` runs `performVariableReplacement()` (`variables.ts:163-168`) across `**/*.md` and `**/*.sh`:
   ```ts
   const updatedMdContent = syntaxUpdatedContent.replace(
     /(\$\{?HOME\}?\/|~\/)?\.claude(\/|$)/g,
     '$1.qwen$2',
   );
   ```
   Any `tkt` or `grey-matter` skill/reference mentioning `.claude/` or `~/.claude/` is silently mutated to `.qwen/`.
3. **`dependencies` dropped:** `convertClaudeToQwenConfig()` (`claude-converter.ts:446-453`) omits `dependencies`; `grey-matter` -> `tkt` is ignored.

## 3. Skills (`SKILL.md`), invocation policy, and namespacing

Sources: `packages/core/src/config/storage.ts:17`, `packages/core/src/skills/{skill-manager.ts,skill-load.ts,types.ts}`, `packages/core/src/tools/skill-utils.ts:74-76`, `docs/users/features/skills.md` (`v0.28.4`). Confidence: **high**.

- **Discovery roots (`storage.ts:17`):** `SKILL_PROVIDER_CONFIG_DIRS = ['.qwen', '.agents']`.
  - Personal: `~/.qwen/skills/`, `~/.agents/skills/`, plus `skills.directories` in `settings.json`. (`~/.claude/skills/` is **not** scanned by default.)
  - Project: `.qwen/skills/`, `.agents/skills/`.
  - Precedence: project -> personal -> extension -> bundled (within a scope, `.qwen/skills/` beats `.agents/skills/`).
- **Layout:** Strictly flat depth 1 (`<baseDir>/<skill-dir>/SKILL.md`, `WATCHER_MAX_DEPTH = 2`). Symlinks are followed.
- **Frontmatter & invocation policy (`skill-load.ts:119-233`):**
  - Required: `name`, `description`.
  - Supported in both personal and native extension skills: `disable-model-invocation`, `user-invocable`, `paths` (lazy glob activation), `when_to_use`, `argument-hint`, `priority`, `model`, `allowedTools` (camelCase only; hyphenated `allowed-tools` is ignored).
  - `hooks` inside extension `SKILL.md` is ignored (`skill-load.ts:209-214`); declare hooks in `qwen-extension.json`.
- **Extension namespace (`docs/users/features/skills.md:303-310`):**
  > "Qwen Code registers a Skill from an installed extension as `<extensionName>:<name>`... Invoke it as `/rust:pdf`. The bare `/pdf` is not an alias — the extension's Skill is reachable only under its registered name."
- **Bundled resources (`skill-utils.ts:74-76`):** injects `Base directory for this skill: ${baseDir}` so the model resolves `references/` on demand.

## 4. Global instructions (`QWEN.md` / `AGENTS.md`)

Sources: `packages/core/src/utils/memory-constants.ts:6-35`, `packages/core/src/memory/memoryDiscovery.ts:106-250` (`v0.28.4`). Confidence: **high**.

- Default filename list: `['QWEN.md', 'AGENTS.md']` (overridable via `context.fileName` in `settings.json`).
- User global loads **both `~/.qwen/QWEN.md` AND `~/.qwen/AGENTS.md`** if both exist (`install-agents-md.mjs` must target only one).
- Project hierarchy walks CWD -> `.git` root loading both `QWEN.md` and `AGENTS.md` (requires folder trust), plus `<projectRoot>/.qwen/QWEN.local.md`.
- Extension `contextFileName` injects every turn; Qwen docs warn against large always-on extension context files.

## 5. Hooks (`tkt` `SessionStart` native compatibility!)

Sources: `packages/core/src/hooks/{types.ts,hookRegistry.ts,hookRunner.ts}`, `packages/core/src/extension/extensionManager.ts:2041-2095` (`v0.28.4`). Confidence: **high**.

- Extension hooks in `qwen-extension.json` (`hooks: "./.claude-plugin/claude-hooks.json"`, inline map, or `hooks/hooks.json`) are **always loaded** for active extensions without per-folder approval (`hookRegistry.ts:318-327`), and both `${extensionPath}` and `${CLAUDE_PLUGIN_ROOT}` are substituted (`extensionManager.ts:2168-2170`).
- **Environment variables exported (`hookRunner.ts:1629-1632`):**
  ```ts
  GEMINI_PROJECT_DIR: input.cwd,
  CLAUDE_PROJECT_DIR: input.cwd,
  QWEN_PROJECT_DIR: input.cwd,
  ```
- **Plain-text stdout promotion (`hookRunner.ts:250-254, 1783-1798`):**
  > "Events whose plain-text stdout on a successful exit is handed to the model as additional context, matching the events Claude Code promotes."
  (`SessionStart`, `UserPromptSubmit`, `UserPromptExpansion`).
- **Result:** `tkt/.claude-plugin/hooks/session-start.mjs` is **natively protocol-compatible with Qwen Code** as-is (checking `QWEN_PROJECT_DIR || CLAUDE_PROJECT_DIR` is a clean defensive improvement).

## 6. Critical duplicate-skill hazard (`~/.agents/skills/` + Qwen extension)

Confidence: **high** (`skill-manager.ts:338, 1080`, `storage.ts:17`).

- Qwen scans `~/.agents/skills/` under bare `<name>` (e.g., `tdd`), while extension skills register as `<extensionName>:<name>` (e.g., `grey-matter:tdd`).
- `SkillManager.collectCachedSkills()` deduplicates strictly on `skill.name`. Because `'tdd' !== 'grey-matter:tdd'`, **both survive into `<available_skills>`** — loading 2x every skill (~2,750 wasted tokens/session for 50 skills).
- **Direct impact on [scripts/deploy.mjs](../../../scripts/deploy.mjs):** `qwen` must be added to `HARNESSES()` with `reads: [~/.qwen/skills, ~/.agents/skills]` and `plugin: qwenPlugin` so `chooseRoots()` never puts bare copies into `~/.agents/skills` when Qwen has the extension enabled.

## Couldn't verify

1. **Live CLI/Desktop runtime execution:** `qwen` is not installed on this machine; all findings were verified statically from `QwenLM/qwen-code@v0.28.4` source and docs. Live smoke tests (`qwen extensions link`, `/skills`, `/hooks`, `SessionStart` firing, `disable-model-invocation` exclusion) remain to be run once `qwen` is installed.
2. **QwenPaw primary repository:** secondary web search mentioned an AgentScope-maintained personal assistant ("QwenPaw" / CoPaw), not under `QwenLM`; no primary repository was located or inspected (out of scope).
3. **Future `config.skills` wiring:** whether a post-`v0.28.4` release will honor `config.skills` in `extensionManager.ts:2014` is unknown.
4. **Live Discover UI rendering** of `grey-matter`'s `.claude-plugin/marketplace.json` with `allowCrossMarketplaceDependenciesOn`.

# Plugin proposals for DeepSeek Harness (`dsh`) and Qwen Code (`qwen`)

Status: proposed, 2026-11-25. Grounded in primary-source research:
- [dsh-plugin-compat-20261125.md](../research/dsh-plugin-compat-20261125.md) (`@deepseek-ai/dsh@0.2.2-rc.5` installed source + `deepseek-ai/deepseek-harness`)
- [qwen-code-plugin-compat-20261125.md](../research/qwen-code-plugin-compat-20261125.md) (`QwenLM/qwen-code@v0.28.4` source and docs)

Both harnesses support Agent Skills (`SKILL.md`), global `AGENTS.md` instructions, and first-class plugin/extension systems — and **both have non-obvious traps** that break naive reuse of `.claude-plugin/` or bare skill copies alongside plugins.

---

## Part 1: DeepSeek Harness (`dsh`) plugins

### Key constraints from `dsh@0.2.2-rc.5`
1. **Cordis bundle model:** Plugins are npm packages declaring `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }` and `"engines": { "dsh": ">=0.2.0 <0.3.0" }`, installed per-profile via `dsh plugin --profile <name> add <pkg>` (requires `pnpm` on `PATH`; Node `>= 24.9.0`, or `>= 24.22.3` on `0.2.3-alpha.2`).
2. **`dsh-web-app` preset gotcha:** The `web` and `desktop` profiles disable the base host `id: skill-filesystem` row and mount `skill-filesystem` inside each Agent Preset. Patching `skill-filesystem` fails there; a plugin **must** register a custom `SkillProvider` on `ctx.skills` (`ctx.skills.registerProvider(...)`) at `BUNDLED_SKILL_RANK` (`600`), matching `@deepseek-ai/dsh-skill-badge`.
3. **Zero-build ESM avoids pnpm `allowBuilds`:** Plain `.mjs` plugin entrypoints need no build step, so local `link:`, tarball, npm, and `github:` installs work without pnpm build allowlists.
4. **Native `SessionStart` equivalent:** `ctx.on('agent/created', async ({ agent, source, signal }) => ...)` awaits before user input runs and injects context via `agent.inject(...)` — eliminating any need for experimental `@deepseek-ai/dsh-hooks-claude-code`.
5. **Silent shadowing hazard:** Bare copies in `~/.dsh/skills` (rank `400`) or `~/.agents/skills` (rank `500`) silently override a global `SkillProvider` plugin (rank `600`). One route per machine is mandatory.
6. **500-char catalog truncation:** Three skills currently exceed `dsh`'s default 500-char catalog description (`repository-artifact-hygiene`: 581, `tkt-reconcile`: 551, `tkt-work`: 568); keep key trigger words within the first 500 characters (or trim descriptions).

### Proposed architecture: Hybrid Cordis bundles (Option C)

Ship two zero-build ESM Cordis bundle packages — one per repo, preserving `tkt`'s standalone rule — plus `deploy.mjs` / `install-agents-md.mjs` integration.

#### 1. `tkt` Cordis bundle (`dsh-plugin/` or generated `dist/dsh-plugin/`, package `@smileynet/dsh-tkt`)
- **Manifest (`package.json`):**
  - `"type": "module"`, `"exports": { ".": "./index.mjs" }`
  - `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`
  - `"engines": { "dsh": ">=0.2.0 <0.3.0" }`
  - `"peerDependencies": { "@deepseek-ai/cordis": "*", "@deepseek-ai/dsh-skill": "*", "@deepseek-ai/dsh-agent": "*", "@deepseek-ai/dsh-llm": "*", "@deepseek-ai/dsh-working-directory": "*" }`
- **Patch (`cordis.patch.yml`):** mounts `@smileynet/dsh-tkt` on the host layer (enabled by default).
- **Runtime (`index.mjs`):**
  1. **`SkillProvider` (`BUNDLED_SKILL_RANK = 600`):** loads `tkt-core`, `tkt-orient`, `tkt-work`, `tkt-reconcile` from the packaged `skills/` directory with `resourceBase: { kind: 'directory', path: skillDir }` (self-contained, zero references to `grey-matter`).
  2. **Native `SessionStart` frontier injection (`agent/created`):** checks `<cwd>/.tickets`, runs `tkt ready --json` and `tkt query --status in_progress` (reusing the 5s timeout + augmented `PATH` logic from `tkt/.claude-plugin/hooks/session-start.mjs`, respecting `signal`), and calls `agent.inject(...)` with a sourced user message (`{ kind: 'tkt-frontier', form: 'instructions' }`).
  3. **Optional Phase 2:** human-only `/tkt` UI command via `ctx.commands.register(...)` to inspect frontier/status without LLM tokens.

#### 2. `grey-matter` Cordis bundle (`dist/dsh-plugin/` built by `deploy.mjs dsh build`, package `@smileynet/dsh-grey-matter`)
- **Manifest (`package.json`):** same zero-build ESM structure (`engines.dsh: ">=0.2.0 <0.3.0"`, `peerDependencies` on `@deepseek-ai/cordis` and `@deepseek-ai/dsh-skill`).
- **Runtime (`index.mjs`):**
  1. **`SkillProvider` (`BUNDLED_SKILL_RANK = 600`):** scans all 3 bucket directories (`./skills/engineering`, `./skills/productivity`, `./skills/meta`) — or flattened `skills/` in the staged package — parsing `name`, `description`, `whenToUse`, `disable-model-invocation`, `user-invocable`, `metadata`, with `resourceBase` set per skill directory and rewritten shared `.resources-grey-matter/` links (reusing `deploy.mjs`'s self-contained projection).
  2. **Standing rules (`global/AGENTS.md`):** keep `scripts/install-agents-md.mjs` targeting `~/.dsh/AGENTS.md` (user-editable, deduplicated with `~/.agents/AGENTS.md` by `dsh-agent-instructions`). Optionally expose `includeGlobalAgentsMd: false` config to inject via `ctx.systemPrompt.section({ name: 'grey-matter:rules', order: 10150, text, interpolate: false })` for plugin-only users.

#### 3. `deploy.mjs` & `install-agents-md.mjs` updates for `dsh`
- **`scripts/install-agents-md.mjs`:** add `{ harness: "dsh", dir: join(H, ".dsh"), file: join(H, ".dsh", "AGENTS.md") }` (respecting `DSH_HOME`).
- **`scripts/deploy.mjs` (`HARNESSES()`):**
  - Add `dsh`: `home: DSH_HOME()`, `own: join(DSH_HOME(), "skills")`, `reads: [{ root: join(DSH_HOME(), "skills") }, { root: SHARED() }]`, `project: [".dsh", ".agents"]`, `plugin: dshPlugin`.
  - `dshPlugin(pack)`: checks whether active non-`desktop` profiles under `$DSH_HOME/profiles/*/package.json` list `@smileynet/dsh-<pack>` in `dsh.profile.bundles`.
  - **One-route enforcement:** when `dsh` profiles have the plugin installed, `deploy.mjs` skips/prunes owned copies from `~/.dsh/skills` (and `~/.agents/skills`) so stale bare copies never shadow the rank-600 `SkillProvider`. When the plugin is not installed (or `pnpm` is absent), bare copy-mode into `~/.dsh/skills` covers every profile (`web`, `headless`, `sdk`, `acp`, `desktop`) automatically.
  - Add `node scripts/deploy.mjs dsh [build|install] [--profile <name>]` (parallel to `agy` and `kirocrew`).

---

## Part 2: Qwen Code (`qwen`) plugins

### Key constraints from `QwenLM/qwen-code@v0.28.4`
1. **Do NOT rely on Qwen's Claude Code plugin converter:**
   - `grey-matter`'s 3 skill buckets copy to `skills/<bucket>/<skill>/SKILL.md` (depth 2), where `loadSkillsFromDir()` finds **0 skills**.
   - Any Claude-origin plugin with hooks triggers `performVariableReplacement()`, which rewrites `.claude/` -> `.qwen/` across **every `**/*.md` file**, corrupting docs/skills.
   - `dependencies` is dropped.
2. **Do NOT use Agent Plugins v1 (`plugin.json` with `$schema`):** it ignores `hooks/` (breaking `tkt`'s `SessionStart` hook) and requires flat `skills/` at root (breaking `grey-matter`).
3. **Native `qwen-extension.json` source-vs-docs constraint:** `extensionManager.ts:2003-2034` ignores `config.skills` and hardcodes `<extRoot>/skills/<name>/SKILL.md` (flat depth 1). Only `config.hooks`, `config.contextFileName`, and `config.workflows` honor custom manifest paths.
4. **Native `tkt` `SessionStart` hook compatibility:** `qwen-extension.json` accepts `"hooks": "./.claude-plugin/claude-hooks.json"`, hydrates `${CLAUDE_PLUGIN_ROOT}` and `${extensionPath}`, exports both `CLAUDE_PROJECT_DIR` and `QWEN_PROJECT_DIR`, and promotes plain-text stdout on `SessionStart` — **protocol-compatible with `tkt/.claude-plugin/hooks/session-start.mjs` as-is**.
5. **Critical 2x duplicate-skill hazard:** Qwen scans `~/.agents/skills/` as bare `<name>` (`tdd`) while registering extension skills as `<ext>:<name>` (`grey-matter:tdd`). Because `'tdd' !== 'grey-matter:tdd'`, **both load** unless `deploy.mjs` knows about `qwen` and avoids `~/.agents/skills/`.
6. **Global instructions double-load hazard:** Qwen reads **both** `~/.qwen/QWEN.md` and `~/.qwen/AGENTS.md` by default; `install-agents-md.mjs` must write to only one.

### Proposed architecture: Native `qwen-extension.json` (zero-build for `tkt`, staged for `grey-matter`)

#### 1. `tkt`: Zero-build root `qwen-extension.json`
`tkt` already keeps its 4 skills flat at `skills/{tkt-core,tkt-orient,tkt-work,tkt-reconcile}/SKILL.md`.
- Add `~/code/tkt/qwen-extension.json`:
  ```json
  {
    "name": "tkt",
    "displayName": "tkt",
    "version": "0.4.0",
    "description": "Git-native ticket tracker and workflow skills (tkt-core, tkt-orient, tkt-work, tkt-reconcile). Requires the tkt CLI on PATH.",
    "hooks": "./.claude-plugin/claude-hooks.json"
  }
  ```
- **Why this works immediately:**
  - `extension-converter.ts` picks `qwen-extension.json` ahead of `.claude-plugin/` (skipping Claude conversion and avoiding `.claude` -> `.qwen` markdown corruption).
  - Supports both remote `qwen extensions install smileynet/tkt` and local dev `qwen extensions link ~/code/tkt` with zero build step.
  - Fires `tkt`'s `SessionStart` hook automatically on every session without folder-trust prompts.
- **Small companion edits in `tkt`:**
  - Read `process.env.QWEN_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR` in `.claude-plugin/hooks/session-start.mjs`.
  - Keep `qwen-extension.json` version synced in `release-version.mjs` and `tests/plugin_manifests.rs`.

#### 2. `grey-matter`: Staged native Qwen extension (`deploy.mjs qwen [build|install]`)
Because `grey-matter` uses 3 bucket subdirectories and Qwen `v0.28.4` hardcodes depth-1 `skills/<name>/SKILL.md`:
- **Do NOT put `qwen-extension.json` at `grey-matter`'s repo root** (a direct GitHub install would load 0 skills).
- Add `node scripts/deploy.mjs qwen [build|install] [--out dist/qwen-extension]` (mirroring `agy` and `kirocrew`):
  - **`build`:** stages `dist/qwen-extension/` with generated `qwen-extension.json` (`name`, `displayName`, `version`, `description` sourced from `.claude-plugin/plugin.json`), flattened `skills/<skill-name>/` with rewritten `.resources-grey-matter/` links, and `legalFiles`/`runtimeFiles`.
  - **`install`:** links or installs the staged build (`qwen extensions link <dist/qwen-extension>` for local dev, or `qwen extensions install <dist/qwen-extension>`).
  - **Release distribution:** attach `grey-matter-qwen-extension.tar.gz` to GitHub Releases (document direct archive URL install since Qwen only auto-selects a generic release asset when a release has one asset) or publish to npm.
  - **Dependency docs:** document installing `tkt` and `grey-matter` together (Qwen ignores `dependencies`).

#### 3. `deploy.mjs` & `install-agents-md.mjs` updates for `qwen`
- **`scripts/deploy.mjs` (`HARNESSES()`):**
  - Add `qwen`: `home: join(HOME, ".qwen")`, `own: join(HOME, ".qwen", "skills")`, `reads: [{ root: join(HOME, ".qwen", "skills") }, { root: SHARED() }]`, `project: [".qwen", ".agents"]`, `plugin: qwenPlugin`.
  - `qwenPlugin(pack)`: checks `~/.qwen/extension-store/state.json` (enabled extension matching `pack.name`) with fallback to `~/.qwen/extensions/<pack.name>/qwen-extension.json` + `extension-enablement.json`.
  - **Eliminates the 2x duplicate hazard:** when the Qwen extension is enabled, `chooseRoots()` avoids `~/.agents/skills` and `~/.qwen/skills`; when absent, bare copy-mode covers `~/.qwen/skills` cleanly.
- **`scripts/install-agents-md.mjs`:**
  - Add `{ harness: "qwen", dir: join(H, ".qwen"), file: join(H, ".qwen", "QWEN.md") }` (single file — never write both `QWEN.md` and `AGENTS.md`).

---

## Cross-cutting summary & recommended sequencing

| Step | Repo(s) | Scope | Risk / Spike needed |
| --- | --- | --- | --- |
| 1. `dsh` bare-copy & `AGENTS.md` support | `grey-matter`, `tkt` | Add `dsh` to `HARNESSES()` (`~/.dsh/skills`) + `install-agents-md.mjs` (`~/.dsh/AGENTS.md`) | Low — `dsh@0.2.2-rc.5` already installed locally; verify live skill discovery & `disable-model-invocation`. |
| 2. `tkt` native `qwen-extension.json` | `tkt` | Add root `qwen-extension.json`, update `session-start.mjs` env fallback + version-sync test | Low — zero build step; live-verify once `qwen` CLI is installed. |
| 3. `qwen` deployer + `AGENTS.md` support | `grey-matter`, `tkt` | Add `qwen` to `HARNESSES()` (duplicate guard!) + `install-agents-md.mjs` (`~/.qwen/QWEN.md`) + `deploy.mjs qwen [build\|install]` | Medium — live-verify `qwen extensions link dist/qwen-extension`, `/skills`, and `disable-model-invocation`. |
| 4. `dsh` Cordis bundles (`@smileynet/dsh-tkt`, `@smileynet/dsh-grey-matter`) | `tkt`, `grey-matter` | Build zero-build ESM `SkillProvider` bundles + native `tkt` `agent/created` frontier injector + `deploy.mjs dsh` refresh | Medium — spike on local `dsh@0.2.2-rc.5` (needs `pnpm` installed first) across `headless` and `web` profiles; verify rank-600 override & `bwrap` read access. |

## Decision asks

1. **`dsh` bundle delivery vs. copy-mode:** Approve Option C (Cordis bundles with native `tkt` `agent/created` frontier injection, falling back to `~/.dsh/skills` copy-mode when plugins aren't installed), or stay copy-mode only for `grey-matter` and build a Cordis plugin only for `tkt`?
2. **`dsh` package naming & publishing:** Keep `dsh` plugins local/tarball-built (`dist/dsh-plugin/`) for now, or plan scoped npm publication (`@smileynet/dsh-tkt`, `@smileynet/dsh-grey-matter`) + a GitHub Pages Plugin Market index?
3. **Qwen global rules target:** Confirm `~/.qwen/QWEN.md` (safe if user restricts `context.fileName` to `"QWEN.md"`) vs. `~/.qwen/AGENTS.md` (keeps `QWEN.md` user-only while matching other harnesses' `AGENTS.md` filename).
4. **Install `qwen` CLI & `pnpm` for live spikes?** Neither `qwen` (`@qwen-code/qwen-code`) nor `pnpm` is installed on this box yet; say the word if you want both installed so we can run live spikes against these proposals.

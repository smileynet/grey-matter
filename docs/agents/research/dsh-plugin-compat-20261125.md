# DeepSeek Harness (`dsh`) plugin and skill compatibility research (2026-11-25)

Question: how do plugins, skills, instructions, and lifecycle hooks work in DeepSeek Harness (`dsh`), and how should `grey-matter` and `tkt` package plugins for it?

Companion proposal: [25-dsh-and-qwen-plugins.md](../proposals/25-dsh-and-qwen-plugins.md).

## Primary sources inspected

- Locally installed `@deepseek-ai/dsh@0.2.2-rc.5` (published `2026-11-18T12:51:39Z`, `engines.node >= 24.9.0`) under `~/.local/share/mise/installs/node/24.22.3/lib/node_modules/@deepseek-ai/dsh/` (`src/`, `docs/`, `node_modules/@deepseek-ai/*`).
- Upstream GitHub `deepseek-ai/deepseek-harness` (`master` pushed `2026-11-22`; prerelease `dsh-v0.2.3-alpha.2` published `2026-11-22`, bumping Node requirement to `24.22.3+` / `26.13.1+`).
- Local packs: `.claude-plugin/plugin.json` (`grey-matter` `0.2.0`, `tkt` `0.4.0`), `tkt/.claude-plugin/hooks/session-start.mjs`, [scripts/deploy.mjs](../../../scripts/deploy.mjs), [scripts/install-agents-md.mjs](../../../scripts/install-agents-md.mjs).

## 1. Cordis plugin, bundle, and profile architecture

Confidence: **high** (all quotes from installed `@deepseek-ai/dsh@0.2.2-rc.5`).

- **Plugin module model** (`docs/user/develop/basic/index.md`): `dsh` runs on `@deepseek-ai/cordis` (`~4.1.0`). An ESM plugin exports `name`, `inject`, optional Schemastery `Config`, and `apply(ctx, config)` (or a `Service` subclass). Registrations on `ctx` auto-dispose on unload/reload:
  > "In Harness, a plugin is a TypeScript module that exports an `apply` function. The framework calls `apply` when loading the plugin and passes a `ctx` context object through which the plugin registers capabilities"
  > "Anything registered through `ctx`—event listeners, tools, or timers—is cleaned up when the plugin unloads."
- **Bundle vs profile manifests** (`@deepseek-ai/dsh-package-manifest/src/types.ts`, `@deepseek-ai/dsh-app-boot/src/plugin-compatibility.ts`):
  - A distributable plugin package declares `dsh.bundle` in `package.json`:
    ```ts
    export interface DshBundleManifest {
      platforms?: string[]
      patch: string | string[]
      listedByDefault?: boolean
    }
    ```
  - Optional `"icon"` (SVG/PNG/JPEG/WebP <= 256 KiB) and `./locale/*.json`.
  - Compatibility check:
    > "Check the plugin's dsh requirements against the runtime. An own `engines.dsh` range decides alone and peerDependencies are ignored; otherwise every @deepseek-ai/dsh or @deepseek-ai/dsh-* peer must match. Prereleases participate in ranges."
- **Home roots** (`@deepseek-ai/dsh-home-paths/src/index.ts`):
  - Harness home: explicit config -> `$DSH_HOME` -> `~/.dsh`.
  - Shared agent root: explicit config -> `$DSH_AGENTS_HOME` -> `~/.agents`.
- **Profiles and patch composition** (`src/profile-boot.ts`, `docs/user/develop/basic/publish.md`):
  - Profiles live at `$DSH_HOME/profiles/<name>` (`package.json`, `cordis.patch.yml`, `pnpm-workspace.yaml`). Shipped templates (`dsh-official-bundles/src/bundles.ts`): `web`, `headless`, `sdk`, `sdk-minimal`, `acp` (`desktop` is reserved for Electron).
  - Patch application order: bundle patch lists in `dsh.profile.bundles` order -> `$DSH_HOME/profiles/<name>/cordis.patch.yml` -> `$DSH_HOME/cordis.patch.yml` -> CLI `--patch` overlays.
  - **Patch replacement semantics:** `"Later layers win per row, and a patch replaces a row's entire config value rather than deep-merging keys."`
- **Plugin CLI (`dsh plugin --profile <name> <pnpm-args>`):** anchors relative local paths (`./...`, `file:`, `link:`) against caller cwd (`@deepseek-ai/dsh-plugin-manager/src/operations.ts`), preflight-checks `engines.dsh`, invokes `pnpm` (must be on `PATH`; exit `127` otherwise), validates compatibility, and updates `dsh.profile.bundles`.

## 2. Skills subsystem (`dsh-skill`, `dsh-skill-filesystem`, `dsh-tool-skill`)

Confidence: **high** (source inspected at `0.2.2-rc.5`).

### Discovery roots, precedence, and layout

- `ctx.skills` is a host + per-scope layered registry:
  > "A read merges the global layer with the viewing scope's chain — the nearest layer's entry wins a duplicate name outright, and the rank order decides duplicates only within one layer." (`@deepseek-ai/dsh-skill/src/index.ts`)
- Numeric rank table within a layer (`@deepseek-ai/dsh-skill-filesystem/src/index.ts`, `@deepseek-ai/dsh-skill/src/index.ts`):

| Rank | Source | Location / API |
| ---: | --- | --- |
| `100` | `project-dsh` | `<projectRoot>/.dsh/skills` |
| `200` | `project-agents` | `<projectRoot>/.agents/skills` |
| `250` | `runtime` | `ctx.skills.register(...)` |
| `300` | `custom` | `Config.customSkillDirs` |
| `400` | `user-dsh` | `~/.dsh/skills` (`$DSH_HOME/skills`, skips `.system`) |
| `500` | `user-agents` | `~/.agents/skills` (`$DSH_AGENTS_HOME/skills`) |
| `600` | `bundled` | `BUNDLED_SKILL_RANK` (`bundledSkillDir` / packaged `SkillProvider`s) |

- **No recursive discovery (`docs/subsystems/skills.md`):**
  > "Skill names are kebab-case (`^[a-z0-9]+(?:-[a-z0-9]+)*$`). The local provider accepts directory bundles (`<name>/SKILL.md`) and flat Markdown files (`<name>.md`). Nested recursive `**/SKILL.md` discovery is not supported."

### Frontmatter and invocation policy

- Recognized keys (`@deepseek-ai/dsh-skill-filesystem/src/index.ts`): required `name`, `description`; optional `whenToUse`, `disable-model-invocation`, `user-invocable`, `metadata`. Unknown keys (`argument-hint`, `compatibility`, `license`) are safely ignored.
- Legacy camelCase keys (`disableModelInvocation`, `modelInvocable`, `userInvocable`) are **rejected** and cause the skill to be ignored.
- Direct user `/<skill-name>` gestures in `agent/pre-step` load any `userInvocable: true` skill (`@deepseek-ai/dsh-tool-skill/src/index.ts`):
  > "This is the only entry point for `disable-model-invocation` skills; the catalog and the `skill` tool below never see them."
- **Catalog truncation audit (default `catalogDescriptionMaxLength = 500` chars):**
  - `grey-matter` (50 skills): 0 invalid names/keys; 1 description > 500 chars (`repository-artifact-hygiene`, 581 chars).
  - `tkt` (4 skills): 0 invalid names/keys; 2 descriptions > 500 chars (`tkt-reconcile`, 551 chars; `tkt-work`, 568 chars).

### Critical `dsh-web-app` preset gotcha

- `dsh-web-app/cordis.patch.yml` disables the host-level `id: skill-filesystem` row and mounts `skill-filesystem` inside each Agent Preset (`standard`, `cordis`, `ptc`; `minimal` disables skills):
  > "Only the per-agent rows move behind presets: the base host `skill-filesystem` row is disabled here (presets own local discovery), and `tool-skill` is what a preset mounts to give its agent the catalog and loader at all."
- **Consequence:** A third-party bundle cannot patch `id: skill-filesystem` to add `customSkillDirs`. Instead, follow `@deepseek-ai/dsh-skill-badge/src/index.ts` and register a custom `SkillProvider` on the global `ctx.skills` layer at `BUNDLED_SKILL_RANK` (`600`):
  ```ts
  export const inject = ['skills']
  export function apply(ctx: Context): void {
    ctx.skills.registerProvider(() => provider)
  }
  ```
  This works across all profiles (`web`, `desktop`, `headless`, `sdk`, `acp`), scans `grey-matter`'s 3 bucket directories directly with zero watcher overhead, and stays at rank `600` so user/project skills override cleanly.

### Bundled resources and sandbox reads

- `renderSkillContent()` (`@deepseek-ai/dsh-skill/src/index.ts`) injects `Base directory for this skill: <path>` and tells the model to resolve relative links against it on demand.
- `@deepseek-ai/dsh-fs-sandbox/src/index.ts` permits reads in every sandbox mode (`"Reads pass through untouched: every mode permits reading"`), so `references/` files inside installed plugin packages are readable out of the box.

## 3. Instructions, hooks, tools, and commands

Confidence: **high**.

- **Instructions (`@deepseek-ai/dsh-agent-instructions/src/{config.ts,render.ts}`):**
  - User-global: `~/.dsh/AGENTS.md` and `~/.agents/AGENTS.md` (`AGENTS.md` only; `CLAUDE.md` is not checked at user-global scope). Deduplicated by trimmed content.
  - Project: walks `.git` root -> `cwd` loading `AGENTS.md`, `CLAUDE.md`, `AGENTS.local.md`, `CLAUDE.local.md` (64 KiB budget per chain).
- **Plugin context injection:**
  - Static rules: `ctx.systemPrompt.section({ name, order, text, interpolate: false })` (`interpolate: false` prevents literal `{{...}}` from throwing).
  - **Session-start context (exact equivalent of Claude's `SessionStart` hook):** `ctx.on('agent/created', async ({ agent, source, signal }) => { ... agent.inject(msg) })` (`docs/subsystems/core.md`: `"Listeners run in order and are awaited before creation resolves. AgentLoop holds queued input until all listeners finish."`). Confirmed in `deepseek-ai/deepseek-harness` `packages/experimental/hooks-claude-code/src/index.ts` (`master`, 2026-11-22).
- **Lifecycle events:** `agent/created`, `agent/pre-step`, `agent/turn-stopping`, `tools/pre-execute`, `tools/execute`, `tools/post-execute`, `system-prompt/assemble`, `session/event`. Note: `@deepseek-ai/dsh-hooks-claude-code` is experimental (`devDependencies` only, single process-level `configPath`, not bundled in runtime `dsh`).
- **Custom tools & human commands:** `ctx.tools.register(defineTool(...), { when })` supports conditional step-time activation (e.g., only when `.tickets/` exists); `ctx.commands.register(...)` registers direct UI slash commands executed without an LLM call (`docs/subsystems/commands.md`).

## 4. Packaging, local dev, and shadowing hazards

Confidence: **high**.

- **Zero-build ESM advantage (`docs/user/develop/basic/publish.md`):**
  > "A git install fetches **sources, not built artifacts**: nothing runs your `build` script... pnpm >=10 refuses to run a git dependency's `prepare` script until it is explicitly allowed"
  Writing the Cordis plugin entrypoint in plain ESM (`.mjs`) avoids any build step, so local `link:`, tarball, npm, and `github:` installs work without `allowBuilds`.
- **Peer sharing:** declare `@deepseek-ai/cordis` and `@deepseek-ai/dsh-*` in `peerDependencies` (not `dependencies`) so the host runtime supplies single instances.
- **Per-profile install & silent shadowing trap:**
  - `dsh plugin --profile <name> add ...` installs per profile (`$DSH_HOME/profiles/<name>`).
  - `dsh` deduplicates by skill name (never doubles `<available_skills>`), **but** bare copies in `~/.dsh/skills` (rank `400`) or `~/.agents/skills` (rank `500`) — and in `web`/`desktop`, anything in the preset's `skill-filesystem` scope — **silently shadow** a global `SkillProvider` plugin (rank `600`).
  - Therefore `deploy.mjs` must treat `dsh` like Claude/Codex/ZCode: one route per machine (plugin OR bare copy, never both).

## Couldn't verify

1. Exact source diff between installed `@deepseek-ai/dsh@0.2.2-rc.5` and GitHub prerelease `dsh-v0.2.3-alpha.2` (only release notes were inspected; no breaking plugin/skill API changes were listed).
2. Live `bwrap`/Landlock execution of a helper script living inside `$DSH_HOME/profiles/<name>/node_modules/` (filesystem read-allowance was verified in `dsh-fs-sandbox`, not executed live inside `bwrap`).
3. Live Electron Desktop profile behavior (`dsh plugin --profile desktop` is rejected by the npm CLI and requires Desktop's bundled CLI).
4. Independent npm publication status of experimental `@deepseek-ai/dsh-hooks-claude-code`.

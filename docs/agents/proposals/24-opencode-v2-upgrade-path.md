# Upgrade path for OpenCode 2.0 (`v2.4.1`) across skills, plugins, and tooling

Status: proposed, 2026-11-25. Grounded in primary-source research at
[opencode-v2-breaking-changes-20261125.md](../research/opencode-v2-breaking-changes-20261125.md)
(`anomalyco/opencode@v2.4.1`, 2026-11-23, compared against locally installed `1.19.6` and recorded baseline `1.18.21`).

## Summary

Good news first: **none of our 54 `SKILL.md` files (50 `grey-matter` + 4 `tkt`), nor `deploy.mjs`, nor `install-agents-md.mjs` break on OpenCode 2.0.** OpenCode V2 preserves `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`, project roots, and `~/.config/opencode/AGENTS.md`, and **adds native `disable-model-invocation: true` enforcement** — so our existing user-invoked skills gain real invocation filtering automatically.

What **does** break immediately on V2 is our **critic probe tooling**, **harness reference docs**, **version manifest**, and any **future or external V1 OpenCode plugin**. OpenCode V2 also introduces a new `opencode plugin` distribution channel (`@opencode/plugin` + `ctx.skill.transform`) worth evaluating only after the core migration lands.

## What breaks vs. what survives

| Surface | Status on OpenCode 2.x (`v2.4.1`) | Exact reason |
| --- | --- | --- |
| All 50 `grey-matter` + 4 `tkt` `SKILL.md` files | **Safe (gains feature)** | Discovery roots and frontmatter unchanged; `disable-model-invocation: true` is now enforced natively (`skill-file.ts:49-51`). |
| [scripts/deploy.mjs](../../../scripts/deploy.mjs) & `tkt/tools/deploy.mjs` | **Safe** | `opencode` `HARNESSES()` row (`~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`) matches V2.4.1 exactly. |
| [scripts/install-agents-md.mjs](../../../scripts/install-agents-md.mjs) | **Safe (watch nested `CLAUDE.md`)** | `~/.config/opencode/AGENTS.md` unchanged. V2 now evaluates `AGENTS.md`/`CLAUDE.md` per directory (nested `CLAUDE.md` is no longer masked by root `AGENTS.md`). |
| [scripts/probe-critic-model.mjs](../../../scripts/probe-critic-model.mjs) + fixtures/tests | **BROKEN** | `--variant high` removed (now `-m provider/model#high`); top-level `opencode export` removed (now `opencode session export`); export JSON dropped `.info` wrapper and moved model fields to `message.model.{providerID, id, variant}` with `type: "assistant"`; daemon-sharing needs `--standalone`. |
| [docs/agents/harnesses.md](../harnesses.md) | **STALE / BROKEN RECIPES** | Critic table prescribes V1 `--variant`, `opencode export`, `task` tool; read-only recipe uses V1 `permission.edit: deny` and omits V2's default-allow `external_directory`; shell note still states `zsh` `NOMATCH` aborts globs (`v2.4.1` passes `+o nomatch -c`). |
| [docs/agents/harness-surfaces/crush-opencode.md](../harness-surfaces/crush-opencode.md) & [versions.json](../harness-surfaces/versions.json) | **OBSOLETE** | Captures V1.18.21 CLI (`export`, `attach`, `web`, `providers`, `agent`, `github`, `pr`, `db`, `debug skill`, `tui.jsonc`); WinGet path unsupported on V2. |
| [docs/agents/skill-frontmatter.md](../skill-frontmatter.md) | **STALE** | Omits OpenCode from invocation-control table and claims no harness reads `metadata` (`metadata.opencode/autoinvoke` is read by V2). |
| [skills/engineering/code-review/references/visual-critics.md](../../../skills/engineering/code-review/references/visual-critics.md) | **MINOR DRIFT** | Cites V1 `packages/opencode/src/tool/read.ts` (moved to `packages/core`). |
| Any external V1 OpenCode plugin (`@opencode-ai/plugin`) | **BROKEN** | V1 plugins do not run in V2; complete rewrite to `@opencode/plugin` `Plugin.define({ id, setup })`. |

## Phased upgrade path

### Phase 0 — Local V2 upgrade & live qualification (prerequisite)
1. Upgrade the local OpenCode binary cleanly (V1 and V2 do not coexist by default; remove package-managed V1 first if applicable):
   - Linux/macOS: `curl -fsSL https://opencode.ai/v2/install | bash` (or `npm install -g @opencode/cli` or `mise use -g opencode` on `mise >= 2026.10.9`).
   - Note for `~/.config/opencode/`: V2 auto-migrates global `tui.json(c)` -> `cli.json`, but **project-local `tui.json` files are not migrated**.
   - Security note: if you rely on V1's prompt before reading outside the workspace, add `{ "action": "external_directory", "resource": "*", "effect": "ask" }` to `permissions` in `~/.config/opencode/opencode.json`.
2. Run a minimal live qualification against V2.4.1 before editing any probe/doc:
   - `opencode --version`, `opencode --help`, `opencode run --help`, `opencode session export --help`.
   - Confirm `disable-model-invocation: true` hides a user-invoked skill (e.g., `cheat-sheet`) from the model's catalog while `@cheat-sheet` loads it.
   - Run one headless `opencode run --standalone -m <provider/model>#high --format json "reply OK"` followed by `opencode session export <sessionID>` to capture a real V2 export fixture (and check whether subagent model attribution lives in the parent export or requires exporting the child `sessionID`).

### Phase 1 — Fix hard breakages in tooling (`grey-matter`)
1. **Update [scripts/probe-critic-model.mjs](../../../scripts/probe-critic-model.mjs) (support V2 cleanly, optionally detecting V1/V2 via `opencode --version` during transition):**
   - Detect major version (`major >= 2`):
     - **V2 invocation:** `opencode run --standalone -m ${model}#high --format json <PROMPT>` (no `--variant`).
     - **V2 export:** `opencode session export ${sid}` (fallback `opencode export ${sid}` only if V1).
     - **V2 parser:** check `m.type === "assistant"` -> `{ providerID: m.model?.providerID, modelID: m.model?.id, variant: m.model?.variant }`, retaining V1 `m.info` parsing only while V1 machines remain in the fleet.
   - Update `scripts/probe-critic-model-fixtures.mjs` and `scripts/probe-critic-model.test.mjs` with real V2 export payloads alongside a V1 compatibility fixture (or drop V1 once all machines upgrade).
2. **Update [docs/agents/harness-surfaces/versions.json](../harness-surfaces/versions.json) and [crush-opencode.md](../harness-surfaces/crush-opencode.md):**
   - Refresh recorded OpenCode version from `1.18.21` to observed `2.4.x`, update `bin` candidates (remove unsupported WinGet path on V2), and regenerate the OpenCode CLI surface reference (`opencode --help`, `run --help`, `session --help`, `plugin --help`, `service --help`) via the `harness-changelog` workflow.

### Phase 2 — Update docs & frontmatter contract (`grey-matter` + `tkt`)
1. **[docs/agents/harnesses.md](../harnesses.md):**
   - Update OpenCode version, critic table (`-m provider/model#high`, `opencode session export <sessionID>`, `model.{providerID, id, variant}`, `subagent` tool), read-only critic recipe (`permissions: [{ action: "edit", resource: "*", effect: "deny" }, { action: "shell", resource: "*", effect: "deny" }, { action: "external_directory", resource: "*", effect: "deny" }]`), and `zsh` shell note (`+o nomatch -c` suppresses `NOMATCH`, while `=word`, word-splitting, and `~/.zshenv` still apply).
   - Document `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` for repos containing both root `AGENTS.md` and nested `CLAUDE.md` where double-loading is unwanted.
2. **[docs/agents/skill-frontmatter.md](../skill-frontmatter.md):**
   - Add an **OpenCode 2.x** row to the invocation-control table (`disable-model-invocation: true` honored natively; `metadata.opencode/autoinvoke: false` also honored and takes precedence).
   - Narrow the `"metadata is inert"` rule: `"metadata is inert on Claude, Codex, Kiro, and Agy; OpenCode 2.x reads the namespaced key metadata.opencode/autoinvoke. Keep pack-private metadata under our own keys (e.g. metadata.deploy) and rely on top-level disable-model-invocation for cross-harness invocation control."`
3. **[skills/engineering/code-review/references/visual-critics.md](../../../skills/engineering/code-review/references/visual-critics.md):**
   - Update the V1 `packages/opencode/src/tool/read.ts` citation to V2 `packages/core` and note V2.4.0's built-in `browser` Code Mode namespace.
4. **`tkt` repo:** No `SKILL.md` or `tools/deploy.mjs` changes required; verify `docs/embedded-skills-design.md` only if referencing OpenCode V1 versions.

### Phase 3 — Skills audit (confirm zero regressions, no unnecessary churn)
- **No edits needed to any of the 54 `SKILL.md` files** for V2 compatibility:
  - Our user-invoked skills already declare `disable-model-invocation: true`, which OpenCode V2 honors natively without adding `metadata.opencode/autoinvoke`.
  - Directory names already match frontmatter `name` (enforced by `deploy.mjs` lint), matching OpenCode V2's folder-derived skill IDs.
  - Run `node scripts/gate.mjs pre-merge` and `node scripts/deploy.mjs audit --strict --portfolio skill-packs.json` after Phase 1–2 edits.

### Phase 4 — Optional OpenCode V2 plugin channel (defer unless wanted)
OpenCode V2 introduces `opencode plugin add <npm-or-git-spec>` with `@opencode/plugin` (`Plugin.define({ id, setup })`), where a plugin can register skills via `ctx.skill.transform((editor) => editor.add(...))` and hook `ctx.session.hook("context", ...)` (enabling a `tkt` session-start frontier injection analogous to Claude Code's `SessionStart` hook).

- **Recommendation for `grey-matter`:** **Stay on copy-mode (`~/.config/opencode/skills`) as the default.** OpenCode V2's native skill discovery is first-class, zero-dependency, hot-reloads without full config reload (`v2.4.0`), honors `disable-model-invocation: true`, and avoids tracking `@opencode/plugin` API churn.
- **Recommendation for `tkt` (optional follow-up ticket):** Only consider a tiny `@opencode/plugin` wrapper for `tkt` if you specifically want automatic `.tickets/` frontier injection on OpenCode session start via `ctx.session.hook("context", ...)` — and if built, add an `opencodePlugin` detector to `deploy.mjs` so bare copies and plugin skills never duplicate.

## Decision asks

1. **Dual V1/V2 support in `probe-critic-model.mjs` vs. V2-only cutover:** Should `probe-critic-model.mjs` detect `opencode --version` major and support both V1 and V2 temporarily (recommended if other machines still run 1.x), or cut straight to V2 once upgraded everywhere?
2. **OpenCode `tkt` SessionStart plugin:** Stay copy-mode only for OpenCode (recommended for now), or open a ticket to spike an `@opencode/plugin` wrapper for `tkt` frontier injection?

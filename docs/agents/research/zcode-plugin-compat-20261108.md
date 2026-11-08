# ZCode plugin compatibility research (2026-11-08)

Question: can grey-matter's existing Claude Code plugin be used with the ZCode
Desktop client as-is, and what integration does the distribution pipeline need?
Companion spike: the `zcode-plugin-live-trial` ticket (runtime observations this
document cannot produce).

## Environment facts

- ZCode Desktop 0.17.1 (`/Applications/ZCode.app`), bundled CLI at
  `/Applications/ZCode.app/Contents/Resources/glm/zcode.cjs` (runs under any
  Node; homebrew node v26.7.0 works). CLI surface: `plugins
  list|install|uninstall|enable|disable|update|validate|marketplace`, `skills
  list`, `doctor`.
- User state: `~/.zcode/cli/config.json` (enable/disable, overrides — not yet
  present), `~/.zcode/cli/plugins/` (`cache/`, `marketplaces/`,
  `known_marketplaces.json`), user instruction file `~/.zcode/AGENTS.md` (not
  yet present). Official marketplace `zcode-plugins-official` plus
  `claude-plugins-official` (GitHub) registered.
- Authoritative in-app docs: `zcode-guide` plugin skills
  (`zcode-configuration-guide`, `diagnosing-plugins`, `diagnosing-skills`) in
  `~/.zcode/cli/plugins/cache/zcode-plugins-official/zcode-guide/0.3.0/`.

## Findings

| # | Unknown | Verdict | Evidence |
|---|---|---|---|
| 1 | `skills` as array of bucket dirs (`plugin.json` lists `./skills/{engineering,productivity,meta}`) | Supported | zcode-configuration-guide: component fields "each may be a directory name, an array, or inline"; runtime bundle has array handling for `skills`. Residual (spike): each entry treated as an independent scan root. |
| 2 | `disable-model-invocation` frontmatter | Not supported | Zero occurrences in the runtime bundle; diagnosing-skills: recognized frontmatter keys are `name`, `description`, `when_to_use`, `license`, `metadata` only; triggering is always model-decided. No capability lost (user `/` invocation works for every skill) — only the restriction. kiro-cli doesn't honor it either (skill-frontmatter table), so ZCode matches the primary harness. Decision: accept. |
| 3 | tkt dependency (`dependencies: [{name, marketplace}]` + `allowCrossMarketplaceDependenciesOn: ["tkt"]`) | Supported at parse/resolution level | Runtime normalizer accepts the object form and builds `name@marketplace` ids; `allowCrossMarketplaceDependenciesOn` implemented in catalog parsing, resolution, and warning paths. grey-matter's marketplace already declares the gate. Residual (spike): auto-install vs prompt at install time. |
| 4 | Global rules target | `~/.zcode/AGENTS.md` (user instruction file; injected before workspace AGENTS.md) | zcode-configuration-guide scopes table. Not present on this machine. Onboarding may migrate `~/.claude/CLAUDE.md` into it — ours holds a stale grey-matter block (rev `835c2e6`), so an explicit managed install preempts importing stale rules. `install-agents-md.mjs` KNOWN-table addition. |
| 5 | Discovery roots | Copy mode is native | zcode-configuration-guide + diagnosing-skills: user `~/.zcode/skills`, `~/.agents/skills`; workspace `.zcode/skills`, `.agents/skills`; then plugin roots (lowest). Identity is the file path; first same-named skill wins; user scope shadows plugin scope. So a `HARNESSES()` copy-root entry works exactly like kiro/codex/opencode. |
| 6 | Programmatic refresh | CLI exists | `zcode.cjs` exposes `plugins install|update|marketplace` etc. — an eventual `refreshZcode` step mirrors `refreshCodex` (deploy.mjs) once the plugin route is exercised. Earlier "UI-mediated only" conclusion (plugin-creator skill's no-CLI assumption) is wrong for a dev machine with Node. |

Additional validations: `metadata:` is a recognized frontmatter key whose
nested values the scalar parser ignores — inert, loads fine (consistent with
the "metadata is inert" rule in skill-frontmatter.md). Local-directory
marketplaces are added via the Discover `+` button or the CLI; installs
materialize into `plugins/cache/<marketplace>/<name>/<version>/`.

## Recommendation

Copy-mode `HARNESSES()` entry as the primary integration (own root
`~/.zcode/skills`, reads `~/.agents/skills`, project dirs `.zcode`/`.agents`,
plugin detection for the duplicate-discovery audit) — deploy.mjs owns freshness
with no per-deploy UI step. The plugin route stays available as an optional
publishing surface (versioned, toggleable, distributable); its manifests are
already compatible. Global rules via `~/.zcode/AGENTS.md`. New distribution
target → minor version bump per the release contract.

## Residual unknowns (spike scope)

1. Array entries as independent scan roots (all 50 skills load).
2. Skill-to-skill references under `plugin:skill` qualified naming (compass
   routing to siblings by bare name).
3. Dependency auto-install vs prompt for `tkt@tkt`.
4. Update/refresh behavior of a local-directory marketplace install.
5. Watch-item: 92 skills (42 personal + 50 plugin) in the picker.

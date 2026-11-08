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

## Spike results (ticket 273, 2026-11-08)

All via the bundled CLI (`node /Applications/ZCode.app/Contents/Resources/glm/zcode.cjs …`):

- **Validate**: `Plugin manifest is valid` on the checkout as-is — Claude
  manifest, array `skills`, object-form `dependencies`, `metadata.deploy` all
  accepted.
- **Install** (residual 1): `marketplace add <checkout dir>` then
  `plugins install grey-matter@grey-matter` → `0.1.0 [enabled]`, **skills:
  50**. Array-of-bucket-roots proven. Skills register as
  `grey-matter:<name>` **with a bare-name alias** (`grey-matter:compass …
  alias compass`), so sibling references by bare name resolve statically.
- **Dependency** (residual 3): advisory. grey-matter installs cleanly with
  the tkt marketplace absent (no prompt, no warning). Adding
  `smileynet/tkt` does not auto-install the dependency; explicit
  `plugins install tkt@tkt` succeeds (cross-marketplace gate satisfied by
  grey-matter's existing `allowCrossMarketplaceDependenciesOn`).
- **Refresh mechanics** (residual 4), marker round-trips through a compass
  description edit:
  - Same-version content change + `plugins update` alone = no-op ("already up
    to date"): update compares versions against the marketplace snapshot
    taken at `marketplace add` time.
  - `plugins marketplace update grey-matter` re-syncs the snapshot from the
    directory source; following it with `plugins update` re-copies content at
    the **same version** (it prints "already up to date" but still syncs the
    cache). This pair is the scripted no-bump refresh recipe.
  - A version bump + `plugins update` also propagates (new
    `cache/<marketplace>/<name>/<version>/` dir); downgrades are allowed once
    the marketplace snapshot reflects the lower version.
  - `plugins uninstall` requires `--force` in a non-interactive shell; old
    version cache dirs linger after upgrades (manual cleanup).
  - Version changes print "Restart zcode to apply" — a running Desktop picks
    content up per new session.
- **Session scale** (residual 5): `skills list` discovers 109 skills (42
  personal + 50 grey-matter + 17 official-plugin). Interactive picker feel
  pending a user glance.
- **Invocation policy, live confirmation**: the cached `cheat-sheet` SKILL.md
  carries `disable-model-invocation: true` and ZCode still registers it with
  full description (model-invocable) — observed behavior matches finding 2
  (flag ignored; ZCode behaves like kiro-cli). Cache verified byte-identical
  to HEAD (md5). A session started before install does not see plugin skills
  (registry frozen at session start); a fresh process enumerates all 50.
- **Headless single-prompt runs** (`-p`) are blocked in this CLI version:
  "Select a model before sending a message"; no `--model` flag (model default
  is TUI `/model` state). Live invocation check (residual 2's dynamic half)
  deferred to an interactive session.

Residual status: 1, 3, 4 resolved; 2 fully resolved — live invocation confirmed
2026-11-08 after restart: a bare `$cheat-sheet` mention and a
`grey-matter:cheat-sheet` Skill-tool call both loaded from the 0.2.0 plugin
cache; 5 noted (picker resolution observed via the mention).

End state: checkout at HEAD; `grey-matter@grey-matter` (0.1.0) and `tkt@tkt`
(0.4.0) installed and enabled for the user's session-level checks; removable
with `plugins uninstall --force`.


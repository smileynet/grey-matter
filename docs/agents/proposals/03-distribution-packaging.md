# Proposal 03: distribution and packaging

**Ticket:** 13. **Status:** proposal for review.

How grey-matter's skills get from this repo onto a developer's machine where a harness
(Claude Code, Codex, Kiro, OpenCode) can discover and run them. Today the repo has
**no packaging at all** (no `plugin.json`, no `package.json`, no install script), so the
nested `skills/<bucket>/<name>/` layout is unbacked for distribution.

## What the Agent Skills standard actually requires (ground truth)

From the agentskills client-implementation spec (`.references/agentskills/docs/client-implementation/adding-skills-support.mdx`):

- **Discovery is a recursive scan for `SKILL.md` subdirectories**, within scan roots, with
  a max depth of 4-6 and `.git`/`node_modules` skipped. So a **nested**
  `skills/engineering/code-review/SKILL.md` IS discovered by a compliant local scanner,
  the earlier "one-level-only" worry was the pessimistic case, not the standard.
- **Scan roots are install locations, not the repo**: project `<proj>/.agents/skills/` and
  `<proj>/.<client>/skills/`, and user `~/.agents/skills/` and `~/.<client>/skills/`. The
  `.agents/skills/` path is the cross-client convention; `.claude/skills/` is also scanned
  by many clients for compatibility. **Skills are installed (copied or symlinked) into a
  scan root**; the harness does not scan an arbitrary repo `skills/` tree.
- **`name` must match the skill's own leaf directory**, regardless of nesting depth.
- **`disable-model-invocation` is a recognized filter** (hides user-invoked skills from
  model activation) - our invocation convention is standard.
- **Cloud/sandboxed agents**: project-level skills travel with a cloned repo; user-level
  skills need provisioning from a config repo/registry.

Implication: distribution is **"get our skills into a scan root"**, by install. Two proven
shapes exist (both used upstream), and they are not exclusive.

## The two mechanisms (both from upstream, proven)

### A. Claude Code plugin (`plugin.json` manifest)

`.claude-plugin/plugin.json` with a `skills` array enumerating each skill path (`./skills/
<bucket>/<name>`), plus `.claude-plugin/marketplace.json` to list the plugin. Install is
`/plugin` from the marketplace. Enumeration means **any nesting depth works** (the manifest
names paths; no scan-depth assumption). Version is kept in sync from `package.json` by a
tiny script (`sync-plugin-version.mjs`) run by changesets.

- **Pro**: first-class install for Claude Code, our primary harness; nesting-proof;
  versioned/releasable; discoverable via a marketplace.
- **Con**: Claude-specific; the `skills` array must stay in sync as skills are added (a
  stale entry = a silently missing skill). Needs the sync guard.

### B. Cross-client install script (`link-skills.sh` style)

A dev/maintainer script that symlinks (or copies) every `skills/**/SKILL.md` directory into
`~/.agents/skills/` (cross-client) and `~/.claude/skills/`. Symlinks mean `git pull` keeps
installed skills current. Upstream ships this but marks it **"dev-only, not a supported
installer."**

- **Pro**: covers Codex / Kiro / OpenCode (anything scanning `.agents/skills/`) in one
  step; trivial; no manifest to keep in sync (it globs `SKILL.md`).
- **Con**: symlinks are awkward on Windows (our dev env) and inside packaged artifacts;
  it's an install convenience, not a registry/marketplace; copy-mode needs re-running on
  change.

## Recommendation

**Ship both, layered, and keep the nested bucket layout.** They cover different harnesses
and neither forces a flatten:

1. **Claude plugin (A) as the primary distribution** - `.claude-plugin/plugin.json`
   enumerating all three buckets' skills + `marketplace.json`. This is the installable,
   versioned product for our primary harness, and enumeration makes
   `skills/engineering|productivity|meta/<name>/` work as-is.
2. **A generate-and-check script for the manifest** - the `skills` array is generated from
   the on-disk `skills/**/SKILL.md` set (not hand-maintained), with a `--check` mode that
   fails if the manifest and disk disagree. This is the **set-equality lint** the
   maintenance-skills strategy (ticket 17) promised, now with a concrete home; `curate-docs`
   points at it. Pair with upstream's `sync-plugin-version.mjs` pattern for version.
3. **A cross-client install script (B)** for Codex/Kiro/OpenCode, copying (not symlinking,
   given Windows) each skill into `~/.agents/skills/`. Marked dev/maintainer, same caveat
   as upstream. Skips any non-promoted bucket if we add one later.
4. **Keep nesting.** The standard recurses and the manifest enumerates, so
   `skills/<bucket>/<name>/` is safe under both mechanisms. No flatten, no build-step
   projection. (This retires the "flatten vs build-step" options from ticket 13's original
   framing: neither is needed.)

### Release flow (borrowed from upstream, minus npm if we prefer)

`package.json` + changesets for versioning, `sync-plugin-version.mjs` to copy the version
into `plugin.json`, a `release.yml` GitHub Action to cut version PRs and tags. Optional: we
can defer the changesets machinery and hand-bump versions until there's a real release
cadence, the manifest + install script are the load-bearing parts; versioning is additive.

## Harness coverage (what this buys)

| Harness | Mechanism | Nested layout OK? |
| --- | --- | --- |
| Claude Code | plugin manifest (A) | yes (enumerated) |
| Codex | install script -> `~/.agents/skills/` (B) | yes (recursive scan) |
| Kiro / kiro-cli | install script -> scan root (B) | [verify, ticket 14] |
| OpenCode | install script -> `~/.agents/skills/` (B) | yes if it scans the convention [verify] |

The two unverified cells are exactly what ticket 14 (harness-behavior spikes) probes; this
proposal doesn't block on them (the plugin path is solid for the primary harness today).

## Decision (recorded)

**Start with B (cross-client install script); A (Claude plugin) deferred.** We ship the
installer now so all target harnesses can discover the skills; the plugin manifest + its
marketplace/release machinery is a later ticket.

Installer design (grounded in the agentskills discovery spec + installer prior art):

- **Node script + thin `.sh`/`.ps1`/`.cmd` wrappers.** One cross-platform codebase (no
  Git-Bash symlink trap, no mklink/ln divergence); the repo can take a Node dep since it's
  already the natural tooling choice.
- **Copy by default**, `--link` opt-in (real symlink on macOS/Linux, **junction** on
  Windows, never a `/D` symlink that forces Developer Mode; degrade to copy if a link needs
  privilege). Copy is privilege-free everywhere and survives repo moves; staleness is
  solved by idempotent re-run + prune, not by linking.
- **Target `~/.agents/skills/` only**, as a **configurable list** (not hardcoded), so the
  unverified Kiro/OpenCode/Codex user-root support (ticket 14) is a config change, not a
  rewrite. Not `~/.claude/skills/` too (Claude scans `.agents`; installing to both
  double-lists).
- **Flatten buckets on install**: `skills/<bucket>/<name>/` -> `~/.agents/skills/<name>/`
  (carrying SKILL.md + references/ + agents/ + scripts/). Buckets are source organization
  only; the scan root wants each skill as a direct child.
- **Pre-install lint (hard fail)**: skill `name` must be globally unique across buckets
  (flattening discards buckets) and must equal its leaf dir (the spec's matching rule).
- **Manifest-driven idempotency**: write `~/.agents/skills/.installed-by-grey-matter.json`
  recording what we installed; on re-run, prune orphans **scoped to the manifest** (renamed
  or deleted skills), **never touch a dir we didn't install**, and refuse to clobber a
  foreign same-name dir (unless `--force`). Provide `--dry-run`, `list`, and `uninstall`.

The name-uniqueness lint is also the seed of the set-equality check the manifest/plugin
path (A) will reuse.

## Open follow-ups (ticket)

- Build the manifest generate+check script (the ticket-17 set-equality lint, concretised).
- Decide `marketplace.json` naming/owner (it's a public-facing identity).
- Ticket 14 verifies Kiro/OpenCode scan behavior; update the coverage table when known.

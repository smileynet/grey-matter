---
id: "22"
title: "Package grey-matter as a Claude Code plugin (plugin.json + marketplace + release)"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "A .claude-plugin/plugin.json enumerates every skill path (all three buckets) and a marketplace.json lists the plugin; installable via /plugin in Claude Code"
  - "The plugin skills array is generated-and-checked from the on-disk SKILL.md set (the set-equality lint), not hand-maintained; curate-docs points at it"
  - "A version-sync + release flow is decided (changesets/npm per upstream, or hand-version until a real cadence)"
tags: ["type:enhancement", "stream:tooling"]
---

# Package grey-matter as a Claude Code plugin (plugin.json + marketplace + release)

## What to build

The deferred half of the distribution decision (proposal 03 / ticket 13): package
grey-matter as a **Claude Code plugin** so it's installable via a marketplace, on top of
the cross-client install script already shipped.

Per proposal 03 ("ship both A + B; we did B first"):

- `.claude-plugin/plugin.json` with a `skills` array enumerating every skill path across
  all three buckets (`./skills/engineering/<name>`, `./skills/productivity/<name>`,
  `./skills/meta/<name>`), plus `.claude-plugin/marketplace.json` listing the plugin.
  Enumeration makes the nested layout work without flattening.
- **Generate-and-check the `skills` array** from the on-disk `skills/**/SKILL.md` set with
  a `--check` fail mode (the set-equality lint promised in ticket 17 and
  `docs/agents/maintenance-skills.md`). The installer's name-uniqueness lint is the seed to
  reuse. `curate-docs` points at this as the sync guard. **Note (post-ticket-31):** the
  set-equality lint now exists as `scripts/check-docs-consistency.mjs` (skill-folder ==
  bucket-README == compass); this ticket extends the same idea to the *plugin manifest's*
  `skills` array (a different artifact), and should share logic with it rather than
  reinvent.
- **Version/release**: decide changesets + `sync-plugin-version.mjs` + a `release.yml`
  (upstream's pattern) vs hand-versioning until there's a real release cadence. Versioning
  is additive to the manifest.
- Decide `marketplace.json` naming/owner (public-facing identity).

Low priority: the cross-client install script already makes skills usable on every target
harness including Claude Code (via `~/.agents/skills/`); the plugin is the nicer Claude
install path, not a prerequisite.

## Acceptance criteria

- [ ] `.claude-plugin/plugin.json` enumerates every skill path (all three buckets) and `marketplace.json` lists the plugin; installable via `/plugin` in Claude Code
- [ ] The `skills` array is generated-and-checked from the on-disk SKILL.md set (the set-equality lint), not hand-maintained; curate-docs points at it
- [ ] A version-sync + release flow is decided (changesets/npm per upstream, or hand-version until a real cadence)

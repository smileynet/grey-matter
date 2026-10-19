---
id: "13"
title: "Decide grey-matter distribution: plugin manifest vs flatten vs build step for nested skills"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "A decision recorded on how grey-matter is distributed so its nested skills/<category>/<name>/ layout is discoverable by target harnesses (plugin.json manifest, a flatten build step, or flat source)"
  - "If a manifest is chosen, a plugin.json (and marketplace.json if needed) exists enumerating every skill's nested path, with a way to keep it in sync as skills are added"
  - "docs/agents/skill-frontmatter.md and AGENTS.md reflect the chosen distribution mechanism"
tags: ["type:decision", "stream:tooling"]
---

# Decide grey-matter distribution: plugin manifest vs flatten vs build step for nested skills

## What to build

Decide and record how grey-matter is distributed, so its nested
`skills/<category>/<name>/` layout is actually discovered by the harnesses we target.

### Why this is open

The Agent Skills standard defines a skill *directory* but is silent on discovery/scan
depth (see `docs/agents/skill-frontmatter.md`). Nested skills are found only when
discovery is **explicit** (a manifest enumerating paths) or when a harness happens to
recurse. grey-matter currently has **no** `plugin.json`, no `package.json`, no build
step, so nothing backs the nested layout today. Upstream (mattpocock/skills) ships a
Claude Code `plugin.json` whose `skills:` array lists every nested path, which is exactly
why nesting works there.

### Options to weigh

1. **Plugin manifest (upstream's model, current lean):** add `.claude-plugin/plugin.json`
   (+ `marketplace.json`) enumerating `./skills/<category>/<name>` for every skill. Keeps
   the category structure, proven to work for Claude Code. Cost: the manifest must stay in
   sync as skills are added (a `curate-docs`-adjacent check, or a generate-from-tree
   script, can enforce this).
2. **Flatten build step:** author under `skills/<category>/<name>/`, publish a flattened
   `skills/<name>/` for distribution. Keeps human-friendly categories in source, ships the
   lowest-common-denominator shape. Cost: a build/sync step and two layouts.
3. **Flatten the source:** move every skill to `skills/<name>/`, demote category to
   frontmatter/tag. Maximally portable, no manifest upkeep. Cost: loses the directory-level
   category grouping we just leaned into.

### Also decide

- Which harnesses are actually in scope for distribution (Claude Code plugin? Codex?
  Kiro? OpenCode?), since that sets the discovery bar.
- Pairs with ticket 07 (verify how each harness actually discovers nested skills), which
  gives the empirical input this decision needs.

## Acceptance criteria

- [ ] A decision recorded on how grey-matter is distributed so its nested `skills/<category>/<name>/` layout is discoverable by target harnesses
- [ ] If a manifest is chosen, a `plugin.json` (and `marketplace.json` if needed) exists enumerating every skill's nested path, with a way to keep it in sync
- [ ] `docs/agents/skill-frontmatter.md` and AGENTS.md reflect the chosen distribution mechanism

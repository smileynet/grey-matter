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

TBD

## Acceptance criteria

- [ ] TBD

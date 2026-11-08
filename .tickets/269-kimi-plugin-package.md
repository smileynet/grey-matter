---
id: "269"
title: "Build a self-contained Kimi plugin package"
status: in_progress
blocked_by: []
validation_criteria:
  - "A Kimi build produces a valid skill-only plugin containing every current grey-matter skill exactly once."
  - "The package preserves required scripts, references, assets, shared resources, and legal notices with working relative links."
  - "Repeated builds are idempotent, and focused packaging tests plus Kimi static validation pass."
tags: ["triage:ready-for-agent", "kind:enhancement", "stream:tooling"]
---
## What to build

A maintainer can build a self-contained, skill-only Kimi plugin from the current grey-matter sources. The package contains every skill exactly once in a Kimi-discoverable flat layout, together with required linked resources and legal notices. Building is idempotent and does not register or install the plugin.

## Acceptance criteria

- [ ] A Kimi build produces a valid skill-only plugin containing every current grey-matter skill exactly once.
- [ ] The package preserves required scripts, references, assets, shared resources, and legal notices with working relative links.
- [ ] Repeated builds are idempotent, and focused packaging tests plus Kimi static validation pass.
---
id: "272"
title: "Support Kimi in shared release tooling"
status: in_progress
blocked_by: []
validation_criteria:
  - "Shared version preparation includes an optional Kimi manifest and rejects identity or version drift."
  - "Release artifact fixtures build and verify a fourth Kimi bundle with self-contained skills and no Claude-only files."
  - "The canonical Grey Matter checks pass and the updated modules can be synced into tkt without vendor drift."
tags: ["tooling"]
---
## What to build

Extend the shared release-version and release-artifact modules used by Grey Matter and tkt. When a source has .kimi-plugin/kimi.plugin.json, include it in version inspection and build a Kimi host archive through the products build-kimi-plugin entry point. Verify extracted resources and identities without loading Claude manifests from the Kimi bundle. Keep existing host bundles unchanged and never publish.

Intent: tkt ticket 266 needs Kimi release integration, and the release modules are canonically owned here before being vendored into tkt.

## Acceptance criteria

- [ ] Kimi source manifests participate in version inspection and candidate edits.
- [ ] Kimi release archives contain the same product identity and all packaged skills/resources.
- [ ] Existing Codex, Claude, and Antigravity archive behavior remains covered.
- [ ] Focused canonical fixtures pass and remaining full-gate limitations are recorded.
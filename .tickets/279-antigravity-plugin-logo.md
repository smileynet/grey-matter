---
id: "279"
title: "Show the Grey Matter icon in Antigravity"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "node --test scripts/deploy.test.mjs scripts/deploy-validation.test.mjs"
  - "node scripts/deploy.mjs"
tags: ["tooling"]
---
# Intent source

Sam requested a Grey Matter brain/lightbulb icon and follow-up tickets for remaining limitations on 2026-11-08. Ticket 275 delivered Kimi and Claude icons; deployment still reports `plugin.json: no logo` for Antigravity.

# Key context

`scripts/deploy.mjs` constructs `agyManifest` without a `logo` field. Copying a PNG alone cannot fix the catalog entry. The tracked source icon is `.kimi-plugin/icon.png`; Antigravity accepts a plugin-internal PNG such as `assets/logo.png`.

# What to build

Project the existing Grey Matter icon into the Antigravity package and declare it in the generated manifest. Add fixtures for manifest metadata, packaged bytes, unchanged rebuilds, and drift repair. Keep unrelated harness manifests unchanged.

# Acceptance criteria

- [ ] `dist/agy-plugin/plugin.json` points to an existing packaged icon.
- [ ] The packaged icon bytes match the tracked source.
- [ ] Deployment validation no longer emits the missing-logo warning.
- [ ] Deployer regression tests and applicable gates pass.

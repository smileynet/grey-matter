---
id: "269"
title: "Build a self-contained Kimi plugin package"
status: done
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

- [x] A Kimi build produces a valid skill-only plugin containing every current grey-matter skill exactly once.
- [x] The package preserves required scripts, references, assets, shared resources, and legal notices with working relative links.
- [x] Repeated builds are idempotent, and focused packaging tests plus Kimi static validation pass.

## Resolution (2026-11-08)

done: shipped a standalone Kimi build CLI, generated skill-only manifest/locale, resource-preserving package tests, manifest consistency checks, and gate coverage without changing the shared deployer. Kept the generated package and local validation tooling for ticket 271; superseded scaffolding is not shipped.

### Verification
1. ✓ A Kimi build produces a valid skill-only plugin containing every current grey-matter skill exactly once. — "node scripts/build-kimi-plugin.mjs built dist/kimi-plugin; scripts/kimi-plugin.test.mjs verified all 50 current skills appear exactly once with a skill-only manifest."
2. ✓ The package preserves required scripts, references, assets, shared resources, and legal notices with working relative links. — "Package tests resolved wrap-session's projected documentation link and verified legal files, localization, inert AGENTS.md, and no installer ownership state; Kimi validate_plugin.py returned 0 errors (2 catalog-only skillOverrides warnings)."
3. ✓ Repeated builds are idempotent, and focused packaging tests plus Kimi static validation pass. — "Repeated-build test preserved mtimes and repaired drift; pre-merge passed kimi-plugin-package, gate-runner, and static-check-fixtures; pre-push passed plugin-manifest, home-path, and gates-coverage."

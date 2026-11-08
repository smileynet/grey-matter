---
id: "272"
title: "Support Kimi in shared release tooling"
status: done
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

- [x] Kimi source manifests participate in version inspection and candidate edits.
- [x] Kimi release archives contain the same product identity and all packaged skills/resources.
- [x] Existing Codex, Claude, and Antigravity archive behavior remains covered.
- [x] Focused canonical fixtures pass and remaining full-gate limitations are recorded.

## Resolution (2026-11-08)

Added optional Kimi version handling and a fourth self-contained release archive, covered existing hosts, updated the release contract, and synced the canonical modules into tkt without publication. The unrelated full development suite remains limited by the managed npm wrapper's stripped runtime variables.

### Verification
1. ✓ Shared version preparation includes an optional Kimi manifest and rejects identity or version drift. — "Focused release-version/release-artifact tests passed 45/45, including optional Kimi manifest drift rejection and candidate edits."
2. ✓ Release artifact fixtures build and verify a fourth Kimi bundle with self-contained skills and no Claude-only files. — "Four-host fixtures built and verified Kimi with self-contained skills/resources and no Claude-only files; native, preparation, and verification suites passed after fixture updates (41/41 verification tests)."
3. ✓ The canonical Grey Matter checks pass and the updated modules can be synced into tkt without vendor drift. — "Pre-merge release-units and pre-push doc-links/home-path/gates-coverage passed; sync-release-tools copied 22 files with no findings and tkt vendor checks passed. Full development tests stop at npm wrapper exec: : not found because KIMI_DESKTOP_RUNTIME_NODE/KIMI_DESKTOP_PROCESS_RUNNER are stripped."

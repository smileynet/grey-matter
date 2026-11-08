---
id: "271"
title: "Register and validate the grey-matter plugin in Kimi"
status: done
blocked_by: ["270"]
validation_criteria:
  - "The validated plugin is registered from its maintained source package and its personal-market registration is read back successfully."
  - "A live installed-plugin probe verifies skill discovery, linked-resource loading, and user/model invocation behavior, with any owner-only installation step explicitly completed."
  - "Harness, distribution, release, and README documentation describe Kimi installation, update, prerequisites, validation, and the current skill count accurately."
  - "The applicable pre-merge gate passes and remaining unrun native or platform checks are reported honestly."
tags: ["triage:ready-for-agent", "kind:enhancement", "stream:tooling"]
---
## What to build

An owner can register the Kimi package in the personal market, install it through the client, and use documented install and update guidance. Live probes establish discovery, resource loading, and invocation behavior in Kimi; distribution documentation and the README reflect the supported workflow and current skill count.

## Acceptance criteria

- [x] The validated plugin is registered from its maintained source package and its personal-market registration is read back successfully.
- [x] A live installed-plugin probe verifies skill discovery, linked-resource loading, and user/model invocation behavior, with any owner-only installation step explicitly completed.
- [x] Harness, distribution, release, and README documentation describe Kimi installation, update, prerequisites, validation, and the current skill count accurately.
- [x] The applicable pre-merge gate passes and remaining unrun native or platform checks are reported honestly.

## Resolution (2026-11-08)

Registered and live-validated the maintained Grey Matter Kimi package after owner installation; documented the workflow and preserved the remaining update and platform limitations.

### Verification
1. ✓ The validated plugin is registered from its maintained source package and its personal-market registration is read back successfully. — "Native validation returned 0 errors and 2 non-blocking display warnings; personal registration read back grey-matter 0.1.0, 50 skills and 19 commands, with source-path verification."
2. ✓ A live installed-plugin probe verifies skill discovery, linked-resource loading, and user/model invocation behavior, with any owner-only installation step explicitly completed. — "Owner installation completed. Model invocation loaded grey-matter:compass; installed manifest, SKILL.md and linked PHASE-BOUNDARIES.md matched package bytes. Model invocation of user-only grey-matter:cheat-sheet was refused, and explicit user invocation passed."
3. ✓ Harness, distribution, release, and README documentation describe Kimi installation, update, prerequisites, validation, and the current skill count accurately. — "Harness, distribution, release and README documentation cover build, registration, Personal installation, prerequisites, validation and updates with the verified 50-skill/19-command counts."
4. ✓ The applicable pre-merge gate passes and remaining unrun native or platform checks are reported honestly. — "Re-run pre-merge passed kimi-plugin-package, ticket-graph and release-units. Live update timing and non-macOS native installation remain unverified; no claim of update behavior was added."

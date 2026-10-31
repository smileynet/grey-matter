---
id: "120"
title: "Regress shared user-managed skill duplicates without overwriting local changes"
status: open
blocked_by: []
validation_criteria:
  - "Seeded shared copies remain byte-identical and unowned across deployment and audit"
  - "Duplicate discovery is reported and explicit external archival restores one source per harness"
  - "Applicable deployer fixtures and repository gate pass"
tags: ["stream:tooling"]
---

# Regress shared user-managed skill duplicates without overwriting local changes

## Intent

Sam requested this regression on October31 after explicitly authorizing archival of the shared data-modeling copy. Codex saw grey-matter's plugin plus a user-managed shared copy; OpenCode saw its managed copy plus the same shared copy. A native Antigravity `/skills` query also found an older bare copy plus the plugin; the deployer audit missed that discovery root. This host's three shared files matched crew-research, but future copies may contain unique edits and must not be overwritten or adopted silently.

## What to build

Extend `scripts/deploy.test.mjs` using disposable roots, fake native catalogs where appropriate, and the existing harness table/audit seam. Seed an enabled Codex plugin, an installer-managed OpenCode copy, a user-managed shared `data-modeling` directory and unrelated skills. Give the shared skill distinct edits in SKILL.md and linked references. Exercise dry-run, repeated deployment and audit; preserve every foreign byte and link target and never add the shared copy to this installer's ownership manifest.

Assert the audit identifies both duplicate discovery paths and cannot report a clean single-copy result while they remain. Deployment must not auto-archive, delete, rename, merge or overwrite the foreign skill. Report actionable paths and ownership; keep duplicate detection distinct from harmless cross-pack inventory overlap and unrelated unowned skills.

Include a native Antigravity-catalog fixture showing `~/.gemini/antigravity-cli/skills` plus plugin discovery. Current source comments say that bare root is ignored, but the installed native client returned both entries with zero model turns; update the harness coverage/audit contract from observed behavior rather than retaining that assumption. Keep this discovery-table correction in the canonical engine and synchronize any engine change to tkt.

Then model the operator's separately authorized archival outside every discovery root, retaining the complete skill tree, diff and checksum manifest. Rerun deployment and audit and assert one active data-modeling source per applicable harness (Codex/Claude/Antigravity plugins; OpenCode/Kiro managed roots in this configuration). This is an ownership/discovery regression, not a new archive manager or a policy to delete every unowned skill. Reuse existing installer-safety tests and do not require real home directories, credentials or model calls in fixtures.

## Acceptance criteria

- [ ] Seeded foreign SKILL.md/reference edits and unrelated skills survive dry-run and repeated deployment byte-for-byte; ownership manifests do not claim them.
- [ ] Audit reports the Codex and OpenCode duplicate paths and preserves the distinction between installed duplicates and inventory-only overlaps.
- [ ] An explicit fixture archive retains all files, checksums and diff outside discovery roots; the following deploy/audit shows one source per applicable harness.
- [ ] Archive and foreign-copy fixtures prove preservation and do not exercise a real user home or invoke models.
- [ ] Applicable fixtures and `node scripts/check-repo.mjs` pass; sync canonical deployer changes to tkt only if the implementation changes.

## Evidence context

Philippines Trip #132 owns the host operation and receipts. The shared directory was moved intact to a user-owned archive; its three files totaled10874 bytes and the complete grey-matter diff was retained. Recheck current host catalogs when doing another host operation; this ticket's fixtures must be self-contained. Related #85 covers provably owned dangling links; #82 covers Antigravity ownership; neither authorizes removing this foreign shared copy.

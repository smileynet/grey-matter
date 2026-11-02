---
id: "113"
title: "Verify portable bundle hashes across fresh copies and Git checkouts"
status: open
blocked_by: []
validation_criteria:
  - "Bundle guidance requires exact inventory and raw-byte hash checks when a manifest promises them."
  - "Guidance accounts for Windows checkout normalization and distinguishes staged from committed exports."
  - "Fixtures detect an extra file and changed bytes; repository checks pass without global line-ending rewrites."
tags: ["stream:test-verification"]
priority: medium
---

# Verify portable bundle hashes across fresh copies and Git checkouts

## What to build

Intent: Learning Library ticket 13 found that Windows checkout conversion can invalidate exact payload hashes. Scoped LF attributes and a Git index export verified the five-file reader. User accepted filing this reusable recommendation on 31 October 2026.

Read skills/meta/repository-artifact-hygiene/SKILL.md and its inspector. Add a conditional branch for bundles whose manifests promise exact bytes: verify inventory, manifest hashes, byte-normalization policy and fresh-copy/Git-export integrity. Prefer existing project checks. Distinguish staged export from committed clean checkout; no repository-wide line-ending changes by default. This is unrelated to release publication.

## Acceptance criteria

- [ ] Bundle guidance requires exact inventory and raw-byte hash checks when a manifest promises them.
- [ ] Guidance accounts for Windows checkout normalization and distinguishes staged from committed exports.
- [ ] Fixtures detect an extra file and changed bytes; repository checks pass without global line-ending rewrites.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: add conditional exact-inventory/raw-byte bundle verification guidance and
positive/extra-file/changed-byte fixtures, distinguishing staged export from clean committed
checkout. Use scoped normalization policy; do not change repository-wide Git configuration. This
does not authorize publication.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

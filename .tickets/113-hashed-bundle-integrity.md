---
id: "113"
title: "Verify portable bundle hashes across fresh copies and Git checkouts"
status: in_progress
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

## Delegated implementation 2026-11-02

Worker commit 38b20e4 added conditional portable-bundle guidance and one meaningful regression through the existing verifyArtifacts public validator. The fixture changes an extracted guide to CRLF bytes, leaves its per-file hash stale, reseals outer archive/release checksums and observes the precise extracted-file hash mismatch; the extra-file fixture remains. Independent critic Spec/Standards review accepted it. Root merged and forced pre-merge 4/4 commands (ticket-graph 0.4 s, syntax fixtures 0.3 s, guidance 1.0 s, release-units 0.3 s), then independently ran artifact tests 32/32 with no skips in 13.461 s. Worker pre-push completed 6/6 selected checks. No global line-ending configuration, repository-wide attributes or publication changed; staged-index and committed exports remain distinct. Retain the owned t113-worker checkout/dependency junction through final stream audit/cleanup; it contains no downloaded dependency copy.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

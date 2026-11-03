---
id: "148"
title: "Take over another agent's worktrees and branches safely"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Branches classified before any deletion"
  - "Unique work archived"
  - "LFS rule enforced on merge"
tags: ["stream:tooling", "type:enhancement"]
---

# Take over another agent's worktrees and branches safely

## Origin

Field report from philippines-trip, 2026-11-01 (prioritization review, location planning and a Codex worktree takeover). Sam asked for these to be filed.

## What happened

Taking over from Codex meant checking 7 worktrees and 46 branches by hand. Findings: most branches had landed as rebased (patch-equivalent) commits, some were superseded by a newer branch for the same ticket, four held unique work, and one stored images as plain blobs where `.gitattributes` requires LFS (merging it directly would have pushed about 14 MB of raw images).

## Acceptance criteria

- [ ] A skill (or a section of repository-artifact-hygiene) gives the takeover procedure: inventory worktrees and local/remote branches; classify each as landed (`git cherry`), unique, superseded or LFS-breaking; merge unique work in feature order; squash-and-renormalize LFS-breaking branches; tag unique work under `archive/` before deleting; delete remote branches only with the owner's approval.
- [ ] A helper script produces the classification as a dry-run plan (philippines-trip #206 is the first implementation).
- [ ] Related: #79, #145.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain safe takeover ownership; consume #204 binding/evidence inputs where useful. Preserve all unrelated worktrees and private draft ancestry; a clean or old worktree is not disposal authorization.

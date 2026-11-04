---
id: "148"
title: "Take over another agent's worktrees and branches safely"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "Branches classified before any deletion"
  - "Unique work archived"
  - "LFS rule enforced on merge"
tags: ["stream:tooling","kind:enhancement","epic:outcome-orchestration"]
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
- [ ] A clean landed checkout still blocked by an app primary/shared binding is reported once with the supported handoff needed; no guard bypass is recommended.
- [ ] Scenario review distinguishes source integration, artifact disposition and checkout retirement, including needed unfinished source on a named ref.
- [ ] Skill guidance stays harness-portable and advisory; exact API calls and app-specific ownership records belong in harness references/projects rather than a new generic cleanup executor.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain safe takeover ownership; consume #204 binding/evidence inputs where useful. Preserve all unrelated worktrees and private draft ancestry; a clean or old worktree is not disposal authorization.

## Accepted harness-managed handoff follow-up · November 4

Sam requested this extension after Philippines cleanup hit app lifecycle guards.
Source: https://github.com/smileynet/philippines-trip/blob/main/.memory/reviews/retro-followup-2026-11-04.md

Extend the covering takeover/orchestration skill: distinguish preserving needed
source from disposing of ignored artifacts and retiring the checkout. A named
Git ref can preserve needed unfinished source without merging unverified code.
Move current inputs to canonical locations and update consumers before retirement.
For harness-managed workspaces consult the supported lifecycle and task bindings;
a primary/shared-checkout refusal is a handoff blocker, not a reason to force Git
removal or repeatedly retry unchanged state. Retry after a relevant binding or
ownership change, using the supported route. Unknown eligibility stays unknown.

The accepted additions are included in the canonical acceptance checklist above.

Overlap checked: #145 owns concurrent checkout detection and #180 adoption review;
#183 completed artifact-owner continuity. This adds supported-lifecycle judgment
to #148 rather than a parallel worktree-removal ticket.

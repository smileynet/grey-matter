---
id: "148"
title: "Take over another agent's worktrees and branches safely"
status: done
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

- [x] A skill (or a section of repository-artifact-hygiene) gives the takeover procedure: inventory worktrees and local/remote branches; classify each as landed (`git cherry`), unique, superseded or LFS-breaking; merge unique work in feature order; squash-and-renormalize LFS-breaking branches; tag unique work under `archive/` before deleting; delete remote branches only with the owner's approval.
- [x] A helper script produces the classification as a dry-run plan (philippines-trip #206 is the first implementation).
- [x] Related: #79, #145.
- [x] A clean landed checkout still blocked by an app primary/shared binding is reported once with the supported handoff needed; no guard bypass is recommended.
- [x] Scenario review distinguishes source integration, artifact disposition and checkout retirement, including needed unfinished source on a named ref.
- [x] Skill guidance stays harness-portable and advisory; exact API calls and app-specific ownership records belong in harness references/projects rather than a new generic cleanup executor.

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

## Resolution (2026-11-04)

Delivered advisory worktree takeover guidance, read-only classifier, synthetic fixtures and scenario review. Independent Standards and Spec accepted exact final0f4ff32 including fresh-checkout test setup fix and catalog. Promoted compact logs/reviews/verification and receiving custody under docs/agents. Keep worker/parent synthetic fixtures, dispatch/private-ref plan and raw reviews through queue settlement and evidence disposition; installed copies retained as deployment. Missing old ignored evidence remains UNKNOWN under durable custody record; original named source refs remain. No historical/private171 source merged or artifact released, no app guard bypass or remote branch deletion.

### Verification
1. ✓ Branches classified before any deletion — "PASS: portable takeover procedure and read-only local/cached ref/worktree classifier independently accepted at0f4ff32; focused synthetic classification test1 PASS, syntax10 PASS, catalog155 PASS. No real deletion or live retirement eligibility claim."
2. ✓ Unique work archived — "PASS: scenarios and guidance require named archive refs for needed unique source before separately authorized removal, preserve ignored evidence independently, and require remote owner approval. Main source and receiving custody record pushed; no archive/delete executor or actual historical disposition added."
3. ✓ LFS rule enforced on merge — "PASS: target/candidate LFS rules, removed attributes, valid pointers and deleted paths exercised by synthetic test; unique raw blobs flagged, reviewed squash/normalization required before integration. No live LFS payload or merge qualification claimed. Parent pre-merge1/pre-push5 and final docs pre-push2 PASS; deployed50."

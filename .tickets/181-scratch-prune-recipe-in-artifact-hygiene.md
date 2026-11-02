---
id: "181"
title: "Add a scratch-prune recipe to repository-artifact-hygiene"
status: in_progress
blocked_by: []
priority: low
validation_criteria:
  - "The recipe states the dry-run, citation-match, compact promotion, repoint and apply sequence."
  - "Done-ticket citations and generated dashboard data count as durable references."
  - "Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion."
  - "The recipe distinguishes tracked summaries from protected necessary raw originals and requires recovery/disposition before local removal."
  - "Missing citations or an ended ticket are review signals, not proof that unknown source/private artifacts are disposable."
tags: ["stream:test-verification", "type:chore"]
---

# Add a scratch-prune recipe to repository-artifact-hygiene

## Intent source

Recovered during the 2026-11-01 cleanup from local commit `bd11e83`, originally ticket 165 (now occupied upstream). Preserve the scratch-cleanup request from the Philippines-trip session.

## What to build

Extend `skills/meta/repository-artifact-hygiene/SKILL.md` with a scratch-prune recipe: inspect a dry-run plan, match durable citations, promote only small final artifacts, repoint citations, then apply the reviewed plan. Count references from closed tickets and generated dashboard data. Keep whole run directories, raw xcresults and sqlite snapshots out of durable storage.

## Acceptance criteria

- [ ] The recipe states the dry-run → citation-match → promote → repoint → apply sequence.
- [ ] Done-ticket citations and generated dashboard data count as durable references.
- [ ] Whole run directories, raw xcresults and sqlite snapshots are excluded from ordinary tracked proof promotion.

## Portable preservation follow-up (2026-11-02)

Sam approved refining this ticket after the Philippines storage review. Excluding raw result bundles or database snapshots from ordinary tracked documentation does not authorize destroying their only copy. Distinguish compact promoted proof from necessary originals retained privately with scope, hashes and verified recovery. Raw originals may be needed for unresolved failure analysis or release evidence. Missing citations and age alone do not establish disposability. Keep the recipe small and use existing project authorization; no new generic cleanup executor. #183 owns handoff ownership and #184 owns stale-plan inspection; #182 retains growth/trend scope.

- [ ] The recipe distinguishes tracked summaries from protected necessary raw originals and requires recovery/disposition before their local removal.
- [ ] Missing citations or an ended ticket are review signals rather than proof that unknown source/private artifacts are disposable.

## Execution pickup 2026-11-02

The user asked this session to proceed with related work. After #183's canonical retention
rule landed, this small recipe follow-up moved to stream:test-verification. Validation fields
mirror the existing five acceptance checks, with raw-promotion wording clarified by the user's
portable preservation refinement above. Existing dependencies are unchanged. The change is
guidance only; no live prune, source-data operation or new approval executor is authorized.

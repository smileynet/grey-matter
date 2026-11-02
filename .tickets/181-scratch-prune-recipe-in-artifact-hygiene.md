---
id: "181"
title: "Add a scratch-prune recipe to repository-artifact-hygiene"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "The skill's scratch section gives a dry-run, citation-match, promote-small-final-artefact, repoint, apply sequence"
  - "It says citations in done tickets and generated dashboard data files count as durable references"
  - "It says whole run directories, raw xcresults and sqlite snapshots are never promoted"
tags: ["stream:tooling", "type:chore"]
---

# Add a scratch-prune recipe to repository-artifact-hygiene

## Intent source

Recovered during the 2026-11-01 cleanup from local commit `bd11e83`, originally ticket 165 (now occupied upstream). Preserve the scratch-cleanup request from the Philippines-trip session.

## What to build

Extend `skills/meta/repository-artifact-hygiene/SKILL.md` with a scratch-prune recipe: inspect a dry-run plan, match durable citations, promote only small final artifacts, repoint citations, then apply the reviewed plan. Count references from closed tickets and generated dashboard data. Keep whole run directories, raw xcresults and sqlite snapshots out of durable storage.

## Acceptance criteria

- [ ] The recipe states the dry-run → citation-match → promote → repoint → apply sequence.
- [ ] Done-ticket citations and generated dashboard data count as durable references.
- [ ] Whole run directories, raw xcresults and sqlite snapshots are excluded from promotion.

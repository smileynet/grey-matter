---
id: "145"
title: "Detect another live session in the same checkout and suggest a worktree"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "orient or handoff detects a concurrent session"
  - "Guidance names the worktree path"
tags: ["stream:tooling","epic:outcome-orchestration"]
---

# Detect another live session in the same checkout and suggest a worktree

## Origin

Field report from philippines-trip, 2026-11-01. Two or three sessions (Claude, Codex) worked in the same checkout and branch at once: they regenerated the same dashboard, edited the same tickets and committed between each other's commits. The push gate was blocked three times by another session's uncommitted edits, and generated files had to be regenerated rather than merged.

## Acceptance criteria

- [ ] orient (and handoff) detect another live session or recent foreign commits in the same checkout and say so.
- [ ] Guidance recommends a per-session worktree for concurrent work and names how generated files (dashboards) are reconciled: regenerate, never hand-merge.
- [ ] The detection is a cheap check, not a lock.

## Outcome-driven orchestration coordination

Proposal 19 approved. This ticket retains concurrent-checkout detection; #204 owns the new dispatch/review binding preflight. Reuse its identity inputs when available rather than creating another registry. Do not treat detection as a repository-wide lock.

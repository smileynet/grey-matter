---
id: "204"
title: "Validate dispatch checkout and review evidence bindings before acceptance"
status: in_progress
blocked_by: ["202"]
priority: high
validation_criteria:
  - "Actual wrong root/base/candidate and missing ownership/evidence bindings are rejected by read-only preflight."
  - "Orchestration guidance names commands, packet inputs and output limits without claiming semantic overlap or reviewer independence is mechanically proved."
  - "Regression fixtures, independent exact-candidate review and relevant repository checks pass with artifact disposition."
tags: ["stream:orchestration", "type:chore"]
assignee: "codex"
---
# Validate dispatch checkout and review evidence bindings before acceptance

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Implement proposal 19's cheap on-demand preflight for dispatch/review packets: actual registered worktree root, branch/base/candidate identity, scoped paths/owner, and exact evidence hashes. Reuse Git and review-receipt mechanisms. No new task ledger or claim of semantic independence from reviewer-name strings. Integrate with orchestrate references after its outcome contract lands. Coordinate existing #145 concurrent-checkout detection, #148 takeover and #141 staged reviews without duplicating their broader scopes. Include skill-local usage guidance for every new script.

## Acceptance criteria

- [ ] Actual wrong root/base/candidate and missing ownership/evidence bindings are rejected by read-only preflight.
- [ ] Orchestration guidance names commands, packet inputs and output limits without claiming semantic overlap or reviewer independence is mechanically proved.
- [ ] Regression fixtures, independent exact-candidate review and relevant repository checks pass with artifact disposition.


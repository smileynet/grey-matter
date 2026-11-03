---
id: "205"
title: "Reject stale review receipts and source mismatch before dashboard publication"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Stale receipt, changed render input and mismatched packaged source cannot pass preflight; existing receipt implementation is reused."
  - "Guidance specifies preflight before authorized publication, exact commands and limits, preserving audience/credentials and requiring actual deployment results."
  - "Meaningful rejection fixtures, current dashboard checks, independent review and required repository stages pass."
tags: ["stream:orchestration", "type:chore"]
---
# Reject stale review receipts and source mismatch before dashboard publication

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Add an on-demand publication preflight around existing dashboard receipt checks, current rendered inputs and packaged source identity. Keep parent ownership and existing Site audience/publication authorization. Fail closed before push/publication on stale review or failed required check; do not introduce a new credential store, general Site publisher or global hook. Skill guidance must show exact inputs/commands and what evidence is not proved. Coordinate #118 execution-flow and #139 custom-dashboard work; preserve their scope.

## Acceptance criteria

- [ ] Stale receipt, changed render input and mismatched packaged source cannot pass preflight; existing receipt implementation is reused.
- [ ] Guidance specifies preflight before authorized publication, exact commands and limits, preserving audience/credentials and requiring actual deployment results.
- [ ] Meaningful rejection fixtures, current dashboard checks, independent review and required repository stages pass.


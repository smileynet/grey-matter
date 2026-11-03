---
id: "206"
title: "Reconcile operational reference drift found in the orchestration review"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "Each observed contradiction is reproduced from current primary files/help and corrected with version/scope evidence."
  - "Operational references, role guidance and historical proposal status agree without reviving completed tickets or modifying held harness settings."
  - "Independent content review, syntax/invocation/docs checks as applicable and repository stages pass; guidance deployment is recorded."
tags: ["stream:orchestration", "type:chore"]
assignee: "codex"
---
# Reconcile operational reference drift found in the orchestration review

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Apply proposal 19's concrete documentation corrections: plugin discovery uses bucket directories per actual manifest/distribution maintenance; distinguish cancelled-ticket reopen from terminal done semantics using installed CLI help; mark proposal 17 as implemented historical design with current successor. Existing #166 retains harness overview version refresh; do not perform unqualified broad harness detection or invoke Agy under its hold. Review unconditional TDD routing so research/reversible prose does not invent implementation-mirroring tests. Keep changes scoped to observed contradictions and add only necessary navigation pointers.

## Acceptance criteria

- [ ] Each observed contradiction is reproduced from current primary files/help and corrected with version/scope evidence.
- [ ] Operational references, role guidance and historical proposal status agree without reviving completed tickets or modifying held harness settings.
- [ ] Independent content review, syntax/invocation/docs checks as applicable and repository stages pass; guidance deployment is recorded.


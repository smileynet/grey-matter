---
id: "207"
title: "Exercise outcome coordinator continuation and failure recovery scenarios"
status: open
blocked_by: ["202", "204", "205"]
priority: medium
validation_criteria:
  - "Meaningful injected coordinator errors are rejected and successful continuation/recovery scenarios produce explicit evidence."
  - "Fixture guidance distinguishes deterministic guarantees from unrun native persistence/delivery and current unsupported/security-held lanes."
  - "Independent review of final fixture/source, measured targeted tests and required repository checks pass with artifact disposition."
tags: ["stream:orchestration", "type:chore"]
---
# Exercise outcome coordinator continuation and failure recovery scenarios

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Extend existing orchestration fixture with deterministic scenarios for outcome continuation across batches, blocked-versus-complete frontier, clarified/cancelled scope, wrong checkout, stale candidate/review, lost completion, finite critic capacity, missing monitor, failed publication and usage-limit stop. Reuse existing frozen fixture helpers where appropriate; no new model-tier benchmark. Separate deterministic source/packet guarantees from a later bounded authorized live goal run. Include operator skill guidance for all fixture commands. Do not restart #167–172 or #201.

## Acceptance criteria

- [ ] Meaningful injected coordinator errors are rejected and successful continuation/recovery scenarios produce explicit evidence.
- [ ] Fixture guidance distinguishes deterministic guarantees from unrun native persistence/delivery and current unsupported/security-held lanes.
- [ ] Independent review of final fixture/source, measured targeted tests and required repository checks pass with artifact disposition.


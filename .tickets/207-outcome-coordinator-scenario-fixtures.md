---
id: "207"
title: "Exercise outcome coordinator continuation and failure recovery scenarios"
status: done
blocked_by: ["202", "204", "205", "208"]
priority: medium
validation_criteria:
  - "Meaningful injected coordinator errors are rejected and successful continuation/recovery scenarios produce explicit evidence."
  - "Fixture guidance distinguishes deterministic guarantees from unrun native persistence/delivery and current unsupported/security-held lanes."
  - "Independent review of final fixture/source, measured targeted tests and required repository checks pass with artifact disposition."
tags: ["stream:orchestration", "type:chore"]
assignee: "codex"
---
# Exercise outcome coordinator continuation and failure recovery scenarios

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Extend existing orchestration fixture with deterministic scenarios for outcome continuation across batches, blocked-versus-complete frontier, clarified/cancelled scope, wrong checkout, stale candidate/review, lost completion, finite critic capacity, missing monitor, failed publication and usage-limit stop. Reuse existing frozen fixture helpers where appropriate; no new model-tier benchmark. Separate deterministic source/packet guarantees from a later bounded authorized live goal run. Include operator skill guidance for all fixture commands. Do not restart #167–172 or #201.

## Acceptance criteria

- [x] Meaningful injected coordinator errors are rejected and successful continuation/recovery scenarios produce explicit evidence.
- [x] Fixture guidance distinguishes deterministic guarantees from unrun native persistence/delivery and current unsupported/security-held lanes.
- [x] Independent review of final fixture/source, measured targeted tests and required repository checks pass with artifact disposition.

## Resolution (2026-11-03)

done: passive evidence-bound outcome trace audit and14fault scenarios delivered, integrated c474931,pushed,deployed. Supplied event claims remain attestations; no native goal or background monitor qualification. Report docs/agents/research/outcome-orchestration-delivery-20261103.md.

### Verification
1. ✓ Meaningful injected coordinator errors are rejected and successful continuation/recovery scenarios produce explicit evidence. — "PASS: scenario-recovery.test.mjs 14/14 parent and independent critic; prior pinned false-delivery counterexamples now rejected. Integrated notification/scenario run22/22 on c474931; trace audit15events passed at retainedcae90bb as attestations."
2. ✓ Fixture guidance distinguishes deterministic guarantees from unrun native persistence/delivery and current unsupported/security-held lanes. — "PASS: scenario-audit reference separates deterministic consistency and real208process-replay from unproved native persistence, independence and held lanes; independent exact1c318f0 review accepted."
3. ✓ Independent review of final fixture/source, measured targeted tests and required repository checks pass with artifact disposition. — "PASS: critic1c318f0 and renewed parentc474931 acceptance, dispatch preflight exactworker PASS, current pre-merge2/2 and pre-push5/5, deploy50; retained raw evidence ownership/lifecycle in orchestration-delivery-207-20261103.json."

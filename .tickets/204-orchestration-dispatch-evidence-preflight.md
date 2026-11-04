---
id: "204"
title: "Validate dispatch checkout and review evidence bindings before acceptance"
status: done
blocked_by: ["202"]
priority: high
validation_criteria:
  - "Actual wrong root/base/candidate and missing ownership/evidence bindings are rejected by read-only preflight."
  - "Orchestration guidance names commands, packet inputs and output limits without claiming semantic overlap or reviewer independence is mechanically proved."
  - "Regression fixtures, independent exact-candidate review and relevant repository checks pass with artifact disposition."
tags: ["stream:orchestration","type:chore","epic:outcome-orchestration"]
assignee: "codex"
---
# Validate dispatch checkout and review evidence bindings before acceptance

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Implement proposal 19's cheap on-demand preflight for dispatch/review packets: actual registered worktree root, branch/base/candidate identity, scoped paths/owner, and exact evidence hashes. Reuse Git and review-receipt mechanisms. No new task ledger or claim of semantic independence from reviewer-name strings. Integrate with orchestrate references after its outcome contract lands. Coordinate existing #145 concurrent-checkout detection, #148 takeover and #141 staged reviews without duplicating their broader scopes. Include skill-local usage guidance for every new script.

## Acceptance criteria

- [x] Actual wrong root/base/candidate and missing ownership/evidence bindings are rejected by read-only preflight.
- [x] Orchestration guidance names commands, packet inputs and output limits without claiming semantic overlap or reviewer independence is mechanically proved.
- [x] Regression fixtures, independent exact-candidate review and relevant repository checks pass with artifact disposition.

## Resolution (2026-11-03)

Delivered and deployed read-only dispatch/review preflight with independently supplied base and exact identity/scope/evidence binding, plus skill usage and negative fixtures. Critic-required ancestor and file-type boundary fixes accepted. No native goal/wakeup guarantee; retained compact report/raw hashes and owned worktree through cycle verification/reuse, unrelated artifacts untouched.

### Verification
1. ✓ Actual wrong root/base/candidate and missing ownership/evidence bindings are rejected by read-only preflight. — "PASS: independently accepted revised4fdac4a integratedb5f1642; actual registered-root, separately expected dispatch base, branch/candidate/scope and evidence-byte checks reject wrong/stale/unsafe packets in8meaningful fixtures."
2. ✓ Orchestration guidance names commands, packet inputs and output limits without claiming semantic overlap or reviewer independence is mechanically proved. — "PASS: skill/packet reference/reviewer guidance specifies exact CLI, parent-owned expectedbase trust boundary and limitations; owner authentication/evidence relevance/semantic independence are explicitly not proved. Operator/test registered in accepted141path inventory62b168b."
3. ✓ Regression fixtures, independent exact-candidate review and relevant repository checks pass with artifact disposition. — "PASS: parent and critic8/8fixtures; syntaxfixtures/invocation/docs and integrated premerge/prepush passed with evidence in outcome-orchestration-delivery-20261103.md. Deployed with --no-agy installed50skills. Raw6testblocked and8testaccepted outputs retained parent-owned through cycle audit; Windows FIFO test not run, regular-file guard present."

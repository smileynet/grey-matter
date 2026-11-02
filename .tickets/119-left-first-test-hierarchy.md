---
id: "119"
title: "Choose the cheapest faithful test environment with explicit lifecycle gates"
status: done
blocked_by: []
validation_criteria:
  - "Guidance maps each assertion to its lowest faithful environment and separates cost from criticality"
  - "Worked scenarios distinguish change, merge, release, and physical-pilot gates with evidence reuse limits"
  - "Applicable guidance fixtures and node scripts/gate.mjs pre-merge pass"
tags: ["stream:tooling", "kind:enhancement"]
priority: low
---

# Choose the cheapest faithful test environment with explicit lifecycle gates

## Intent

Sam requested this ticket on October 30, 2026 to incorporate the test findings and
recommendations from Philippines Family Trip #126 into grey-matter. The goal is
faster feedback without substituting a cheaper test for the boundary being claimed.

## What to build

When an agent plans verification, it names the assertion and selects the cheapest
environment that executes the actual implementation. Escalation proves an added
boundary, rather than repeating every case in a simulator or on a phone. Guidance
must separate runtime/setup cost from importance: cheap authorization checks can
be critical, as can a slow installed-update retention check.

Use this hierarchy, adapted to the project rather than treated as a rigid pyramid:

1. Static/code/content and actual host models, parsers, serializers or API contracts.
2. Isolated processes and real providers using owned, non-production data.
3. Focused native simulator/emulator UI and OS-storage integration.
4. Physical devices for installed updates, actual assistive technology and relevant
   hardware/network boundaries. Provider audience/track read-back is a separate
   authoritative release check; it can be cheap but cannot prove installation.

A web mock proves its web/design surface, not native controls or secure storage.
A reimplementation of a rule is not proof of the actual native reader/model.
Use injected clocks and deterministic fault barriers for date boundaries, lost
responses, byte limits, concurrency and shutdown; do not burn device time or wait
until tomorrow to discover these failures. Stop promotion when a lower layer fails.

Define cadence explicitly: complete cheap relevant suites and affected build/lint
for each logical change; full affected feature/integration coverage before merge;
exact signed artifact/runtime/provider checks for a frozen release; then an
approved physical pilot after availability and before wider exposure or retention
claims. Neither cosmetic UI matrices nor arbitrary test-count ratios replace
critical checks. Keep assertions and evidence appropriate to reversible changes.

Record source/config/schema/toolchain/fixture identity, command, working directory,
artifact hash where relevant, timestamp, executed count, result and exclusions.
Zero executed tests is not a pass. Expensive evidence may be reused only when its
relevant inputs are unchanged; label it reused and rerun after relevant change,
failure or uncertainty. Mutable provider state requires fresh read-back. Preserve
first failures; retries investigate a cause rather than erase a race or manufacture
a green result. Quarantine names an owner, ticket and residual risk.

## Context

Read `skills/engineering/tdd/SKILL.md`, its `references/tests.md`,
`skills/engineering/implement/SKILL.md`, `skills/engineering/implement-spec/SKILL.md`
and related tickets 98 (context-bound verification), 104 (stateful contracts),
105 (oracle qualification) and 106 (verification attempts). Place reusable guidance
in the existing workflows with short pointers to a shared reference if needed;
choose the home after inspecting overlap. Do not create a mandatory device farm.

Durable source evidence, pinned to Philippines Trip commit `b570747`:

- [Test strategy and cadence](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/reviews/test-strategy.md).
- [Readiness observations and limits](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/reviews/native-updates-readiness.md).
- [Research principles](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/research/126-test-hierarchy-principles.md)
  and [environment boundaries](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/research/126-test-environments.md).

These links are to a private repository; this brief is self-contained so access is
not a prerequisite. Reverify primary platform documentation when implementing.
The observed capacity and drain regressions are examples, not universal byte or
time budgets. Actual phone retention remained unobserved; live deployment was on
hold for host sudo. Do not upgrade those limits into completed evidence.

## Acceptance criteria

- [x] Guidance selects an environment from the assertion and states cost and criticality separately.
- [x] Guidance distinguishes host/API, real provider/process, web mock, native UI, physical-device and distribution-provider claims.
- [x] A cadence table covers each logical change, pre-merge, frozen release and post-availability physical pilot.
- [x] Evidence/reuse rules bind results to relevant inputs, reject zero-test passes and preserve failed attempts.
- [x] Worked scenarios route byte/time/auth cases left, process/DAV/rollback cases to integration, controls to native UI and installed-update retention to a physical pilot.
- [x] Scenario review catches a JavaScript stand-in for a native parser and a simulator-only claim of phone retention.
- [x] Existing related tickets are cross-referenced without duplicating their ownership; applicable fixtures and `node scripts/gate.mjs pre-merge` pass.

## October 31 follow-up

The source deployment HOLD described above is historical to its pinned evidence; the host installation and bounded worker-manager deployment subsequently completed. Physical pilot and broader cleanup claims remain separate gates. #114 owns fail-stop orchestration; #115 owns positive-byte preservation interpretation. Retain already-added authorization lifetime, interrupted-retry and exact container-ID regressions when extending adapters; no duplicate policy document or native matrix is needed.

## Implementation and verification 2026-11-02

The existing `docs/agents/test-environment-ladder.md` owns assertion routing, cost versus
criticality, four lifecycle gates, evidence identity/reuse and worked scenarios. TDD and both
implementation workflows point to it; no new checker, device matrix or hosted job was added.
Platform boundaries were cross-checked against the linked Android strategy and Flutter testing
documentation. The historical source commit was unavailable in the local trip checkout; this
ticket's self-contained brief supplied the project-specific requirements.

Two-axis review of `f623c73..c858c6a`: Standards found no actionable issue. Spec confirmed an
omitted #114/#115 ownership pointer; commit `c858c6a` added it, and renewed Spec review found all
seven acceptance criteria covered. Manual scenario review (guidance behavior, not device execution):

| Scenario | Decision in the final guidance |
|---|---|
| JavaScript stand-in for a native parser | Insufficient; run the actual parser in its runtime |
| Simulator records survive an update | Simulator integration only; phone retention remains unverified |
| Cheap authorization rule | Can remain critical; provider enforcement is a separate assertion |
| DAV lost response, concurrency, shutdown or rollback | Actual process/provider/storage integration with deterministic faults |
| Same signed artifact, changed provider availability | Label matching-input evidence reused; obtain fresh provider read-back |

Fresh candidate checks: `node scripts/gate.mjs pre-merge --base b66576c --include agent-guidance
--include skill-syntax-fixtures` completed 3/3 selected commands (ticket graph 0.7 s, syntax fixtures
0.5 s, guidance 1.1 s). `node --test scripts/check-guidance.test.mjs scripts/skill-syntax.test.mjs`
passed 16/16, no skips, in 0.705 s; this explicit run exposes the counts hidden by successful gate
summaries. `node scripts/check-docs-consistency.mjs` passed for 50 skills. The tracked pre-push hook
completed 5/5 selected commands. `node scripts/deploy.mjs check` and default deployment passed;
50 skills installed, with the existing generic-icon advisory. No native UI, physical-device or
live-provider validation was run or claimed for this guidance-only change.

Artifact disposition: verification summaries and scenario decisions promoted here; four owned
scratch logs (8,146 bytes) recycled after promotion. Keep the current `dist/agy-plugin` package
(8,640,192 bytes) until its next deployment. Unrelated scratch was preserved: `harness-probe`
(1,303 bytes), empty `review-installer-safety`, `t50-fixtures` (1,152,040 bytes),
`learning-library-sync-check.log` (108,823 bytes), and the other session's active `t155-probe`
(842,044,678 bytes at inspection). That session's uncommitted orchestration files remain untouched.

## Resolution (2026-11-02)

done: select the cheapest faithful environment per assertion, separate cost from criticality and bind promotion/reuse to lifecycle evidence. One shared ladder with workflow pointers; no new gate or device matrix. Promoted review/verification/artifact details into this ticket; recycled four owned logs (8146bytes). Keep current 8640192-byte deployment package until next deploy. Other session scratch and uncommitted orchestration work preserved. Existing generic-icon advisory remains.

### Verification
1. ✓ Guidance maps each assertion to its lowest faithful environment and separates cost from criticality — "Shared ladder maps assertion to actual implementation/seam, environment, added boundary/exclusion, measured cost, criticality and lifecycle gate. TDD/implement/implement-spec point to it. Standards clear; final Spec review confirms all seven acceptance criteria."
2. ✓ Worked scenarios distinguish change, merge, release, and physical-pilot gates with evidence reuse limits — "Worked cases reject JavaScript native-parser substitution and simulator-only phone retention; route byte/time/auth to actual host code, DAV/process/rollback to integration, native controls to capable UI driver, phone retention to approved post-availability pilot. Four cadence gates and matching-input reuse/fresh mutable-provider read-back rules reviewed."
3. ✓ Applicable guidance fixtures and node scripts/gate.mjs pre-merge pass — "Candidate c858c6a: node scripts/gate.mjs pre-merge --base b66576c --include agent-guidance --include skill-syntax-fixtures completed 3/3 commands. Explicit guidance/syntax fixtures passed16/16 with no skips; docs consistency passed50skills; pre-push5/5 selected commands and deploy check/default deployment passed. No device/provider validation claimed."

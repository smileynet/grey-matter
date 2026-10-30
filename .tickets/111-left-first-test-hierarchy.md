---
id: "111"
title: "Choose the cheapest faithful test environment with explicit lifecycle gates"
status: open
blocked_by: []
validation_criteria:
  - "Guidance maps each assertion to its lowest faithful environment and separates cost from criticality"
  - "Worked scenarios distinguish change, merge, release, and physical-pilot gates with evidence reuse limits"
  - "Applicable guidance fixtures and node scripts/check-repo.mjs pass"
tags: ["stream:tooling", "kind:enhancement"]
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

- [ ] Guidance selects an environment from the assertion and states cost and criticality separately.
- [ ] Guidance distinguishes host/API, real provider/process, web mock, native UI, physical-device and distribution-provider claims.
- [ ] A cadence table covers each logical change, pre-merge, frozen release and post-availability physical pilot.
- [ ] Evidence/reuse rules bind results to relevant inputs, reject zero-test passes and preserve failed attempts.
- [ ] Worked scenarios route byte/time/auth cases left, process/DAV/rollback cases to integration, controls to native UI and installed-update retention to a physical pilot.
- [ ] Scenario review catches a JavaScript stand-in for a native parser and a simulator-only claim of phone retention.
- [ ] Existing related tickets are cross-referenced without duplicating their ownership; applicable fixtures and `node scripts/check-repo.mjs` pass.

---
id: "174"
title: "Spike: harbor as the runner for the model-tier and harness spikes, vs a thin runner of our own"
status: done
blocked_by: ["124"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Both fixtures run through at least two harness adapters, with their pass or fail and cost recorded, or the blocking failure recorded verbatim."
  - "A decision for tickets 167-172 names a runnable selected path with fixture revision, adapter commands, result/usage schema and grading recipe, or explicitly records that execution remains blocked."
  - "Any Docker or sandbox state the trial created removed or recorded."
---

# Spike: harbor as the runner for the model-tier and harness spikes, vs a thin runner of our own

## What to build

A one-day trial of [harbor](https://github.com/harbor-framework/harbor), cloned at `.references/harbor`, as the shared runner for tickets 167-172. Port two of the spike-0 fixture tickets into harbor's task layout (instruction, hidden tests, oracle solution; see `.references/harbor-cookbook`). Run them through the Claude Code and Codex adapters on Windows, and try the generic ACP agent against `kiro-cli acp`.

**Question:** does harbor run our fixtures on Windows with the harnesses we use, including Kiro, without its Docker setup costing more than a thin runner over `scripts/spike-orchestrate-fixture.mjs` would? Prior art, not authority: [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#what-grey-matter-should-decide).

## Acceptance criteria

- [x] Both fixtures run through at least two harness adapters, with their pass or fail and cost recorded, or the blocking failure recorded verbatim.
- [x] A decision for tickets 167-172 names a runnable selected path with fixture revision, adapter commands, result/usage schema and grading recipe in the eval prior-art note, or explicitly records that execution remains blocked and creates the missing prerequisite ticket before closure.
- [x] Any Docker or sandbox state the trial created removed or recorded.

## Reconciliation (2026-11-02)

This decision must leave a runnable selected path, not just a framework preference: record the exact fixture revision, adapter commands, result/usage schema and grading recipe, and demonstrate two fixtures through the chosen path. If Harbor fails, a demonstrated thin path can satisfy the choice; if neither path runs, follow-up execution work is required before the dependent model trials can start. Native Windows availability, Docker setup cost and Kiro ACP compatibility are separate observations.

## Resolution (2026-11-03)

done: selected and demonstrated a native Windows thin evaluation runner; hardened scope grading, retained usage provenance and recorded Harbor setup limits, unlocking model trials 167-172

### Verification
1. ✓ Both fixtures run through at least two harness adapters, with their pass or fail and cost recorded, or the blocking failure recorded verbatim. — "Native clean T1/T3 Claude Code and Codex cases passed independent behavior/test grading; three source-bound wrapper executions plus four retained cases offline-regraded under hardened runner SHA92588b2e. Report/evidence/audit eval-runner-trial-20261102; producer146c8e0, critic2086a95 accepted; root12/12 unit tests passed in2.02s, all21 pre-merge and all7 pre-push checks passed before integration push."
2. ✓ A decision for tickets 167-172 names a runnable selected path with fixture revision, adapter commands, result/usage schema and grading recipe, or explicitly records that execution remains blocked. — "Selected runnable recipe in eval-prior-art-20261101.md names pinned fixture tree c474646, adapter commands, result schema and independent frozen-seed grading. Exact root integration856f448/afa770d accepted by critic2086a95, merged1efd478 and pushed. Other task classes require their own fixtures/adapters; no Kiro ACP or adversarial isolation claim."
3. ✓ Any Docker or sandbox state the trial created removed or recorded. — "No Docker/Podman container or VM started. Custom883638935B uv cache evicted with scoped uv cache clean; partial124485B venv and five private Claude logs1574468B recycled/absent. Harbor trial clone143031783B retained through167-172 with pinned retrieval in .references/README; raw runs kept through integration and follow-up fixture validation, no global settings changed."

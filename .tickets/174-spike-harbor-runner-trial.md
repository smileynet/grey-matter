---
id: "174"
title: "Spike: harbor as the runner for the model-tier and harness spikes, vs a thin runner of our own"
status: in_progress
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

- [ ] Both fixtures run through at least two harness adapters, with their pass or fail and cost recorded, or the blocking failure recorded verbatim.
- [ ] A decision for tickets 167-172 names a runnable selected path with fixture revision, adapter commands, result/usage schema and grading recipe in the eval prior-art note, or explicitly records that execution remains blocked and creates the missing prerequisite ticket before closure.
- [ ] Any Docker or sandbox state the trial created removed or recorded.

## Reconciliation (2026-11-02)

This decision must leave a runnable selected path, not just a framework preference: record the exact fixture revision, adapter commands, result/usage schema and grading recipe, and demonstrate two fixtures through the chosen path. If Harbor fails, a demonstrated thin path can satisfy the choice; if neither path runs, follow-up execution work is required before the dependent model trials can start. Native Windows availability, Docker setup cost and Kiro ACP compatibility are separate observations.

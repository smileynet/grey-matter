---
id: "157"
title: "Spike: agy run_workflow and custom agents running the orchestrate loop"
status: in_progress
blocked_by: ["124","129"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: agy run_workflow and custom agents running the orchestrate loop

## What to build

Use agy's built-in `run_workflow` tool (`agent`, `parallel`, `pipeline` with `workspace` and `schema`) plus custom agents in `.agents/agents/*.md` with a `model:` per role to run the orchestrate loop inside agy.

**Question:** Can agy fan out over tickets in per-ticket worktrees with typed results, and does a custom agent's `model:` pin the child's model (ticket 129 left P8 unverified)?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Read #158 when available for narrower permission findings; this is recommended sequencing, not a hard dependency. A disposable broad-grant control can still establish workflow capability, but must be labeled and cannot establish bounded production permissions. Verify that run_workflow, the agent format and per-role model settings exist in the installed release before dispatch; distinguish requested from served model.

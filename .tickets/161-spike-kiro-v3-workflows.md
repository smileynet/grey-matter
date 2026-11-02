---
id: "161"
title: "Spike: kiro-cli V3 workflows expressing the orchestrate loop natively"
status: open
blocked_by: ["124","126","185"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: kiro-cli V3 workflows expressing the orchestrate loop natively

## What to build

Enable kiro-cli 2.37's V3 workflows (`chat.enableWorkflows`, `chat.workflowLaunch`, `/workflow run`) and write a recipe for the orchestrate loop.

**Question:** Can a workflow recipe express claim → worker in a worktree → independent reviewer loop → land, and how do its pause, resume and retry behave?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Select the V3 engine explicitly; plain kiro-cli acp can select V2. #185 establishes architecture and initialize advertisements only, not workflow execution. Verify the installed workflow recipe schema/methods before dispatch, keep experimental settings private or process-scoped, and record actual pause/resume/retry state plus independent acceptance evidence.

---
id: "157"
title: "Spike: agy run_workflow and custom agents running the orchestrate loop"
status: done
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

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Read #158 when available for narrower permission findings; this is recommended sequencing, not a hard dependency. A disposable broad-grant control can still establish workflow capability, but must be labeled and cannot establish bounded production permissions. Verify that run_workflow, the agent format and per-role model settings exist in the installed release before dispatch; distinguish requested from served model.

## Resolution (2026-11-02)

done: qualified native agy typed workflows with bounded fixture evidence and explicit routing/automation limits; queued model qualification194

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Dated Ticket157 section and 20-case native receipt plus independent audit (0.93/high) published. Schema positive/negative, typed fan-out and sequential controls observed. Pre-merge gate: ticket-graph, skill-syntax-fixtures, artifact-hygiene pass; six selected pre-push checks pass. UI preclose receipt079f890955e2111dba3f2409bd1fb63286974e7e67882ea8210d780a6f19c32a accepted at1280/390."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "Yes: two typed ticket jobs in registered worktrees; same T2 conversation QUESTION then scripted-answer DONE. Independent merge plus npm.cmd test:3passed,0failed/skipped/cancelled/todo. Served model couldn'tverify;194 owns qualification. Native autonomous admission/review/merge not established."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "Fixture, four worktree parents, private probe and Python temporary folder recycled/absent; three global hashes unchanged. Model-control histories/DBs 6,816,238bytes incl retained91648byte Python hardlink kept only through194. Receipt records earlier partial-cleanup size measurement limit."

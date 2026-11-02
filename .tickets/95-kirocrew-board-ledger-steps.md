---
id: "95"
title: "orient/implement: optional Kiro Crew chat_tag and session_ledger steps"
status: in_progress
blocked_by: ["111"]
priority: low
tags: ["stream:tooling", "type:enhancement"]
validation_criteria: 
  - "Shared harness reference records placement and guards each optional tool independently; orient and implement route to it and other harnesses skip."
  - "Native Kiro Crew fixture mirrors successful claim to implementation with ticket ledger fields, waiting to review, and successful close to done; absent tools skip without changing tracker state."
  - "Fresh pre-merge/pre-push gates and independent Standards/Spec review pass; deployment and artifact cleanup are evidenced."
---

# orient/implement: optional Kiro Crew chat_tag and session_ledger steps

## What to build

Under Kiro Crew, two tools would make tkt state visible and compaction-safe:

- `chat_tag(set_state=...)` mirrors ticket status on the dashboard board: claim -> `implementation`, close -> `done`, waiting on the user -> `review`.
- `session_ledger_record` stores the ticket id, phase and concrete next step, so a long ticket survives context compaction.

Add each as a guarded step ("if this tool exists") in `orient` and `implement`, so Claude,
Codex and other harnesses skip it. Decide first whether harness-specific steps belong in the
portable skill body or in a per-harness reference file loaded on demand
(see `docs/agents/skill-frontmatter.md`). `tkt-work` belongs to tkt, not grey-matter, so it
is out of scope here.

## Placement decision (2026-11-01)

**Harness reference**, per [proposal 17](../docs/agents/proposals/17-orchestrator-skill.md#4-per-harness-references).
The guarded orchestration steps live in
[orchestrate’s Kiro Crew reference](../skills/engineering/orchestrate/references/harness-kirocrew.md).
Ticket 95 still owns wiring the single-ticket orient/implement path and live validation.

## Acceptance criteria

- [ ] The placement decision is recorded (skill body vs. harness reference).
- [ ] Under Kiro Crew, claiming a ticket tags the chat `implementation` and records the ticket in the ledger; closing tags it `done`.
- [ ] Other harnesses see no new required steps.
- [ ] `node scripts/gate.mjs pre-merge` passes.

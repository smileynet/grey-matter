---
id: "95"
title: "orient/implement: optional Kiro Crew chat_tag and session_ledger steps"
status: open
blocked_by: ["111"]
priority: low
tags: ["stream:tooling", "type:enhancement"]
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

## Acceptance criteria

- [ ] The placement decision is recorded (skill body vs. harness reference).
- [ ] Under Kiro Crew, claiming a ticket tags the chat `implementation` and records the ticket in the ledger; closing tags it `done`.
- [ ] Other harnesses see no new required steps.
- [ ] `node scripts/check-repo.mjs` passes.

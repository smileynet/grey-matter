---
id: "95"
title: "orient/implement: optional Kiro Crew chat_tag and session_ledger steps"
status: done
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
The single-ticket orient/implement path now loads the shared
[ticket-state reference](../docs/agents/kirocrew-ticket-state.md). Native gateway
[validation and limits](../docs/agents/research/kirocrew-ticket-state-20261101.md)
record successful claim/wait/close mirroring and the absent-tool guard.

## Acceptance criteria

- [x] The placement decision is recorded (skill body vs. harness reference).
- [x] Under Kiro Crew, claiming a ticket tags the chat `implementation` and records the ticket in the ledger; closing tags it `done`.
- [x] Other harnesses see no new required steps.
- [x] `node scripts/gate.mjs pre-merge` passes.

## Resolution (2026-11-02)

Implemented and pushed guarded single-ticket Kiro Crew state mirroring in 9263741; shared harness reference preserves tkt authority and is loaded only by Kiro Crew branches in orient/implement/orchestrate. Native claim/wait/close and absent-tool paths verified; evidence promoted in 83e9336. Gates/reviews passed and 50 skills deployed. Probe gateway stopped; all 643243374 bytes of owned fixture/model/private scratch recycled after report promotion. Existing AGY bundle (8557420 bytes) retained for shared deployment until next refresh; peer artifacts untouched. Full source-editing skill run, human-only tag refusal and ledger survival across restart were not tested; limits recorded in evidence.

### Verification
1. ✓ Shared harness reference records placement and guards each optional tool independently; orient and implement route to it and other harnesses skip. — "9263741 adds conditional pointers in orient/implement and centralizes per-tool guards in docs/agents/kirocrew-ticket-state.md; orchestration reference reuses it. Syntax/invocation/docs checks pass and fresh Standards/Spec reviews found no issue."
2. ✓ Native Kiro Crew fixture mirrors successful claim to implementation with ticket ledger fields, waiting to review, and successful close to done; absent tools skip without changing tracker state. — "Native isolated Kiro Crew 0.11.1 chat called chat_tag and session_ledger_record after real fixture tkt claim/close. Independent API assertions passed implementation, review, done tags; ledger goal identifies ticket 1, correct phase/next/ticket artifact at each stage. Restricted-profile absent-tool branch skipped without mirror changes. Receipts: docs/agents/research/evidence/kirocrew-ticket-state-20261101.json; method/limits: docs/agents/research/kirocrew-ticket-state-20261101.md (83e9336)."
3. ✓ Fresh pre-merge/pre-push gates and independent Standards/Spec review pass; deployment and artifact cleanup are evidenced. — "Fresh gate.mjs pre-merge --base 6dd1df825e52e5d77008f19c9c0ec12939012219 --include skill-syntax-fixtures passed ticket-graph and 10 syntax fixtures; pre-push checks passed before both normal pushes. deploy.mjs installed 50 skills and native validation passed with existing generic-icon warning; packaged reference and rewritten implement pointer verified. Probe gateway exited 0; 643243374 bytes of owned scratch moved to OS Recycle Bin after promoting 1047-byte report. Existing 8557420-byte AGY bundle retained as shared deployment output; no peer data deleted."

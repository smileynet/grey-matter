---
id: "259"
title: "Triage checks criterion facts when filing tickets from an audit"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Triage step 3 and the audit-to-ticket filing path verify counts, names and paths in criteria, or mark them inferred"
tags: ["stream:skills-review", "kind:enhancement"]
---
## What to build

Extend triage SKILL.md step 3 (verify claims with captured output) so it also covers the facts that ticket acceptance criteria assert, on the path that files tickets from an audit or review.

## Intent and context

Source: android-helper session retrospective, 2026-11-07 (plan finalized after two critic rounds). Filed from android-helper; no work done here.

Two audit-derived android-helper tickets were filed with false premises:
- ticket 25 said "the three required dashboard scripts" (there are two);
- ticket 33 said "reuse NAME" (which rejects the live JDK name temurin-17.0.19 used by both rig projects).

Each cost a goal stop and an owner decision. Two critic rounds reviewed the plan but not the ticket facts. tkt-work's claim-time premise check caught both, but only at work time.

## Acceptance criteria

- [ ] The filing step checks every count, name and path a criterion asserts against source or live config, or marks it inferred
- [ ] The audit critic brief asks for the same check
- [ ] This extends triage step 3; no new standalone rule
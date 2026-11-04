---
id: "232"
title: "Harden exact session retirement and spool crash recovery"
status: open
blocked_by: ["208"]
priority: high
validation_criteria:
  - "Exact retirement and persisted input boundaries reject wrong ownership or generation"
  - "Real subprocess crash and restart tests prove bounded persisted-record recovery without automatic resend"
  - "Usage guidance focused checks and independent final-source acceptance are retained"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
---
# Harden owned spool recovery and retirement

## Intent and scope

The user resumed #179. Extend the existing #208 spool rather than introducing a second coordinator or task board. Parent retains native adapter qualification and timeout/notification semantics; this child owns core spool integrity/recovery and exact retirement.

## What to build

Inspect existing session-messages.mjs and its contracts. Add a narrowly scoped exact-target retirement operation preserving other registrations and historical records, with explicit wrong-generation refusal. Tighten CLI and persisted-input trust boundaries, preserving stable message IDs and existing routes. Exercise actual subprocess crashes at atomic-write boundaries with fixture-owned filesystem injection (no production crash flags), showing ambiguous lock refusal and recoverable persisted bytes without automatic resend or unowned lock removal. Cover superseded/retired recipients, wrong host, permissions failure, queue/reply/done correlation and restart. Document manual parent recovery and installation/cleanup ownership; no global settings or native/model calls.

## Acceptance criteria

- [ ] Exact retirement and input/integrity boundaries are implemented compatibly with the current spool and wrong-owner/generation operations fail closed.
- [ ] Real subprocess crash/restart tests exercise before/after persistence and preserve duplicates/correlation/unknown files without claiming exactly-once delivery.
- [ ] Usage reference, focused results and independent exact-commit acceptance are retained; parent wires catalog/skill pointers, runs integrated gates and closes.

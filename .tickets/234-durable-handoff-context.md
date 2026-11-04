---
id: "234"
title: "Bind ticket candidate and durable handoff context to messages"
status: in_progress
blocked_by: ["232"]
priority: high
validation_criteria:
  - "Validated structured context is immutable-hash bound while old message identity is preserved"
  - "Request reply completion and replay tests reject malformed or altered context"
  - "Usage contract independent exact-source review and integrated gates pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
assignee: "codex"
---
# Bind work context to durable handoffs

## Intent

Remaining #179 envelope scope requires ticket, candidate and durable handoff identity in addition to routing. Extend the existing spool after #232 so its persistence and native intent hashes cover structured context while retaining old version1 records.

## What to build

Add optional strict context to messages: ticket identity, a tagged candidate state (not-produced versus exact commit) and a durable handoff reference/hash. Validate at the input/persisted boundary and include context in immutable content hashing without invalidating existing records lacking it. Carry correlation/reply semantics and exact route checks; do not infer native success or user authorization from fields. Update tests and existing session-message usage reference. No second tracker, native/model calls or global settings.

## Acceptance criteria

- [ ] Structured work context is validated and hashed; old records retain their original identity and new malformed or altered context is rejected before persistence.
- [ ] Request/question/completion and replay regressions verify candidate state and durable reference/correlation without claiming external file or native event truth.
- [ ] Usage guidance, independent exact-source acceptance and parent integrated repository checks pass.

---
id: "233"
title: "Record bounded native outcomes and notification dead letters"
status: open
blocked_by: ["210"]
priority: high
validation_criteria:
  - "Exact bound lifecycle and deadlines distinguish attestations receipts ambiguity and dead letters"
  - "Failure restart legacy and wrong-binding tests reject false delivery and resend"
  - "Agent usage contract and independent exact-source acceptance pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
---
# Bound native notification outcomes and expiration

## Intent

Remaining #179 failure semantics following #210. Extend the existing native intent instead of another ledger or coordinator. Independent design review recommended finite caller-owned deadlines, attempt-start/result attestations and explicit expiration, retaining once-only action preparation.

## What to build

In native-notification.mjs, add strict exact-binding/revision lifecycle commands: attempt-start before invocation; record accepted/not-sent/ambiguous outcomes as parent attestations, never receipt proof; inspect and explicit expire/dead-letter. Prepare requires a finite caller-supplied UTC deadline and rejects expired inputs before action issuance. Preserve historical version1 intents as inspect-only unknown lifecycle without inventing an attempt or reopening them. Keep zero automatic retries, no retry of ambiguity/timeout, no new message ID as a workaround. A correlated receipt is bound to actual spool identity/hash/target/generation; late receipt retains dead-letter history. No scheduler or native calls inside the helper.

## Acceptance criteria

- [ ] Exact target/hash/generation/revision-bound lifecycle and finite deadlines distinguish native result attestations, actual local receipt state, ambiguity and terminal dead-letter history.
- [ ] Meaningful persistence/restart/expired-input/wrong-binding/stale-update tests reject false delivery and automatic resend; legacy records remain safely inspectable.
- [ ] Dedicated agent usage guidance and independent final-source review pass; parent integrates and qualifies actual native behavior separately.

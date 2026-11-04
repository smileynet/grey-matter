---
id: "233"
title: "Record bounded native outcomes and notification dead letters"
status: done
blocked_by: ["210"]
priority: high
validation_criteria:
  - "Exact bound lifecycle and deadlines distinguish attestations receipts ambiguity and dead letters"
  - "Failure restart legacy and wrong-binding tests reject false delivery and resend"
  - "Agent usage contract and independent exact-source acceptance pass"
tags: ["stream:orchestration","kind:enhancement","epic:outcome-orchestration"]
parent: "179"
assignee: "codex"
---
# Bound native notification outcomes and expiration

## Intent

Remaining #179 failure semantics following #210. Extend the existing native intent instead of another ledger or coordinator. Independent design review recommended finite caller-owned deadlines, attempt-start/result attestations and explicit expiration, retaining once-only action preparation.

## What to build

In native-notification.mjs, add strict exact-binding/revision lifecycle commands: attempt-start before invocation; record accepted/not-sent/ambiguous outcomes as parent attestations, never receipt proof; inspect and explicit expire/dead-letter. Prepare requires a finite caller-supplied UTC deadline and rejects expired inputs before action issuance. Preserve historical version1 intents as inspect-only unknown lifecycle without inventing an attempt or reopening them. Keep zero automatic retries, no retry of ambiguity/timeout, no new message ID as a workaround. A correlated receipt is bound to actual spool identity/hash/target/generation; late receipt retains dead-letter history. No scheduler or native calls inside the helper.

## Acceptance criteria

- [x] Exact target/hash/generation/revision-bound lifecycle and finite deadlines distinguish native result attestations, actual local receipt state, ambiguity and terminal dead-letter history.
- [x] Meaningful persistence/restart/expired-input/wrong-binding/stale-update tests reject false delivery and automatic resend; legacy records remain safely inspectable.
- [x] Dedicated agent usage guidance and independent final-source review pass; parent integrates and qualifies actual native behavior separately.

## Resolution (2026-11-04)

done: bounded intent lifecycle and explicit dead-letter/receipt handling integrated6115e4a and deployed; no scheduler/native invocation or automatic retry. Parent179 remains in progress. Raw source/review artifacts retained for179finalaudit; unrelated dashboard edits preserved.

### Verification
1. ✓ Exact bound lifecycle and deadlines distinguish attestations receipts ambiguity and dead letters — "PASS: exact d7fcaf54 lifecycle source reviewed, integrated6115e4a with canonical context validation; deadlines and exact revision bindings, explicit expiry, local receipt vs parent outcome attestations and legacy unknown behavior covered."
2. ✓ Failure restart legacy and wrong-binding tests reject false delivery and resend — "PASS: independent17/17 plus fixed real-clock false-expiry counterexample; parent node --test session-messages.test.mjs native-notification.test.mjs39/39 with0fail/skip. Raw logs and hashes retained via session-messaging-233-20261103.json through179audit."
3. ✓ Agent usage contract and independent exact-source acceptance pass — "PASS: independent combined-source6115e4acce0c872f53033fafe8d2ad0ecabe9d0c accepted, review log1B04E229D7CCEF5F480DAE836E465BAA11673317FBA04BE12233045BE2EF8D0F. Agent contract/catalog updated; premerge syntaxfixture1PASS,prepush5/5,inventory136 and4guidancefixturesPASS; deploy50 noagy/nocrew;6115pushed. Native proof remains179."

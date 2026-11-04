---
id: "234"
title: "Bind ticket candidate and durable handoff context to messages"
status: done
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

- [x] Structured work context is validated and hashed; old records retain their original identity and new malformed or altered context is rejected before persistence.
- [x] Request/question/completion and replay regressions verify candidate state and durable reference/correlation without claiming external file or native event truth.
- [x] Usage guidance, independent exact-source acceptance and parent integrated repository checks pass.

## Resolution (2026-11-04)

done: structured work context integrated coherently with233 canonical notification validation at6115e4a, deployed and pushed. Parent179 native qualification remains in progress. Worker source and private raw evidence retained through179finalaudit; unrelated work preserved.

### Verification
1. ✓ Validated structured context is immutable-hash bound while old message identity is preserved — "PASS: strict optional ticket/candidate/handoff context is immutable-hash bound; actual pre-change golden a3980a4a8b91a898b8c378f72240d1706a7f59d33312a3d165f07dcc40086037 preserved. Commit parser admits exactly40or64hex; claims do not verify referenced artifacts."
2. ✓ Request reply completion and replay tests reject malformed or altered context — "PASS: worker/critic29/29, parent combined39/39 with0fail/skip, including reply inheritance/null/cross-ticket refusals, subprocess replay, OID length39-65 cases and context-bearing native preparation-through-receipt compatibility."
3. ✓ Usage contract independent exact-source review and integrated gates pass — "PASS: final24721eb worker source independently accepted, real dispatch preflight; combined6115e4acce0c872f53033fafe8d2ad0ecabe9d0c independently accepted and pushed. premerge syntaxfixture1PASS,prepush5/5,inventory136 and4guidancefixturesPASS,deploy50 noagy/nocrew. Evidence indices233/234 retain raw hashes through179audit."

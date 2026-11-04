---
id: "237"
title: "Implement and qualify owned Kiro ACP handoffs"
status: done
blocked_by: ["231", "233", "234", "238", "242"]
priority: high
validation_criteria:
  - "Negotiated exact ACP session and bounded failure stop semantics preserve the shutdown workaround"
  - "Protocol fault tests and owned native handoff receipts separate delivery and teardown"
  - "Independent evidence review usage guidance current gates and artifact disposition pass"
tags: ["stream:orchestration","kind:enhancement","epic:outcome-orchestration"]
parent: "179"
---
# Own a Kiro ACP messaging transport

## Intent and prerequisites

Remaining #179 client-owned Kiro delivery after #231, #233 and #234. Preserve the accepted #189 shutdown limitation and documented workaround; never reopen its old native session or delete historical evidence.

## What to deliver

Reuse the project's existing ACP protocol work where sound. Implement a bounded client-owned stdio connection with negotiated capabilities and exact session identity, structured shared handoffs, sequential prompts/results, cancellation/connection-loss behavior and owned stop. Handshake-advertised support, not CLI-help presence, admits a route. A new/resumed session is not arbitrary attachment to another live client. Parent alone runs a disposable native fixture after exact binary/model/permissions preflight. No global settings, original session cleanup or unsupported busy queue/steer claims. Handle the known V3 shutdown case using the accepted owned-process workaround and record teardown separately from task delivery.

## Acceptance criteria

- [x] Exact negotiated ACP session messaging and bounded failure/stop semantics are implemented through the shared interface, preserving the known shutdown workaround.
- [x] Protocol fault tests and parent-owned native follow-up/question/completion evidence distinguish actual terminal results, busy gaps, persistence and teardown outcomes.
- [x] Independent final source/raw-evidence review, agent usage/catalog guidance and parent integrated checks pass, with owned artifacts retained or disposed explicitly.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 102288-1793784337441310500 -->
First native V2 ACP case remains incomplete / RESULT_NOT_JSON; second input was not attempted. Nine message-chunk updates arrived in the selected session, and owned root/child settled with exit0 and closed stdio. Failed response text and raw RPC metadata were not retained before parsing, so format cause and served model remain unknown; RPC success is control-flow inference. Original intent remains ambiguous. Evidence/limits: docs/agents/research/session-messaging-native-qualification-20261104.md (66275ba). A separately admitted fresh case adds pre-parse response shape/RPC evidence and accepts plain JSON or one whole JSON fence without changing bridge permissions or retrying the original intent.

## Resolution (2026-11-04)

done: bounded owned Kiro V2 two-turn messaging qualified, with business receipts, physical cleanup and native update-stream limitation recorded separately; source owner-close classification corrected locally. No foreign attachment or V3 graceful-shutdown claim.

### Verification
1. ✓ Negotiated exact ACP session and bounded failure stop semantics preserve the shutdown workaround — "Implemented exact owned V2 ACP/session binding and bounded stop, preserving #189 V3 workaround; source455f606 and guidance80403b0 independently accepted. Native delivery report docs/agents/research/session-messaging-kiro-owned-20261104.md."
2. ✓ Protocol fault tests and owned native handoff receipts separate delivery and teardown — "Parent native v7: two completed/end_turn requests in the same session, all four core records ACKED, both revision3 intents have correlated receipts. Root and child absent after exit0/closedstdio; original update stream DISCONNECTED retained. Local close correction: node --test skills/engineering/orchestrate/scripts/kiro-acp.test.mjs PASS16/16, no skips; no native rerun. Busy/reconnect/persistence/served-model/tool-capacity remain unqualified."
3. ✓ Independent evidence review usage guidance current gates and artifact disposition pass — "Independent exact-source, native postflight, guidance and11rawhash reviews PASS; index docs/agents/research/evidence/session-messaging-kiro-owned-20261104.json. Current pre-merge syntax fixture1PASS, pre-push5PASS; deploy --no-agy --no-kirocrew installed50. Parent retains indexed private evidence through179finalaudit; unrelated evidence untouched."

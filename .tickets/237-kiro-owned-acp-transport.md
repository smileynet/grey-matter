---
id: "237"
title: "Implement and qualify owned Kiro ACP handoffs"
status: in_progress
blocked_by: ["231", "233", "234", "238", "242"]
priority: high
validation_criteria:
  - "Negotiated exact ACP session and bounded failure stop semantics preserve the shutdown workaround"
  - "Protocol fault tests and owned native handoff receipts separate delivery and teardown"
  - "Independent evidence review usage guidance current gates and artifact disposition pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
---
# Own a Kiro ACP messaging transport

## Intent and prerequisites

Remaining #179 client-owned Kiro delivery after #231, #233 and #234. Preserve the accepted #189 shutdown limitation and documented workaround; never reopen its old native session or delete historical evidence.

## What to deliver

Reuse the project's existing ACP protocol work where sound. Implement a bounded client-owned stdio connection with negotiated capabilities and exact session identity, structured shared handoffs, sequential prompts/results, cancellation/connection-loss behavior and owned stop. Handshake-advertised support, not CLI-help presence, admits a route. A new/resumed session is not arbitrary attachment to another live client. Parent alone runs a disposable native fixture after exact binary/model/permissions preflight. No global settings, original session cleanup or unsupported busy queue/steer claims. Handle the known V3 shutdown case using the accepted owned-process workaround and record teardown separately from task delivery.

## Acceptance criteria

- [ ] Exact negotiated ACP session messaging and bounded failure/stop semantics are implemented through the shared interface, preserving the known shutdown workaround.
- [ ] Protocol fault tests and parent-owned native follow-up/question/completion evidence distinguish actual terminal results, busy gaps, persistence and teardown outcomes.
- [ ] Independent final source/raw-evidence review, agent usage/catalog guidance and parent integrated checks pass, with owned artifacts retained or disposed explicitly.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 102288-1793784337441310500 -->
First native V2 ACP case remains incomplete / RESULT_NOT_JSON; second input was not attempted. Nine message-chunk updates arrived in the selected session, and owned root/child settled with exit0 and closed stdio. Failed response text and raw RPC metadata were not retained before parsing, so format cause and served model remain unknown; RPC success is control-flow inference. Original intent remains ambiguous. Evidence/limits: docs/agents/research/session-messaging-native-qualification-20261104.md (66275ba). A separately admitted fresh case adds pre-parse response shape/RPC evidence and accepts plain JSON or one whole JSON fence without changing bridge permissions or retrying the original intent.

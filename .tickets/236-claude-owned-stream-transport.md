---
id: "236"
title: "Implement and qualify owned Claude streaming handoffs"
status: done
blocked_by: ["231", "233", "234", "238", "242", "243"]
priority: high
validation_criteria:
  - "Owned transport binds exact process session and bounded shared handoff semantics"
  - "Protocol faults and native question completion receipts are evidenced with precise limits"
  - "Independent review guidance current gates and artifact disposition pass"
tags: ["stream:orchestration","kind:enhancement","epic:outcome-orchestration"]
parent: "179"
---
# Own a Claude streaming worker transport

## Intent and prerequisites

Remaining #179 inter-harness delivery after #231, #233 and #234. Use the current documented Claude persistent streaming input surface. This is an orchestrator-owned process, not an attachment API to someone else's CLI/Desktop chat.

## What to deliver

Implement a narrow owned stream-json/SDK transport with exact process/session/generation and shared message identity, bounded lifetime, correlated inputs/results, explicit disconnect/ambiguity and owned-process stop. Do not build another coordinator. Preflight current binary/flags/model/permissions before any parent-owned native canary; use only a disposable tool-constrained worker and process-local settings, without changing host defaults or account grants. Real startup/second input proves an existing owned session, not arbitrary live-user attachment. Retain request/result/session evidence, no credentials or unrelated transcripts. Do not replace a usage-limited provider.

## Acceptance criteria

- [x] Owned transport preserves exact session identity and bounded shared-message/intent semantics without arbitrary attachment, config changes or unsafe process cleanup.
- [x] Deterministic protocol/failure tests plus a parent-owned native question/reply/completion fixture distinguish command acceptance, receipt and results, with explicit restart/busy/platform limits.
- [x] Independent exact-source/evidence review, agent usage/catalog guidance and parent current gates pass; retained artifacts have ownership/end conditions.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 67720-1793784246609810000 -->
Source startup correction243 is closed and pushed at e9a7716. First actual native Claude input case failed PROTOCOL_ORDER before init/replay/result; original intent remains ambiguous, no delivery or completion claimed. Owned root and child settled afterward. Exact offending record and billing remain unknown. Retained cases and evidence: docs/agents/research/session-messaging-native-qualification-20261104.md (66275ba). A metadata-only wire observer is being reviewed before a distinct bounded diagnostic case; unchanged original input is not retried.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 93612-1793787704510392000 -->
Fresh reviewed native v6 on pushed13a source passed lifecycle/init and emitted exact input replay plus assistant/stream records, then protocol-fault UNEXPECTED_RECORD before any accepted provider-result. Top-level EVENT_STREAM_CLOSED is secondary, not root cause. No task completion/reply or final core receipt claimed. Original intent retained; no retry. Owned root102020 stopped(SIGTERM), stdio closed, stderr0; process-tree settlement UNPROVEN because first inspection occurred after adapter auto-stop and both tree reads failed. Raw native report11458B SHA1204c4792de5faf7a15f733f7e893a6525095d6a3bcd061db438465d31fdc199; parent postflight .scratch/t236-v6-native-postflight-review.md. Read-only pinnedSDK event-schema comparison and distinct bounded wire observer revision are in progress, no new provider call admitted yet.

## Resolution (2026-11-04)

done: bounded owned Claude Windows text-worker two-turn handoff qualified with exact core receipts and observed process settlement. Delivered lifecycle/rate-limit/re-init handling and redacted fault diagnostics; explicit unsupported routes/platforms and historical failed-case limitations preserved.

### Verification
1. ✓ Owned transport binds exact process session and bounded shared handoff semantics — "Owned exact-session/UUID text transport and shared persisted action binding shipped; independent exact source e08 accepted, integrated/rebased runtime d2bf2cc. Metadata cannot create readiness/receipts or release an active turn; changed init safety metadata and actual rejected usage limits stop the owned process, no retry/fallback."
2. ✓ Protocol faults and native question completion receipts are evidenced with precise limits — "Parent v10 native PASS: two correlated success results in one session, first42+8digit string nonce, follow-up remembered it without receiving nonce again; all4core records ACKED and2intentsrev3receipt-confirmed. Launch/before root83508+child96376 then afterempty; exit0closedstdio, settledtrue. One identical-init status observed; older v8 cause/ambiguity not reinterpreted. Windows/text-worker scope only; no foreign attach/busyqueue/reconnect/persistence/served-model or billing attestation."
3. ✓ Independent review guidance current gates and artifact disposition pass — "Independent native/source/doc reviews PASS; durable report/index docs/agents/research/session-messaging-claude-owned-20261104.md and evidence/session-messaging-claude-owned-20261104.json16hashes. Current combined runtime fixtures110PASS0FAIL1WindowsescalationSKIP outof111; tool inventory144PASS; current premerge1syntaxPASS, closeoutpush5checksPASS, guidanceea92bdbpushed/deploy50 noagy/nocrew. Parent keeps citedprivateevidence with lifecycle through179audit/disposition; earliercases preserved."

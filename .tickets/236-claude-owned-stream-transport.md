---
id: "236"
title: "Implement and qualify owned Claude streaming handoffs"
status: in_progress
blocked_by: ["231", "233", "234", "238", "242", "243"]
priority: high
validation_criteria:
  - "Owned transport binds exact process session and bounded shared handoff semantics"
  - "Protocol faults and native question completion receipts are evidenced with precise limits"
  - "Independent review guidance current gates and artifact disposition pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
---
# Own a Claude streaming worker transport

## Intent and prerequisites

Remaining #179 inter-harness delivery after #231, #233 and #234. Use the current documented Claude persistent streaming input surface. This is an orchestrator-owned process, not an attachment API to someone else's CLI/Desktop chat.

## What to deliver

Implement a narrow owned stream-json/SDK transport with exact process/session/generation and shared message identity, bounded lifetime, correlated inputs/results, explicit disconnect/ambiguity and owned-process stop. Do not build another coordinator. Preflight current binary/flags/model/permissions before any parent-owned native canary; use only a disposable tool-constrained worker and process-local settings, without changing host defaults or account grants. Real startup/second input proves an existing owned session, not arbitrary live-user attachment. Retain request/result/session evidence, no credentials or unrelated transcripts. Do not replace a usage-limited provider.

## Acceptance criteria

- [ ] Owned transport preserves exact session identity and bounded shared-message/intent semantics without arbitrary attachment, config changes or unsafe process cleanup.
- [ ] Deterministic protocol/failure tests plus a parent-owned native question/reply/completion fixture distinguish command acceptance, receipt and results, with explicit restart/busy/platform limits.
- [ ] Independent exact-source/evidence review, agent usage/catalog guidance and parent current gates pass; retained artifacts have ownership/end conditions.

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 67720-1793784246609810000 -->
Source startup correction243 is closed and pushed at e9a7716. First actual native Claude input case failed PROTOCOL_ORDER before init/replay/result; original intent remains ambiguous, no delivery or completion claimed. Owned root and child settled afterward. Exact offending record and billing remain unknown. Retained cases and evidence: docs/agents/research/session-messaging-native-qualification-20261104.md (66275ba). A metadata-only wire observer is being reviewed before a distinct bounded diagnostic case; unchanged original input is not retried.

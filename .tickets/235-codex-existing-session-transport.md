---
id: "235"
title: "Qualify Codex queue and busy existing-agent handoffs"
status: open
blocked_by: ["231", "233", "234"]
priority: high
validation_criteria:
  - "Fixed public queue adapter preserves exact target and shared bounded intent identity"
  - "Owned native busy idle question and completion receipts are independently evidenced"
  - "Regression review guidance and current integrated checks pass"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
---
# Qualify Codex existing-session input through the shared interface

## Intent and prerequisites

Remaining #179 native acceptance after #231 interface qualification, #233 notification lifecycle and #234 work context. Preserve #210's old one-idle-agent proof as history. Use only owned disposable worker sessions, never the user's conversations.

## What to deliver

Implement a narrowly typed Codex queue adapter with exact UUID/native identity, caller-owned executable/version binding and fixed argv (no shell or arbitrary command payload). Preserve the shared durable message/intent boundary and zero retry on ambiguous results. Validate current queue help and schema: resume warnings plus exit zero are not receipts. Separately qualify the desktop native path for busy/idle, question/reply and correlated completion against existing owned agents. Retain real native records, exact message/target hashes and process/session ownership. No new or resumed run may masquerade as delivery to the intended existing target. Any unsupported route remains explicit; no global configuration or provider fallback.

## Acceptance criteria

- [ ] Fixed public queue adapter rejects wrong/ambiguous target, executable and command data and shares bounded intent/context semantics.
- [ ] Parent-owned native fixture proves exact existing-target busy/idle and question/completion behavior where supported, with correlated raw receipts and precise gaps.
- [ ] Focused regressions, independent exact-source/native-evidence acceptance, agent tool guidance and parent integrated gates pass.

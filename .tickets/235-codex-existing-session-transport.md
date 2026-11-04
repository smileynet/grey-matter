---
id: "235"
title: "Qualify Codex queue and busy existing-agent handoffs"
status: done
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

- [x] Fixed public queue adapter rejects wrong/ambiguous target, executable and command data and shares bounded intent/context semantics.
- [x] Parent-owned native fixture proves exact existing-target busy/idle and question/completion behavior where supported, with correlated raw receipts and precise gaps.
- [x] Focused regressions, independent exact-source/native-evidence acceptance, agent tool guidance and parent integrated gates pass.

## Resolution (2026-11-04)

done: fixed queue preparation/refusal adapter and bounded same-owned-desktop question/idle-follow-up qualification delivered. Exact clock-hold timing, arbitrary mid-task steering and native CLI queue delivery remain explicitly unqualified with manual fallback; no held integration was launched.

### Verification
1. ✓ Fixed public queue adapter preserves exact target and shared bounded intent identity — "Fixed public queue/action source931e507 already accepted and shipped; current node --test native-notification/codex-queue/session-messages suites PASS55/55 no skips, exact UUID/executable/loopback/actionhash refusal guards intact. Source-only CLI preparation is not native queue delivery."
2. ✓ Owned native busy idle question and completion receipts are independently evidenced — "Fresh desktop v3 same-target question and idle follow-up with remembered nonce: native parent channel +4correlatedspoolrecords +2once-onlystored-actionintents independently reviewed. Roster running before first call, completed before second; exact30secondhold timing UNPROVED (37.440s marker-return upper bound), not claimed. CLI native stays held because prelaunch integrations cannot be safely disabled/inventoried within current authorization; manual fallback documented."
3. ✓ Regression review guidance and current integrated checks pass — "Independent narrowclaims/guidance review PASS9E3A4D...; final indexreview PASSA9CEC6... verifies14raw+10spoolhashes. Docs/index shipped6c18a3b, current premerge1PASS/prepush5PASS, deploy50 --no-agy --no-kirocrew. Retained evidence index docs/agents/research/evidence/session-messaging-codex-owned-20261104.json; parent owns through179audit. No provider fallback/global grants or user chats."

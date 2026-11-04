---
id: "232"
title: "Harden exact session retirement and spool crash recovery"
status: done
blocked_by: ["208"]
priority: high
validation_criteria:
  - "Exact retirement and persisted input boundaries reject wrong ownership or generation"
  - "Real subprocess crash and restart tests prove bounded persisted-record recovery without automatic resend"
  - "Usage guidance focused checks and independent final-source acceptance are retained"
tags: ["stream:orchestration", "type:enhancement"]
parent: "179"
assignee: "codex"
---
# Harden owned spool recovery and retirement

## Intent and scope

The user resumed #179. Extend the existing #208 spool rather than introducing a second coordinator or task board. Parent retains native adapter qualification and timeout/notification semantics; this child owns core spool integrity/recovery and exact retirement.

## What to build

Inspect existing session-messages.mjs and its contracts. Add a narrowly scoped exact-target retirement operation preserving other registrations and historical records, with explicit wrong-generation refusal. Tighten CLI and persisted-input trust boundaries, preserving stable message IDs and existing routes. Exercise actual subprocess crashes at atomic-write boundaries with fixture-owned filesystem injection (no production crash flags), showing ambiguous lock refusal and recoverable persisted bytes without automatic resend or unowned lock removal. Cover superseded/retired recipients, wrong host, permissions failure, queue/reply/done correlation and restart. Document manual parent recovery and installation/cleanup ownership; no global settings or native/model calls.

## Acceptance criteria

- [x] Exact retirement and input/integrity boundaries are implemented compatibly with the current spool and wrong-owner/generation operations fail closed.
- [x] Real subprocess crash/restart tests exercise before/after persistence and preserve duplicates/correlation/unknown files without claiming exactly-once delivery.
- [x] Usage reference, focused results and independent exact-commit acceptance are retained; parent wires catalog/skill pointers, runs integrated gates and closes.

## Resolution (2026-11-04)

done: exactsessionretirement, strictenvelope/CLIboundaries and realspoolcrash/restartfixture delivered ine32a42c. Parent179 remainsinprogress; no nativewake or powerloss safety inferred. Evidence retained through179qualificationaudit; unrelated historicalscratch preserved.

### Verification
1. ✓ Exact retirement and persisted input boundaries reject wrong ownership or generation — "PASS: exactretirement and strictsend/persisted-input guards in74347e3; independent poison-spool finding fixed, wronghost/generation/retired routes rejected, integratedunchanged e32a42c."
2. ✓ Real subprocess crash and restart tests prove bounded persisted-record recovery without automatic resend — "PASS: parent and independent focused suites23/23 (15spool8notification); realchildprocess exitsbefore/afterrename with ambiguouslockrefusal, validpersistedbytes, noautoresend. Notpowerloss/nativeproof."
3. ✓ Usage guidance focused checks and independent final-source acceptance are retained — "PASS: reference/catalog/absoluteeditguidance and independent e32a42c renewal; actualdispatch preflight, premerge1syntaxfixture, prepush5/5, deploy50 noagy/nocrew, pushe32. Rawartifacts keptparent179audit: docs/agents/research/evidence/session-messaging-232-20261103.json."

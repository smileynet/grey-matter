---
id: "156"
title: "Spike: a Kiro Crew Mate as the standing orchestrator"
status: done
blocked_by: ["124","128","154"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: a Kiro Crew Mate as the standing orchestrator

## What to build

Run the trunk loop through a Kiro Crew 0.11 Mate's conductor chat instead of the built-in `kirocrew-conductor`, and restart the gateway mid-run.

**Question:** Does a Mate revive its archived workers and get woken by their reports after a restart, and is it a better standing orchestrator than the built-in conductor?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

Auth follow-up from #186: on Crew 0.11.1 / CLI 2.37.1 Windows, the omitted-flag
host-auth argv behaved like CLI ownership. #190 owns a supported correction for
Crew-owned relay auth. This Mate probe may proceed using the explicitly verified
CLI-owned branch in a private Crew home; verify the selected argv and intended
existing sign-in before dispatch, without changing global credentials.

- [x] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [x] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [x] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Use the audited #154 approval findings and #155 backend limitation. Test the Mate and its own workers on an explicitly recorded backend; do not assume member_acp_backend splits an ordinary KAS conductor from external workers. Use a known supported auth owner; #186 is needed only if selecting the unresolved Crew-owned relay path. Record worker/session identities, ledger state and the actual post-restart report/wake, not merely the reappearance of a chat.

## Resolution (2026-11-02)

done: qualified one Mate graceful-restart recovery case on Crew0.11.1/KiroCLI2.37.1/KAS/Haiku4.5. Same worker session and persisted parent resumed; a fresh report woke Mate. Recorded failure to preserve task meaning and independent acceptance, so no claim that Mate is a better standing orchestrator. Promoted cited findings/sanitized receipt/audit and updated dashboard; recycled private runtime and fixture. Final closed-state dashboard refresh/publication follows.

### Verification
1. ✓ Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented. — "Dated Ticket156 section in harness-experimental-features-20261101.md plus sanitized native receipt, source hashes and independent 8/10 audit; facts labeled observed, assertion failure or unverified. Native same-SID resumed:false/true and fresh report/Mate wake corroborated. UI critic accepted snapshot6254bdaf5bf05216ce9679fc060c047bbcace31ca8d6af776782ce88c397e5fb."
2. ✓ The question above answered yes or no, or listed under "couldn't verify" with what was tried. — "YES for graceful between-turn recovery and fresh-worker-report wake. Autonomous task fidelity FAILED: fabricated task and outside-worktree write. Corrected actual T1 changed only two files; independent npm test PASS2/2. Full trunk-loop superiority, crash and pending-report durability explicitly unverified. Manual laptop/phone dashboard browser tests PASS; applicable pre-merge skill-syntax-fixtures and all3selected pre-push checks PASS after portable-path correction."
3. ✓ Sandbox folders removed after the run; settings changed for the spike restored or recorded. — "Native owner-verified graceful shutdown acknowledged; all31 recorded final-generation processes/descendants absent. Recycled owned645577177-byte private probe/model/home/worktree/rawlogs and101974-byte fixture after independent raw audit. No intentional global config/login/provider changes; global639150592-byte model left untouched. Browser module retained only through final dashboard capture/publication, then recycle."

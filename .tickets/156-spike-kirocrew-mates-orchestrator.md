---
id: "156"
title: "Spike: a Kiro Crew Mate as the standing orchestrator"
status: open
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

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Use the audited #154 approval findings and #155 backend limitation. Test the Mate and its own workers on an explicitly recorded backend; do not assume member_acp_backend splits an ordinary KAS conductor from external workers. Use a known supported auth owner; #186 is needed only if selecting the unresolved Crew-owned relay path. Record worker/session identities, ledger state and the actual post-restart report/wake, not merely the reappearance of a chat.

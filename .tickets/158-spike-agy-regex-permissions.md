---
id: "158"
title: "Spike: agy command(regex:...) rules narrower than command(*)"
status: in_progress
blocked_by: ["124","129"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented."
  - "The question above answered yes or no, or listed under \"couldn't verify\" with what was tried."
  - "Sandbox folders removed after the run; settings changed for the spike restored or recorded."
---

# Spike: agy command(regex:...) rules narrower than command(*)

## What to build

Probe agy 1.4.12's documented `command(regex:...)` permission rules headless, plus `write_file(path)`, for workers that need `git`, `npm` and `tkt`. Ticket 129 saw `command(git)`, `command(git *)`, `command(git:*)` and an exact command all denied; only `command(*)` worked.

**Question:** Is there any working rule narrower than `command(*)` for headless agy workers on this account?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

## Reconciliation (2026-11-02)

Preparation in this chat created a 98,400-byte private fixture and its baseline npm test passed 1/1; no regex or write-boundary probe has run. Retain it only through this ticket, then recycle it. Current first-party Windows guidance recommends regex matching; workspace writes may be implicitly allowed, so a successful in-workspace write alone does not prove the write_file rule bounded access. Use harmless negative controls and verify file bytes/command results.

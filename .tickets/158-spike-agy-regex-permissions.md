---
id: "158"
title: "Spike: agy command(regex:...) rules narrower than command(*)"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
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

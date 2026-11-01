---
id: "156"
title: "Spike: a Kiro Crew Mate as the standing orchestrator"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
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

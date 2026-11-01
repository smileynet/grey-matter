---
id: "159"
title: "Spike: Codex multi_agent_v2 with the agent message board and wake-on-message"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: Codex multi_agent_v2 with the agent message board and wake-on-message

## What to build

Enable Codex 0.166's `multi_agent_v2`, `agent_message_board` and `wake_on_agent_messages` for one run each (`--enable <name>`, no config write) and rerun the dispatch, question and await probes.

**Question:** Do they change the spawn and depth limits seen in ticket 127, and can the message board replace polling `wait_agent`?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

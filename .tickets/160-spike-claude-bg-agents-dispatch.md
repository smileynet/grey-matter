---
id: "160"
title: "Spike: Claude Code --bg sessions and notify_when_idle as the dispatch layer"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: Claude Code --bg sessions and notify_when_idle as the dispatch layer

## What to build

Use Claude Code's `claude --bg` background sessions (each in its own worktree), `claude agents --json`, and cross-session `SendMessage` with `notify_when_idle` as the orchestrate skill's dispatch layer, instead of in-session sub-agents.

**Question:** Do automatic worktrees, the push-but-never-main rule and the roughly one-hour idle reaper fit the ticket → worktree → land flow on Windows, and is the idle notice a reliable worker-done signal?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

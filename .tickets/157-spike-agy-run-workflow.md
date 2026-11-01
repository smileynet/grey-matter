---
id: "157"
title: "Spike: agy run_workflow and custom agents running the orchestrate loop"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: agy run_workflow and custom agents running the orchestrate loop

## What to build

Use agy's built-in `run_workflow` tool (`agent`, `parallel`, `pipeline` with `workspace` and `schema`) plus custom agents in `.agents/agents/*.md` with a `model:` per role to run the orchestrate loop inside agy.

**Question:** Can agy fan out over tickets in per-ticket worktrees with typed results, and does a custom agent's `model:` pin the child's model (ticket 129 left P8 unverified)?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

---
id: "173"
title: "Spike: GUI surfaces as the watch layer over a headless orchestrator"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: GUI surfaces as the watch layer over a headless orchestrator

## What to build

With a headless orchestrator running the trunk loop, watch and steer it from each GUI: Claude desktop agent view, the Codex app thread list, Kiro IDE Agent Focus, the Antigravity Agent Manager and Kiro Crew's session grid ([by surface](../docs/agents/research/harness-experimental-features-20261101.md#by-surface-tui-and-gui)).

**Question:** What does each GUI show of worker state, pending approvals and usage, and can a person answer a worker's question or approval from it?

## Acceptance criteria

- [ ] One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note.
- [ ] A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111).
- [ ] Sandbox folders removed after the run.

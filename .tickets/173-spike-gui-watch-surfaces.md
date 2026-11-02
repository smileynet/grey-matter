---
id: "173"
title: "Spike: GUI surfaces as the watch layer over a headless orchestrator"
status: open
blocked_by: ["124","162"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note."
  - "A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111)."
  - "Sandbox folders removed after the run."
---

# Spike: GUI surfaces as the watch layer over a headless orchestrator

## What to build

With a headless orchestrator running the trunk loop, watch and steer it from each GUI: Claude desktop agent view, the Codex app thread list, Kiro IDE Agent Focus, the Antigravity Agent Manager and Kiro Crew's session grid ([by surface](../docs/agents/research/harness-experimental-features-20261101.md#by-surface-tui-and-gui)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** What does each GUI show of worker state, pending approvals and usage, and can a person answer a worker's question or approval from it?

## Acceptance criteria

- [ ] One row per GUI (state shown, approvals answerable, usage shown, question answerable), as a dated section in the experimental features note.
- [ ] A recommendation on which GUI to use as the watch layer per harness, folded into the orchestrate skill's references (ticket 111).
- [ ] Sandbox folders removed after the run.

## Reconciliation (2026-11-02)

Consume #162's named stable headless driver and fixture signals. Compare each GUI against the same worker identities, pending approval and question; distinguish visible state from an action actually answered through the GUI. Unavailable clients remain explicit unsupported coverage, not a reason to install or sign into new services silently.

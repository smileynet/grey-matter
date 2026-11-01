---
id: "146"
title: "delivery-dashboard lists only open questions, generated from a structured source"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Open questions come from one structured source"
  - "Answered questions leave every view"
tags: ["stream:tooling", "type:enhancement"]
---

# delivery-dashboard lists only open questions, generated from a structured source

## Origin

Field report from philippines-trip, 2026-11-01 (prioritization review, location planning and a Codex worktree takeover). Sam asked for these to be filed.

## What happened

philippines-trip's dashboard kept hand-written "Ready for your choice" links and next-step notes. They went stale and listed questions Sam had already answered. Sam's rule: dashboards show open questions only; once answered, the answer goes into the ticket or spec and the question disappears everywhere.

## Acceptance criteria

- [ ] delivery-dashboard defines a structured open-question source (for example a `## Open questions` ticket section with `- [ ] Q:` items, or a `needs:decision` label) and renders the "needs your input" block from it.
- [ ] Hand-written question blocks are flagged by the dashboard check.
- [ ] Answering (ticking or removing) a question removes it from every view on the next render.
- [ ] Links to to-questionnaire (#147) for collecting answers. Related: #116, #139.

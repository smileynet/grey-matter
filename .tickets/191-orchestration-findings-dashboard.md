---
id: "191"
title: "Dashboard: orchestration findings and expandable ticket flow in two tabs"
status: in_progress
blocked_by: []
validation_criteria:
  - "The standalone effort dashboard has exactly two tabs, with evidence-bounded value-oriented findings and labeled diagrams."
  - "The ticket log derives the orchestration scope from live tickets, shows dependency flow first, then open and other tickets collapsed by default with readable expandable details."
  - "Laptop and phone rendering, tab/filter/detail/flow interactions and data consistency are verified where permitted; required gates pass and artifact disposition is recorded."
tags: ["stream:orchestration", "kind:enhancement"]
---

# Dashboard: orchestration findings and expandable ticket flow in two tabs

## What to build

Create `docs/orchestration.html`, a dedicated offline dashboard for this effort.
Intent source: the user's 2026-11-02 request in this chat. Exactly two tabs:

1. User-facing findings: what the trials let the owner do or decide, with low
   cognitive complexity, evidence-bounded confirmation labels and useful diagrams.
   Keep limits visible; fold sources and technical detail beneath each finding.
2. Ticket log: visual dependency flow first, then open work, then other tickets.
   Every ticket starts collapsed and expands into outcome, prerequisites,
   acceptance and source detail. Include every `stream:orchestration` ticket.

The user's two-tab format takes precedence over the shared dashboard template's
three-tab layout. Build a separate effort view and reuse the content/evidence
discipline; do not change the shared template for this project-specific request.
Generate the ticket snapshot from live files and preserve the explicit queue in
`docs/plan.md`; do not invent blocker edges to force preferred order. Use diagrams
for observed sequences or clearly labeled concepts rather than fabricated host
screenshots. Verify desktop/phone behavior through an available local browser.

## Acceptance criteria

- [ ] The standalone effort dashboard has exactly two tabs, with evidence-bounded value-oriented findings and labeled diagrams.
- [ ] The ticket log derives the orchestration scope from live tickets, shows dependency flow first, then open and other tickets collapsed by default with readable expandable details.
- [ ] Laptop and phone rendering, tab/filter/detail/flow interactions and data consistency are verified where permitted; required gates pass and artifact disposition is recorded.

---
id: "259"
title: "Address the dashboard UX and visual review"
status: open
blocked_by: []
validation_criteria:
  - "Six review findings are addressed in the template, example, and live dashboard"
  - "Dashboard contract and browser checks pass"
tags: ["stream:tooling"]
---
## Intent

Address the independent critic and Playwright findings on all four delivery-dashboard tabs.

## Acceptance criteria

- [ ] Preserve keyboard focus after entry and ticket filters update results.
- [ ] Surface selected-ticket dependency details beside the graph on wide screens and above it on phones.
- [ ] Put actionable work and visible scope before the graph guide and hide zero counts.
- [ ] Keep search and result count above a disclosure for secondary history controls.
- [ ] Lead with the empty state when no decisions are pending.
- [ ] Show ticket list order as a sequence without delivery completion badges.
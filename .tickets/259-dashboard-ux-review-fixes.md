---
id: "259"
title: "Address the dashboard UX and visual review"
status: done
blocked_by: []
validation_criteria:
  - "Six review findings are addressed in the template, example, and live dashboard"
  - "Dashboard contract and browser checks pass"
tags: ["stream:tooling"]
assignee: "codex"
---
## Intent

Address the independent critic and Playwright findings on all four delivery-dashboard tabs.

## Acceptance criteria

- [x] Preserve keyboard focus after entry and ticket filters update results.
- [x] Surface selected-ticket dependency details beside the graph on wide screens and above it on phones.
- [x] Put actionable work and visible scope before the graph guide and hide zero counts.
- [x] Keep search and result count above a disclosure for secondary history controls.
- [x] Lead with the empty state when no decisions are pending.
- [x] Show ticket list order as a sequence without delivery completion badges.

## Resolution (2026-11-05)

Kept focus on activated filters, moved graph detail beside or above the graph, surfaced work stream and actionable tickets, collapsed secondary history controls and guide, hid empty decision instructions, and made ticket-order visuals numbered sequences.

### Verification
1. ✓ Six review findings are addressed in the template, example, and live dashboard — "6b44b54. The template, example and live file cover all six review findings. Live Playwright at 1280/390/320 observed focus retained, no overflow or page errors, and earlier entry results and actionable Plan content. Decisions with and without pending work covered."
2. ✓ Dashboard contract and browser checks pass — "62/62 contract and Chrome browser tests passed; pre-merge 2/2 and pre-push 6/6. Deployment reported 50 skills installed."

---
id: "89"
title: "Adopt the delivery-dashboard template in tagalog-helper, philippines-trip and clvgm-extract"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Each repo's status page uses the template and passes check-dashboard with its media as linked files"
  - "No dashboard file in the three repos exceeds 400 KB"
tags: ["stream:migration", "type:chore"]
---

# Adopt the delivery-dashboard template in tagalog-helper, philippines-trip and clvgm-extract

## What to build

Move each repo's status page onto the [delivery-dashboard template](../skills/productivity/delivery-dashboard/assets/dashboard-template.html)
with `adopt-project`, one repo at a time, each behind its own approval. Findings per repo are in the
[prior-art review](../docs/agents/research/status-dashboard-prior-art-20261027.md); order by value:

1. tagalog-helper: `docs/ux-review.html` (9.5 MB) and the per-ticket `ticket_dashboard.mjs` pages
   become entries; media moves to linked files; its source-only interaction check stays or folds
   into `check-dashboard`.
2. philippines-trip: `docs/proposal-dashboard.html` (15.8 MB) likewise; keep its feedback export
   as an ask reply, and keep the review server behind its documented denial rules.
3. clvgm-extract: no dashboard exists; create one from the template and seed it from the run reports.

Each repo also records the dashboard path in its `AGENTS.md`. These repos were not on the machine
that wrote the review (read from fresh clones), so do the work where they are checked out.

## Acceptance criteria

- [ ] Each repo's status page uses the template and passes `check-dashboard.mjs` with media as linked files.
- [ ] No dashboard file in the three repos exceeds 400 KB.
- [ ] Each repo's `AGENTS.md` names the dashboard path and the update-after-each-task rule.

---
id: "109"
title: "delivery-dashboard understands tkt's cancelled status"
status: done
blocked_by: []
priority: high
tags: ["kind:enhancement"]
---

# delivery-dashboard understands tkt's cancelled status

## What to build

Intent: tkt ADR 0004 (`docs/adr/0004-cancelled-status.md` in tkt) adds a terminal
`cancelled` status, implemented in tkt ticket 227 for 0.6. grey-matter's delivery
dashboard only knows `backlog`, `open`, `in_progress` and `done`: its checker would reject
a snapshot with the new status, and the Plan tab has no group for it. Ship this in the
same release as tkt 227.

- `check-dashboard.mjs`: accept `cancelled`.
- Template renderer: a collapsed "Cancelled" group after Done, excluded from progress and
  from "What comes next"; a ticket blocked by a cancelled one stays blocked (the ADR keeps
  the frontier rule).
- Worked example and contract mention it; tests cover it.
- `docs/agents/tkt-conventions.md`: use `tkt cancel` for superseded or duplicate work.

## Acceptance criteria

- [x] The checker accepts `cancelled`, and a test covers it
- [x] The Plan tab shows cancelled tickets in their own collapsed group, outside progress and lanes
- [x] Template and worked example share the renderer; strict checks pass
- [x] `tkt-conventions.md` routes superseded and duplicate work to `tkt cancel`

## Resolution (2026-11-25)

done: verified check-dashboard.mjs, dashboard-template.html, and dashboard-example.html (identical renderer; both pass --strict; 64/64 tests in delivery-dashboard.test.mjs including new planLanes exclusion assertion); updated docs/agents/tkt-conventions.md to route abandoned, superseded, or duplicate work to tkt cancel and noted cancelled history grouping in worked-example.md (per dashboard-contract.md, cancelled remains a distinct muted legend/bar segment outside Done)

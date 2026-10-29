---
id: "109"
title: "delivery-dashboard understands tkt's cancelled status"
status: open
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

- [ ] The checker accepts `cancelled`, and a test covers it
- [ ] The Plan tab shows cancelled tickets in their own collapsed group, outside progress and lanes
- [ ] Template and worked example share the renderer; strict checks pass
- [ ] `tkt-conventions.md` routes superseded and duplicate work to `tkt cancel`

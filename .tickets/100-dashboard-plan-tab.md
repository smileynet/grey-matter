---
id: "100"
title: "delivery-dashboard: an entry per closed ticket and a Plan tab of all tickets"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "check-dashboard passes on the template and the worked example, and fails on seeded cases: a ticket entry with no visual, a malformed gm-tickets block, a stale snapshot"
  - "The worked example's Plan tab lists open tickets first, with done of total and a dependency view, readable at phone and laptop width"
tags: ["type:feature"]
---

# delivery-dashboard: an entry per closed ticket and a Plan tab of all tickets

## What to build

User instruction (2026-10-29): update the dashboard after every ticket, with an entry that
explains the features added from a user perspective with visuals, mocks or live
screenshots; in a separate tab, list all tickets, open first, and visualize the plan. The
accepted proposal (same date) shapes it:

- **Per-ticket entries.** The skill's trigger becomes "after closing a ticket, or other
  work worth surfacing". An entry may carry `tickets: ["88"]`, shown only under Details.
  An entry with `tickets` must have a `visual`: a live capture for shipped user-facing
  work, a labelled mock or wireframe otherwise, and a `steps` visual of plan movement for
  internal-only tickets. `implement` gets a pointer at its close step.
- **Plan tab.** A third tab renders a `gm-tickets` JSON block that
  `scripts/snapshot-tickets.mjs` writes from `tkt query -o json` (never hand-edited; the
  page stays offline). Order: ready (frontier order), in progress, blocked (with "waiting
  on" links), backlog, done collapsed. Search, status filter and a live count. At the
  top: done of total and a dependency view of open tickets layered by blocker depth.
  Tickets link to the entry that delivered them.
- **Checker.** Validates the `gm-tickets` block, requires a visual on ticket entries,
  and warns when the snapshot predates the newest entry.

Renderer changes go into `assets/dashboard-template.html` so every project behaves
alike; update the contract, SKILL.md and the worked example together.

## Acceptance criteria

- [x] Template has a Plan tab driven by `gm-tickets`, keyboard-accessible like the other tabs, with no remote resources
- [x] `scripts/snapshot-tickets.mjs` writes the block from tkt and leaves the rest of the file byte-identical
- [x] Checker enforces visuals on ticket entries, validates `gm-tickets`, warns on a stale snapshot; seeded cases go red
- [x] SKILL.md, the dashboard contract and the worked example describe and show the new behaviour
- [x] `implement` points to the dashboard update at ticket close
- [x] `node scripts/check-repo.mjs` passes

## Resolution (2026-10-29)

Template gains a Plan tab rendered from a generated gm-tickets block (snapshot-tickets.mjs from tkt query/ready; refuses under a tag context; escapes markup). Ticket entries name their tickets and must carry a visual; the checker validates the snapshot and warns when stale. SKILL.md, contract, walkthrough, worked example, implement/implement-spec pointers, compass and README updated in 734c5ee. The proposed warning for closed tickets without an entry was dropped: tkt's JSON has no close dates to scope it.

### Verification
1. ✓ check-dashboard passes on the template and the worked example, and fails on seeded cases: a ticket entry with no visual, a malformed gm-tickets block, a stale snapshot — "node --test scripts/delivery-dashboard.test.mjs: 27 pass; the 7 new/changed tests fail against the previous checker (seeded: ticket entry without visual, unknown status, closed frontier ticket, malformed block, stale snapshot)"
2. ✓ The worked example's Plan tab lists open tickets first, with done of total and a dependency view, readable at phone and laptop width — "Worked example: check-dashboard --strict ok, 13 tickets, plan 13/13 grouped, 3 lanes; headless Chrome at 1280 and 400 px reviewed; #t-03 deep link opens Plan, Done group and the row"

---
id: "112"
title: "Show a complete visual execution queue with one active ticket in serial mode"
status: open
blocked_by: []
validation_criteria:
  - "Template and worked example show all unfinished tickets in a connected dependency diagram with stable execution order"
  - "Seeded serial-WIP, owner, ordering, snapshot, and visual-evidence failures are rejected"
  - "Phone/laptop and offline dashboard checks plus node scripts/check-repo.mjs pass"
tags: ["stream:tooling", "kind:enhancement"]
---

# Show a complete visual execution queue with one active ticket in serial mode

## Intent

Sam requested this ticket on October 30, 2026 to incorporate the dashboard practices
learned in Philippines Family Trip into grey-matter. Ticket 100 already delivered
per-ticket visual entries and a Plan tab. This follow-up addresses the later
expectation: an actual connected workflow diagram and an enforceable execution
order, rather than only lists or depth lanes.

## What to build

A person opening the evolving dashboard can see what changed for them, inspect
labeled evidence, and follow the current ticket and next execution steps. Maintain
one durable dashboard and relevant tabs; avoid a new HTML report for every update.

After each completed ticket, publish a ticket-linked entry in plain, neutral
language about what the work lets the user do. Include a labeled visual, mock or
actual capture. Process/research work uses a workflow or benefit visual without
inventing an app feature. Separate implemented, locally tested, distributed and
physically observed outcomes. Captures with synthetic data do not establish
production delivery. Keep private codes, identities and personal content out.

Extend the separate Plan tab to cover every ticket, with unfinished/open work first,
searchable details and completed/deferred work still accessible. Show every
unfinished ticket in a connected dependency graph; diagrams must not silently
omit blocked or deferred prerequisites. Preserve an explicit stable execution
sequence, while prerequisites take precedence. Distinguish dependency edges from
suggested execution order; independent branches are not fabricated dependencies.
Identify current and next work, blockers, status and execution numbers. Support
zoom/scroll, keyboard access, readable narrow screens and ticket-detail links.

In serial mode allow at most one in-progress ticket, with an actionable gate before
claim and after status changes. Return or finish the current ticket before claiming
another. Explicit parallel mode requires distinct named owners for active tickets;
research helpers on the same ticket do not create extra active-ticket ownership.
Make this opt-in/configurable for adopting projects rather than overwriting their
workflow. Keep the existing tracker the source of truth; generate snapshots and
reject stale or incomplete views instead of hand-maintaining a second ticket list.

Verify the relevant dashboard view after each ticket, including offline/local
assets and evidence labels, then open or refresh that same view for the user.
A requested LAN address must actually be reachable from the LAN; a file URL is not
that proof. LAN access and public-internet publication are separate scopes. Do not
silently publish a dashboard publicly or serve private repository directories.

## Context

Read `skills/productivity/delivery-dashboard/SKILL.md`,
`references/dashboard-contract.md` and `assets/dashboard-template.html` in that
skill, its snapshot/check scripts, and `scripts/delivery-dashboard.test.mjs`.
Coordinate with completed ticket 100 and open tickets 89/90 (dashboard adoption and
critics) and 109 (cancelled status); retain their ownership and status semantics.

Pinned source evidence from Philippines Trip commit `b570747`:

- [Execution-order gate and renderer](https://github.com/smileynet/philippines-trip/blob/b570747/tools/update_dashboard.py).
- [Ordering and ownership regressions](https://github.com/smileynet/philippines-trip/blob/b570747/tools/test_dashboard_order.py).
- [Saved execution sequence](https://github.com/smileynet/philippines-trip/blob/b570747/.memory/dashboard-execution-order.json).
- [Worked dashboard](https://github.com/smileynet/philippines-trip/blob/b570747/docs/proposal-dashboard.html).

The repository is private; this ticket contains the required behavior independently
of access to those links. Study patterns rather than copying the project’s large
embedded-art payload or app-specific ordering. Keep evidence assets scoped and
retrievable under the artifact-hygiene guidance.

## Acceptance criteria

- [ ] Skill, contract, template and worked example distinguish the connected dependency graph from execution sequence and cover all unfinished tickets.
- [ ] Explicit sequence remains stable across status changes while dependencies override position; current and next tickets are visible.
- [ ] Opt-in serial mode rejects multiple active tickets; parallel mode rejects missing or duplicate active owners.
- [ ] Fixtures reject cycles, missing dependencies, incomplete graph/snapshot, stale snapshots and missing ticket-entry visuals; repaired cases pass.
- [ ] Per-ticket entries describe user outcomes with accurate fidelity and delivery limits, including a process/research example.
- [ ] Completed, cancelled and deferred tickets remain inspectable with the established tracker semantics; no work is silently marked done.
- [ ] Offline, keyboard and phone/laptop checks show readable diagrams and usable ticket details; the relevant same dashboard view is opened/refreshed for the user.
- [ ] Reachability guidance distinguishes local-file, LAN and public scope and preserves private content boundaries.
- [ ] Applicable dashboard tests and `node scripts/check-repo.mjs` pass.

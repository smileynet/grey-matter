---
id: "287"
title: "Pretty-print dashboard JSON blocks to avoid whole-file merge conflicts"
status: open
blocked_by: []
validation_criteria:
  - "template and snapshot emit multi-line JSON blocks"
  - "existing dashboards pass checker after reformat"
  - "concurrent single-entry appends merge cleanly"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

Pretty-print the `gm-entries` (and generated `gm-tickets`) JSON blocks in the
delivery-dashboard template/snapshot tooling so concurrent sessions editing
docs/status.html merge cleanly instead of conflicting on a single line.

**Observed 2026-11-08:** two sessions appended dashboard entries in parallel;
grey-matter's dashboard stores all 110 entries as ONE compact line, so git
conflicted on the whole block and resolution meant regenerating by hand —
twice in one session. The tkt repo's dashboard (indent-2 JSON) conflicts far
less because entries occupy separate lines.

**Scope:** the shipped template in the delivery-dashboard skill and
`snapshot-tickets.mjs` output format; a one-time reformat of existing
dashboards is mechanical. Renderer unchanged (JSON.parse tolerates both).

## Acceptance criteria

- [ ] Dashboard template and snapshot script emit pretty-printed (multi-line) JSON data blocks
- [ ] Existing dashboards still pass check-dashboard.mjs after reformat
- [ ] Two concurrent single-entry appends to gm-entries merge without conflict (demonstrated or reasoned in evidence)

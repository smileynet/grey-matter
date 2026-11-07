---
id: "268"
title: "snapshot-tickets.mjs writes the ticket snapshot as multi-line JSON"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "Snapshot has one ticket per line; check-dashboard still parses it; greps return only matching lines"
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

Write the `gm-tickets` snapshot in delivery dashboards with one ticket per line instead of a single line.

## Intent and context

Source: android-helper session retrospective, 2026-11-07 (plan finalized after two critic rounds). Filed from android-helper; no work done here.

In android-helper the snapshot is one line of about 11 KB (line 1323 of docs/status.html, 2026-11-07). Content greps returned the whole line twice in one session. An `.ignore` file is no fix: the shell grep in that environment (ugrep with --ignore-files) reads only .gitignore, and a repo-wide rg sweep would silently skip the dashboard.

## Acceptance criteria

- [ ] snapshot-tickets.mjs writes one ticket object per line
- [ ] check-dashboard.mjs and the page still parse it
- [ ] A grep for a ticket title returns only that ticket's line
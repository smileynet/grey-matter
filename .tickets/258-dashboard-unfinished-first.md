---
id: "258"
title: "Make unfinished tickets easier to scan in the Plan"
status: done
blocked_by: []
validation_criteria:
  - "Browser and contract checks pass for the updated Plan"
tags: ["stream:tooling"]
assignee: "codex"
---
## Intent

Put active and open work first in the dashboard and make ticket status easy to scan.

## Acceptance criteria

- [x] The Plan exposes unfinished work before terminal history and makes the ticket list easy to reach.
- [x] Status labels and visual accents are consistent, and graph ordering preserves prerequisites.

## Resolution (2026-11-05)

Plan lists in-progress and open tickets ahead of deferred work and collapsed terminal history. Added a direct jump, status counts, gem accents and state priority within each dependency column.

### Verification
1. ✓ Browser and contract checks pass for the updated Plan — "236cc18. Dashboard contract and browser suites passed 62/62, including ticket jump, status order, collapsed history and prerequisite columns at 1280 and 390. Pre-merge 2/2, pre-push 6/6, deployed 50 skills."

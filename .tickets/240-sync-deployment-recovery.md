---
id: "240"
title: "Preflight packages and resume only unfinished deployment targets"
status: in_progress
blocked_by: []
validation_criteria:
  - "Linked AGENTS.md reference material remains inert and links resolve; strict Antigravity validation succeeds."
  - "Package validation precedes installed-target writes; unchanged targets are skipped on retry while changed or missing outputs are repaired."
tags: ["stream:tooling", "kind:bug"]
---
# Preflight packages and resume only unfinished deployment targets

## What to build

Intent: the 2026-11-03 sync exposed recovery gaps. Update scripts/deploy.mjs under the approved sync improvement plan. Preserve ownership checks and real failure reporting.

## Acceptance criteria

- [ ] Linked AGENTS.md reference material remains inert and links resolve; strict Antigravity validation succeeds.
- [ ] Package validation precedes installed-target writes; unchanged targets are skipped on retry while changed or missing outputs are repaired.

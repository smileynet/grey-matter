---
id: "284"
title: "Document Windows register_personal.py workaround in distribution-maintenance.md"
status: in_progress
blocked_by: []
validation_criteria:
  - "distribution-maintenance.md notes the Windows failure and the .py variant"
  - "literal error text and date included"
  - "docs-only change"
tags: ["type:chore"]
---
## What to build

Make the Kimi plugin registration instructions in
`docs/agents/distribution-maintenance.md` platform-aware: on Windows,
`register_personal.sh` aborts (`.cmd` launcher fails the script's
executability test under Git Bash); use `python scripts/register_personal.py
<plugin-dir>` instead. The failure and workaround are already recorded in
`docs/agents/harnesses.md` (ticket 283, 2026-11-08); this brings the
distribution-maintenance command block in line. tkt's plugin-maintenance.md
has the same drift, tracked by its own ticket.

## Acceptance criteria

- [ ] distribution-maintenance.md Kimi section notes the Windows failure and the .py variant
- [ ] Literal error text and observed date are included
- [ ] Docs-only change; no behavior change

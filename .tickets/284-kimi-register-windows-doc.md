---
id: "284"
title: "Document Windows register_personal.py workaround in distribution-maintenance.md"
status: done
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

- [x] distribution-maintenance.md Kimi section notes the Windows failure and the .py variant
- [x] Literal error text and observed date are included
- [x] Docs-only change; no behavior change

## Resolution (2026-11-09)

done: distribution-maintenance.md Kimi registration block now shows the Python variant as the Windows path, with the literal .cmd executability error and observed date; harnesses.md already carried the note

### Verification
1. ✓ distribution-maintenance.md notes the Windows failure and the .py variant — "command block shows register_personal.py labeled Windows alongside the bash variant"
2. ✓ literal error text and date included — "literal error text and 2026-11-08 observation date included in the prose below the block"
3. ✓ docs-only change — "docs-only diff: one fenced block extended, one prose paragraph added"

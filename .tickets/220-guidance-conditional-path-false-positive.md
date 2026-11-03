---
id: "220"
title: "check-guidance flags conditional and optional paths as dead-path errors"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "A path named in a conditional clause (e.g. 'when ~/.gemini exists') or an optional prior-art reference is reported as info, not error"
  - "node scripts/check-guidance.mjs on this machine reports no dead-path error for AGENTS.md lines 64 and 109"
tags: ["kind:bug", "stream:guidance"]
---

# check-guidance flags conditional and optional paths as dead-path errors

## What to build

TBD

## Acceptance criteria

- [ ] TBD

---
id: "239"
title: "Keep compatibility audits distinct from parsing and execution errors"
status: in_progress
blocked_by: []
validation_criteria:
  - "Built-in help and backtick-separated prose do not create false command findings; genuine unsupported commands and flags still fail."
  - "Audit execution errors return structured error output with exit 2 and never cache success."
tags: ["stream:tooling", "kind:bug"]
---
# Keep compatibility audits distinct from parsing and execution errors

## What to build

Intent: the 2026-11-03 sync exposed recovery gaps. Update scripts/verify-tkt-usage.mjs under the approved sync improvement plan. Preserve ownership checks and real failure reporting.

## Acceptance criteria

- [ ] Built-in help and backtick-separated prose do not create false command findings; genuine unsupported commands and flags still fail.
- [ ] Audit execution errors return structured error output with exit 2 and never cache success.

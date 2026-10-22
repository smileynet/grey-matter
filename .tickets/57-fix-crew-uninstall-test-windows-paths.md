---
id: "57"
title: "uninstall-crew-research test fails on Windows: forward-slash regex vs backslash path output"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "scripts/uninstall-crew-research.test.mjs passes on Windows (path-separator normalized in assertions or script output)"
  - "node scripts/check-repo.mjs check 7 (crew-research uninstall scope) is green on Windows"
  - "Fix is confirmed a test/output-format issue, not a masked production uninstall bug (verify the script removes the right items on Windows)"
tags: ["kind:bug"]
---

# uninstall-crew-research test fails on Windows: forward-slash regex vs backslash path output

## What to build

TBD

## Acceptance criteria

- [ ] TBD

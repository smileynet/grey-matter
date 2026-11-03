---
id: "213"
title: "Gate fixtures fail on Windows without Developer Mode: symlinkSync EPERM"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "relocate-knowledge, agent-guidance, review-receipt and crew-uninstall checks pass on a Windows host with Developer Mode off (or each symlink case skips with a named reason)"
  - "Directory links use junctions on win32; file-symlink cases probe capability once via a shared helper instead of failing"
  - "node scripts/gate.mjs pre-merge --base <pre-change sha> shows those four checks ok on Windows"
tags: ["kind:bug", "stream:test-verification"]
---

# Gate fixtures fail on Windows without Developer Mode: symlinkSync EPERM

## What to build

TBD

## Acceptance criteria

- [ ] TBD

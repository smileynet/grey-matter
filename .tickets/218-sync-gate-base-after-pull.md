---
id: "218"
title: "sync verifies the pulled range, not an empty diff, and survives a Windows vendor check"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "sync step 5 runs gate.mjs pre-merge with --base <pre-pull sha>, so a clean tree after a pull still selects the affected checks"
  - "sync detects tkt CLI drift by build hash (not only the version string) and states what pack/ticket features need the newer build"
  - "sync names the fallback when tkt's mise run check cannot run locally (no cargo/bash) and when a push cannot authenticate, instead of leaving it to the agent"
tags: ["kind:enhancement", "stream:tooling"]
---

# sync verifies the pulled range, not an empty diff, and survives a Windows vendor check

## What to build

TBD

## Acceptance criteria

- [ ] TBD

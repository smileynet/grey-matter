---
id: "122"
title: "Find why check-repo invariant 1 (deployer tests) fails intermittently on Windows"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "Cause of the intermittent invariant 1 failure identified from a failing run's log"
  - "20 consecutive check-repo runs on an unchanged tree pass invariant 1, or the remaining flake is isolated and recorded"
tags: ["stream:tooling", "type:bug"]
---
# Find why check-repo invariant 1 (deployer tests) fails intermittently on Windows

## What to build

Intent source: the 2026-10-31 sync. Two full `node scripts/check-repo.mjs` runs on the same tree disagreed: invariant 1 (`deploy.test.mjs`) failed in one and passed in the next, and `node --test scripts/deploy.test.mjs` passed 45/45 three times on its own. The log of the failing run was not kept, so the cause is unknown.

Capture a failing run's full output (loop `check-repo` and keep each log), identify the cause (candidates: a shared temp or home directory, a leftover from a prior invariant, a codex or claude CLI call that races with a live session, timing), and fix it or record the isolated remainder.

## Acceptance criteria

- [ ] The cause is identified from a captured failing log and recorded here.
- [ ] 20 consecutive `check-repo` runs on an unchanged tree pass invariant 1, or the remaining flake is isolated to a named test and recorded.
- [ ] `node scripts/check-repo.mjs` passes.

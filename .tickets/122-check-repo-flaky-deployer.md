---
id: "122"
title: "Find why the deployer check (deploy.test.mjs) fails intermittently on Windows"
status: in_progress
blocked_by: []
priority: low
validation_criteria:
  - "Cause of the intermittent deployer failure identified from a failing run's log"
  - "20 consecutive gate.mjs pre-merge --include deployer runs on an unchanged tree pass, or the remaining flake is isolated and recorded"
tags: ["stream:tooling", "type:bug"]
---
# Find why the deployer check (deploy.test.mjs) fails intermittently on Windows

## What to build

Intent source: the 2026-10-31 sync. Two full `node scripts/check-repo.mjs` runs on the same tree disagreed: invariant 1 (`deploy.test.mjs`) failed in one and passed in the next, and `node --test scripts/deploy.test.mjs` passed 45/45 three times on its own. The log of the failing run was not kept, so the cause is unknown.

Capture a failing run's full output (loop `check-repo` and keep each log), identify the cause (candidates: a shared temp or home directory, a leftover from a prior invariant, a codex or claude CLI call that races with a live session, timing), and fix it or record the isolated remainder.

## Acceptance criteria

- [ ] The cause is identified from a captured failing log and recorded here.
- [ ] 20 consecutive `node scripts/gate.mjs pre-merge --include deployer` runs on an unchanged tree pass the deployer check, or the remaining flake is isolated to a named test and recorded.
- [ ] `node scripts/gate.mjs pre-merge` passes.

## Update 2026-11-01

`check-repo.mjs` is retired; the deployer suite is now the pre-release `deployer` check in
`scripts/gates.json` (`deploy.test.mjs` and `deploy-validation.test.mjs`, 91.9 s), which the gate
runs in a worktree snapshot with its own timeout. Run it alone with
`node scripts/gate.mjs pre-merge --include deployer`; the gate prints the failing output. One
candidate cause seen today: under host load (bare `git` calls averaging 324 ms, 3 GB RAM free)
`deploy.test.mjs` hit its 120 s per-file timeout with a `git.exe` that had no child process. It
passed 45/45 in 81.5 s once the load eased. Ticket 137 has the timings.

---
id: "122"
title: "Find why the deployer check (deploy.test.mjs) fails intermittently on Windows"
status: open
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
- [x] 20 consecutive `node scripts/gate.mjs pre-merge --include deployer` runs on an unchanged tree pass the deployer check, or the remaining flake is isolated to a named test and recorded.
- [x] `node scripts/gate.mjs pre-merge` passes.

## Update 2026-11-01

`check-repo.mjs` is retired; the deployer suite is now the pre-release `deployer` check in
`scripts/gates.json` (`deploy.test.mjs` and `deploy-validation.test.mjs`, 91.9 s), which the gate
runs in a worktree snapshot with its own timeout. Run it alone with
`node scripts/gate.mjs pre-merge --include deployer`; the gate prints the failing output. One
candidate cause seen today: under host load (bare `git` calls averaging 324 ms, 3 GB RAM free)
`deploy.test.mjs` hit its 120 s per-file timeout with a `git.exe` that had no child process. It
passed 45/45 in 81.5 s once the load eased. Ticket 137 has the timings.

## Investigation 2026-11-02

After #137/#176 changes, 20 consecutive
`node scripts/gate.mjs pre-merge --base HEAD --include deployer` runs passed on unchanged commit
`c634acf` (83.8–95.4 s, mean 87.2 s including snapshot setup). Each run judged a fresh worktree;
the harness would stop on the first failure or HEAD change. All 20 command logs and outcomes are
promoted in [deployer stress evidence](../docs/agents/research/evidence/deployer-stress-20261102.json).
The separate full pinned-base pre-merge run completed 19 commands, and hostile-config pre-release
completed all 28. Existing POSIX/Linux-only fixtures skip on Windows; no SKIP override was used.

**Cause remains unknown.** The original failing log is missing and this investigation did not
reproduce a failure. Earlier host-load timeouts are candidates, not a proven explanation for the
original intermittent failure. No claim is made that #137 fixed that failure. Release this claim
back to the frontier with the reproduction criterion checked; retain the first criterion open.
The next failing deployer run must retain its full output before retrying so a named failure can
be diagnosed. Raw successful-run logs are promoted above; temporary harness files are recycled.

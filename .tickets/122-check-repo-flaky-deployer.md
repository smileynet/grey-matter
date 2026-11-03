---
id: "122"
title: "Find why the deployer check (deploy.test.mjs) fails intermittently on Windows"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "The cause is identified from a captured failing log and recorded here."
  - "20 consecutive `node scripts/gate.mjs pre-merge --include deployer` runs on an unchanged tree pass the deployer check, or the remaining flake is isolated to a named test and recorded."
  - "`node scripts/gate.mjs pre-merge` passes."
tags: ["type:bug","stream:test-verification"]
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

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Remaining: capture and explain an actual matching deployer failure before claiming the cause is
known. The 20 consecutive fixed-commit runs already passed (83.8-95.4 seconds, mean 87.2); do not
restart a blind stress loop simply to obtain another green result. Preserve any failure encountered
during the rest of this stream. Existing checked criteria and historical evidence remain unchanged.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Retained-evidence audit 2026-11-02

A delegated read-only pass found no newly retained failed deployer run. The tracked
deployer-stress evidence remains 20/20 passing on unchanged c634acf; the retained sync log's
deployer TAP summary is 45 pass, zero fail, despite expected negative-case stderr. The full
pre-merge log is 19/19 passing and does not run the pre-release deployer suite. Ticket137's
historical load/Git-latency observation is a candidate explanation, not proof of this lost
failure's cause. No source fix or repeated stress loop was justified. Keep this ticket open;
the next actual failure needs full output, exact command/commit, host-resource and process
observations preserved before retry. No existing artifact or configuration was changed.

The combined pre-release gate at 8e6396b also passed all 29 checks; its deployer check
completed in 95.7 s. This is another non-reproduction, not proof of the intermittent
failure's cause. No additional stress loop was run and the next-failure capture requirement
is unchanged.

## Independent follow-up after core delivery — 2026-11-02

The user accepted the test-verification core as delivered and separated this ticket from
its completion gate. This remains an independent unfinished follow-up with its existing
status, acceptance criteria and activation conditions preserved; the stream tag records
lineage rather than a blocker on adoption. No Mac/OneDrive deferral is revoked, no missing
failure is explained by a green rerun, and no new platform pass or cleanup is claimed.
See the [delivery/adoption record](../docs/agents/research/test-verification-delivery-20261102.md)
and [plan](../docs/plan.md#independent-verification-follow-ups).

## Sync observation 2026-11-03

An uncommitted working-tree change to `scripts/deploy.test.mjs` (owner not identified) makes `dualSandbox` build on `homeSandbox()`. That gives the Claude/Codex dual-install cases an isolated HOME and `CODEX_HOME=<sandbox>/.codex` instead of inheriting the real `process.env` home, and moves the fixture `config.toml` under `.codex/`. It removes one candidate cause listed above: a test reading or racing the live `~/.codex` of a running session.

Unverified: `node --test --test-reporter=tap scripts/deploy.test.mjs` on the working tree did not finish within 15 minutes, after the post-sync `npm ci`. The process still running was `node scripts/deploy.mjs agy install --out <Temp>\gm-home-*`, and it was stopped. Whether the hang comes from that change or the host was not determined. Before committing the change, run `node scripts/gate.mjs pre-merge --include deployer` on it and on clean `HEAD`, and keep both full logs.
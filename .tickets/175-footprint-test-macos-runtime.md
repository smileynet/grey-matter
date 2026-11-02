---
id: "175"
title: "Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause"
status: open
blocked_by: []
validation_criteria:
  - "On macOS, time `node --test scripts/inspect-footprint.test.mjs` and one `lsof -Fn -w` call; record both."
  - "If the file still exceeds its 120 s runner timeout, record which call is slow and either narrow the scan (for example `lsof +D <repo>`) or move the spawned CLI tests to pass `--open` data."
  - "`node scripts/gate.mjs pre-merge --include artifact-hygiene` passes on macOS."
tags: ["stream:test-verification"]
---

# Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause

Split from 151 on 2026-11-01. philippines-trip (macOS) saw `scripts/inspect-footprint.test.mjs`
run about 524 s before an outer timeout. It could not be reproduced on Windows, which has neither
`lsof` nor `/proc`, so open-file detection is reported unavailable there.

**Hypothesis (unverified):** each `inspect()` call scanned the whole machine with `lsof -Fn -w`
under a 60 s timeout, and the tests called it about ten times. Commit 936226e passes an empty
open-file set (`opts.open`) to six of seven tests, leaving one real scan plus three spawned CLI
runs. The current pre-merge group has a 120 s outer runner timeout; #137 removed the inner
whole-file Node deadline. Measure the current manifest, not the original 60 s Node limit.

## Acceptance criteria

- [ ] On macOS, time `node --test scripts/inspect-footprint.test.mjs` and one `lsof -Fn -w` call; record both.
- [ ] If the file still exceeds its 120 s runner timeout, record which call is slow and either narrow the scan (for example `lsof +D <repo>`) or move the spawned CLI tests to pass `--open` data.
- [ ] `node scripts/gate.mjs pre-merge --include artifact-hygiene` passes on macOS.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: on macOS, capture one current inspector-suite run and one lsof timing, preserving the actual
slow call before any fix. lsof remains an unverified causal hypothesis. #137 removed the inner
whole-file Node deadline; the current artifact-hygiene group retains its 120-second outer bound.
Share the Mac setup with #131 but keep distinct acceptance evidence.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Host prerequisite check 2026-11-02

Root's batch-mode, strict-known-host SSH attempt to SpaceJam on port 22 timed out. No inspector
or lsof measurement ran on macOS; the causal hypothesis is still unverified. Mac availability
was requested from the user. Recheck access before claiming this host-specific ticket.

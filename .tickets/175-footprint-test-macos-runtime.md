---
id: "175"
title: "Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause"
status: in_progress
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

The user supplied the Mac account/address and installed the public key. Direct SSH to the
address succeeded (macOS 26.6.2); the hostname path still timed out. Host access is available
for the bounded inspector/lsof measurements; no causal or runtime result is claimed yet.

## Partial host evidence 2026-11-02

The [observed host report](../docs/agents/research/footprint-macos-host-check-20261102.md)
records a repository-scoped lsof completion in 0.63 s and an interrupted whole-host probe
with no completion at 20 s. That lower bound does not prove the test hang's cause. The worker
used a broad pattern kill for that probe; its exact collateral scope is unknown and that
method must not recur. Future timeouts must retain and stop only their owned process handle.
SpaceJam has about 10.6 GiB free, below the 20 GiB floor, so the inspector tests and Mac gate
have not run. The user requested CoreSimulator inspection; a reviewed concrete cleanup
proposal is recorded, with no deletion pending the owner's decision on existing project data.
This ticket remains in progress and its acceptance criteria remain unchecked.

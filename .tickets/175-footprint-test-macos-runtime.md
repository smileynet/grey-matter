---
id: "175"
title: "Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause"
status: backlog
blocked_by: []
validation_criteria:
  - "On macOS, time `node --test scripts/inspect-footprint.test.mjs` and one `lsof -Fn -w` call; record both."
  - "If the file still exceeds its 120 s runner timeout, record which call is slow and either narrow the scan (for example `lsof +D <repo>`) or move the spawned CLI tests to pass `--open` data."
  - "When host diagnosis is explicitly requested, record its bounded result separately; the whole-host suite is not a push, merge or release gate."
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
- [ ] When host diagnosis is explicitly requested, record its bounded result separately; the whole-host suite is not a push, merge or release gate.

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

User decision: preserve both simulators and revisit after other projects free space.
Deliberately parked in backlog; acceptance remains unchecked. Resume with a fresh free-space
check and owned-process timeouts before the Mac inspector/gate measurements.

## Independent follow-up after core delivery — 2026-11-02

The user accepted the test-verification core as delivered and separated this ticket from
its completion gate. This remains an independent unfinished follow-up with its existing
status, acceptance criteria and activation conditions preserved; the stream tag records
lineage rather than a blocker on adoption. No Mac/OneDrive deferral is revoked, no missing
failure is explained by a green rerun, and no new platform pass or cleanup is claimed.
See the [delivery/adoption record](../docs/agents/research/test-verification-delivery-20261102.md)
and [plan](../docs/plan.md#independent-verification-follow-ups).

## Note — 2026-11-04

By: codex

<!-- tkt-note:v1 2823-1793792332603104000 -->
Accepted Tagalog Helper storage retro follow-up, 2026-11-04: extend this existing scan-runtime investigation rather than file a duplicate. During the adopter audit the inspector was terminated after about 69 seconds with no output; this is an observation, not proof that lsof caused it. Current source makes --summary format a completed full inspect(), and --path adds to the default repository roots. Fresh --help probe in the retro returned exit 2, Unknown option: --help.

Additional accepted scope (mechanical): bounded footprint discovery, explicit CLI scope and useful partial output. Add independently checkable acceptance scenarios: (1) --help exits 0 without Git discovery or a filesystem census; (2) an explicit exclusive-scope mode visits only supplied roots, with additive --path semantics documented; (3) time/entry budgets and cancellation yield structured partial coverage plus a stop reason; (4) incomplete scans cannot emit deletion/slim/prune recommendations; (5) structure-first discovery is cheaper than full dependency inspection, while exact chosen targets still receive fresh pre-mutation revalidation. Measure current behavior before attributing a cause. Keep owned-process termination and avoid machine-wide kill patterns.

Read skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs and scripts/inspect-footprint.test.mjs. Coordinate macOS/APFS observations with local ticket 131 and Windows suite performance with local ticket 217; retain their distinct evidence. Historical source: https://github.com/smileynet/tagalog-helper/blob/ee4ecc8/docs/storage-retro-fixes-review.html . This filing executes no tests or cleanup, proves no upstream regression pass, and leaves the existing deliberately deferred status unchanged.

### Owner refinement — 2026-11-04

Sam clarified that the accepted retro work must generalize and use agent skills for judgement. Scan limits, progress, scope and CLI behavior are mechanical facts; the hygiene skill owns which families merit investigation and what they mean. Keep budgets configurable and examples portable, preserve incomplete-result protection, and avoid a hard-coded cache taxonomy, automatic disposal classifier or new mandatory gate.

### Owner decision: on-demand host evidence — 2026-11-04

The owner requested that whole-host artifact scanning stop blocking delivery.
`scripts/inspect-footprint.test.mjs` is now explicitly on-demand in `scripts/gates.json`,
including releases. The `artifact-hygiene` gate retains only cheap disposable Git-scoped
artifact safety fixtures, scoped to their implementation and tests, with a 30-second bound.
Historical timing and causal hypotheses above remain observations, not resolved defects.
The broader configurable-budget, scope, help and partial-output work remains deferred in
this ticket; no new host scan, cleanup or platform pass is claimed by this policy change.

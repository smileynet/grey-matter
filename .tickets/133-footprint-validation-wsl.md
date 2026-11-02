---
id: "133"
title: "Validate footprint guidance and inspector under WSL 2"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Each WSL 2 row is observed, corrected, or marked with why it could not run."
  - "The inspector reports the lower of the distro and Windows free space."
  - "Reclaiming guidance matches measured behaviour with and without sparse mode."
  - "The fixture test passes under WSL 2; output recorded; `node scripts/gate.mjs pre-merge` passes."
tags: ["type:chore","stream:test-verification"]
---

# Validate footprint guidance and inspector under WSL 2

## Why

Ticket 110 decided that under WSL the free-space floor uses the lower of the distro's free space
and its Windows drive's, because the distro's `df` reports the virtual disk's maximum. The
inspector implements this by also reading `/mnt/c`, and the global rule names it, but neither was
run under WSL. The WSL rows of
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md),
including how `ext4.vhdx` gives space back, come from docs.

## What to check

In a WSL 2 distro, from a grey-matter checkout on the Linux filesystem:

- `command df -Pk` inside the distro against `/mnt/c` and `powershell.exe -NoProfile -c "(Get-Volume C).SizeRemaining"`.
- That the inspector detects WSL and takes the minimum, including when the distro's disk lives on
  a drive other than C (fix or file if `/mnt/c` is the wrong drive).
- Space given back to Windows after a delete, before and after sparse mode.
- `node --test scripts/inspect-footprint.test.mjs` and a `--summary` run.

Fix wrong rows and inspector bugs in place; file anything larger as its own ticket.

## Acceptance criteria

- [ ] Each WSL 2 row is observed, corrected, or marked with why it could not run.
- [ ] The inspector reports the lower of the distro and Windows free space.
- [ ] Reclaiming guidance matches measured behaviour with and without sparse mode.
- [ ] The fixture test passes under WSL 2; output recorded; `node scripts/gate.mjs pre-merge` passes.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: verify WSL 2 version, distro backing volume and the lower-of-host/distro free-space behavior,
then measure reclaim behavior in a disposable environment. Ubuntu is listed by wsl --list, but
version, usable tooling, backing drive and sparse-mode behavior were not verified in this
reconciliation. Preserve user distro settings and data; record unavailable probes explicitly.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Host prerequisite check 2026-11-02

The local Ubuntu distro is confirmed WSL 2. A read-only startup probe reported Linux kernel
6.6.87.2-microsoft-standard-WSL2 and Git at `/usr/bin/git`. Its `node` resolves to an imported
Windows mise shim that fails with `exec: node: not found`; a working native Linux Node 22+
runtime is still needed for the inspector checks. This is a tooling prerequisite, not an
inspector assertion failure. No sparse-mode setting, distro data or free-space behavior was
changed or claimed validated by that probe.

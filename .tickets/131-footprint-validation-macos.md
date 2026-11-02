---
id: "131"
title: "Validate footprint guidance and inspector on macOS"
status: backlog
blocked_by: []
priority: high
validation_criteria:
  - "Each macOS row is observed, corrected, or marked with why it could not run."
  - "The inspector's fixture test passes on macOS, or its failure is fixed or filed."
  - "Inspector free space and sizes agree with `command df` / `command du` on APFS."
  - "Commands and output are recorded in the research file; `node scripts/gate.mjs pre-merge` passes."
tags: ["type:chore","stream:test-verification"]
---

# Validate footprint guidance and inspector on macOS

## Why

Ticket 110 shipped per-OS footprint guidance and a read-only inspector, but only the Linux rows
were run. The macOS rows of
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md)
come from vendor docs or secondary sources, and the inspector's non-Linux paths (`lsof` for open
files, `statfs` on APFS) have never executed. The Mac is where the disk-pressure incident in
[proposal 16](../docs/agents/proposals/16-agent-footprint-guardrails.md) happened, so wrong
guidance there costs the most.

## What to check

On a Mac, from a grey-matter checkout:

- Each macOS row: `command df -Pk`, `command du -sk` on a folder holding an APFS clone
  (`cp -c`), `/usr/bin/trash` (macOS 15+) and whether Homebrew's `trash` shadows it, `lsof -w +D`,
  `stat -f %l`, `xcrun simctl list devices unavailable` / `delete unavailable` (as the user), and
  the DerivedData location.
- Which of `df`, `du`, `cat` the agent's shell aliases on that Mac.
- `node --test scripts/inspect-footprint.test.mjs` and a `--summary` run on a real repo.

Fix wrong rows and inspector bugs in place; file anything larger as its own ticket.

## Acceptance criteria

- [ ] Each macOS row is observed, corrected, or marked with why it could not run.
- [ ] The inspector's fixture test passes on macOS, or its failure is fixed or filed.
- [ ] Inspector free space and sizes agree with `command df` / `command du` on APFS.
- [ ] Commands and output are recorded in the research file; `node scripts/gate.mjs pre-merge` passes.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: obtain macOS/APFS host evidence for every named row, alias, clone/link/open-file behavior and
size/free-space comparison. Windows passing gates cannot satisfy this ticket. Use the same Mac
session as #175 where practical; if a hang is reproduced, retain that diagnosis under #175 and
recheck affected evidence after the fix.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Host prerequisite check 2026-11-02

Root's batch-mode, strict-known-host SSH attempt to the configured SpaceJam host (port 22)
timed out. No macOS command or footprint acceptance probe executed. Mac availability or another
connection was requested from the user; continue independent Windows/WSL work meanwhile.

The user then installed this machine's public key and supplied a reachable LAN address.
Direct batch-mode SSH to that address as the provided Mac account succeeded and reported
Darwin/macOS 26.6.2. Access is now available; no footprint acceptance probe has run yet.

## Partial host evidence 2026-11-02

The [observed host report](../docs/agents/research/footprint-macos-host-check-20261102.md)
records read-only results and limits. Free space is about 10.6 GiB, below the 20 GiB floor;
no fetch, build, fixture or gate run is permitted until space is available. CoreSimulator
has one available runtime, no unavailable devices, and two large shutdown project simulators
(12.12 and 8.99 GiB by du). User requested inspection and a concrete cleanup proposal;
deletion remains unexecuted pending confirmation that existing simulator data is disposable.
Independent critic accepted the report. This ticket remains in progress: APFS clone behavior,
inspector fixtures and the Mac pre-merge gate have not been validated.

User decision: preserve both simulator data trees and deliberately defer testing until other
projects wrap up and leave adequate free space. Parked in backlog; no cleanup authorized.
Resume with a fresh free-space check, then the remaining Mac acceptance observations.

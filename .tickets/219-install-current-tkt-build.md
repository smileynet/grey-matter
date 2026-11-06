---
id: "219"
title: "Install a tkt build that supports cancel/cancelled on this Windows machine"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "tkt --version reports a build that includes the cancel command (898ceb5 or later); tkt cancel --help succeeds"
  - "tkt validate --brief has no unparseable error for ticket 172"
tags: ["stream:tooling", "triage:ready-for-human"]
---

# Install a tkt build that supports cancel/cancelled on this Windows machine

## What to build

Intent source: the 2026-11-03 sync. Ticket 172 uses `status: cancelled` (written by a tkt dev build with `tkt cancel`). The installed `C:\Users\sabiggin\.cargo\bin\tkt.exe` is `tkt 0.4.0 (92d4833)`, the 2026-10-19 v0.4.0 tag, 449 commits behind `../tkt` HEAD. It has no `cancel` subcommand and rejects `cancelled` as "bad status". So `tkt validate` and the gate's `ticket-graph` check are red on this machine. `docs/agents/tkt-conventions.md` already cites build `898ceb5` for cancel/reopen.

Human step: `cargo` is not on PATH here (only `tkt.exe` is in `~/.cargo/bin`). Either install rustup and run `cargo install --path ../tkt --locked`, or install a published tkt binary that includes cancel support. Do not hand-edit ticket 172's status to make validation pass.

## Acceptance criteria

- [x] `tkt --version` reports a build that includes the cancel command (898ceb5 or later); `tkt cancel --help` succeeds
- [x] `tkt validate --brief` has no unparseable error for ticket 172

## Resolution (2026-11-06)

done: installed tkt 0.4.0 (9a10d3a) from ../tkt, which parses cancelled tickets. sync (2b207dd) now updates the tkt checkout and reinstalls the binary as its first step, so any machine that runs sync, including the one this ticket first described, gets a cancel-capable build.

### Verification
1. ✓ tkt --version reports a build that includes the cancel command (898ceb5 or later); tkt cancel --help succeeds — "tkt --version: tkt 0.4.0 (9a10d3a), installed via cargo install --path ../tkt --locked on 2026-11-06; git merge-base --is-ancestor 898ceb5 9a10d3a succeeds; tkt cancel --help prints usage"
2. ✓ tkt validate --brief has no unparseable error for ticket 172 — "tkt validate --brief: pass (24 findings, none unparseable; 172 and 215 parse)"

---
id: "33"
title: "tkt: allow checking ACs on a superseded/closed ticket (or validate --fix to repair unchecked-acs-on-done)"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "There is a tkt-accepted path to resolve an unchecked-acs-on-done finding on a legitimately-superseded ticket without hand-editing the ticket file"
tags: ["type:chore", "stream:tooling"]
---

# tkt: allow checking ACs on a superseded/closed ticket (or validate --fix to repair unchecked-acs-on-done)

## What to build

An upstream tkt enhancement (lives in `D:\code\tkt`, tracked here so the finding isn't
lost). tkt 0.4.0 offers **no supported path** to clear an `unchecked-acs-on-done` finding
on a ticket that was closed as superseded without `--check-all`.

## Context

Found while working grey-matter ticket 29 (reconcile closure records). Ticket 07 was closed
(correctly) as superseded by ticket 14, but without `--check-all`, so its four AC boxes are
`[ ]` and `tkt validate --strict` flags `unchecked-acs-on-done`. Every tkt mutation path is
refused once a ticket is done on the remote:

- `tkt close 07 --force --check-all` -> "07 is already done (updated on remote)"
- `tkt edit 07 --ac 1,2,3,4` -> "ticket 07 was closed on remote"
- `tkt edit 07 --status in_progress` (to reopen/fix/reclose) -> "closed on remote"
- `tkt validate --fix` -> "Nothing to fix"

So the only way to flip the boxes is a hand-edit of the ticket file, which the project's
closure-rule discipline forbids (never hand-set closure state). The warning is therefore a
permanent historical artifact for any such ticket.

## Possible designs (pick one upstream)

1. Allow `tkt close <id> --force --check-all` to re-close an already-done ticket when the
   effect is only to check ACs + append a supersession resolution (idempotent, gated).
2. Allow `tkt edit <id> --ac ...` on a done ticket specifically for AC checkboxes.
3. Have `tkt validate --fix` offer to check ACs on a done ticket whose resolution records a
   supersession/migration, or downgrade/suppress the finding for `--force`-closed tickets.

## Acceptance criteria

- [ ] A tkt-accepted path exists to resolve an unchecked-acs-on-done finding on a legitimately-superseded/closed ticket, without hand-editing the ticket file.

## Resolution (2026-10-29)

Migrated to tkt 182 (cancel or retire operation): the need is a tkt-accepted way to retire a superseded ticket without hand-editing it, which belongs to tkt, not grey-matter.

---
id: "132"
title: "Validate footprint guidance and inspector on Windows"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Every Windows row of footprint-by-os.md was run in PowerShell on Windows (edition, build, PowerShell version recorded) and is retagged observed, corrected, or kept with the reason it could not run."
  - "The Recycle Bin route is tested with a file under and a file over the drive's bin cap: what OnlyErrorDialogs and AllDialogs actually do to the oversized file is recorded, and the guidance matches."
  - "node --test scripts/inspect-footprint.test.mjs runs on Windows; with no open-file probe it reports partial coverage rather than a false skip or pass, and any failure is fixed or filed with its output."
  - "inspect-footprint.mjs --repo <a real repo> --summary reports free space that matches Get-Volume, and an online-only OneDrive placeholder is reported without being counted as disk use or offered for deletion (or the gap is filed)."
  - "The research file records the commands and output; node scripts/check-repo.mjs passes on Windows."
tags: ["stream:tooling", "type:chore"]
---

# Validate footprint guidance and inspector on Windows

## Why

Ticket 110's Windows guidance in
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md)
was never run. The riskiest row is inferred from .NET source: `OnlyErrorDialogs` likely deletes a
file over the Recycle Bin cap permanently, which is why the rule says to list such files instead.
The inspector has never run on Windows either: it has no open-file probe there, and its walk and
`statfs` paths are untested on NTFS, ReFS or Dev Drive.

## What to check

On Windows, in PowerShell, from a grey-matter checkout (read
[windows-powershell-gotchas](../docs/agents/windows-powershell-gotchas.md) first):

- Each Windows row: `Get-Volume -FilePath`, the `Get-ChildItem | Measure-Object` size and its
  hard-link double count, the `Microsoft.VisualBasic` recycle call under and over the bin cap,
  the bin cap itself, `handle.exe` availability, `fsutil hardlink list`, and a OneDrive
  placeholder.
- `node --test scripts/inspect-footprint.test.mjs` and a `--summary` run on a real repo.

Fix wrong rows and inspector bugs in place; file anything larger as its own ticket.

## Acceptance criteria

- [ ] Each Windows row is observed, corrected, or marked with why it could not run.
- [ ] Recycle Bin behaviour over the cap is observed and the guidance matches it.
- [ ] The inspector's fixture test runs and reports open files as unchecked, or the failure is fixed or filed.
- [ ] Inspector free space matches `Get-Volume`; OneDrive placeholders are handled or filed.
- [ ] Commands and output are recorded; `node scripts/check-repo.mjs` passes on Windows.

## Observed failure (2026-10-31, from the ticket 125 session)

`node --test scripts/inspect-footprint.test.mjs` on Windows 11 Pro 10.0.26300, Node from this checkout, fails 3 of 7 on a clean detached worktree of `HEAD` (so it is not caused by uncommitted work), which makes `check-repo` invariant 13 red:

- `not ok 1 - seeded families get the right facts and outcomes, and the run goes red`: expected `'skip'`, actual `'keep'`
- `not ok 4 - the free-space floor and the summary line`: `1 !== 2`
- `not ok 5 - goes green once the seeded problems are cleaned up`: expected `0`, actual `1`

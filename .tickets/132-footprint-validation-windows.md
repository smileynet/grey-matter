---
id: "132"
title: "Validate footprint guidance and inspector on Windows"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "Each Windows row is observed, corrected, or marked with why it could not run."
  - "Recycle Bin behaviour over the cap is observed and the guidance matches it."
  - "The inspector's fixture test runs and reports open files as unchecked, or the failure is fixed or filed."
  - "Inspector free space matches `Get-Volume`; OneDrive placeholders are handled or filed."
  - "Commands and output are recorded; `node scripts/gate.mjs pre-merge` passes on Windows."
tags: ["type:chore","stream:test-verification"]
---

# Validate footprint guidance and inspector on Windows

## Why

At filing, ticket 110's Windows guidance in
[footprint-by-os.md](../skills/meta/repository-artifact-hygiene/references/footprint-by-os.md)
had not been run. The riskiest row was inferred from .NET source: `OnlyErrorDialogs` likely deletes a
file over the Recycle Bin cap permanently, which is why the rule says to list such files instead.
The inspector originally lacked Windows execution evidence. Later #137/#176 gate runs passed
its Windows fixtures; it still has no open-file probe there. Full filesystem-variant, bin-cap
and cloud-placeholder observations remain acceptance work for this ticket.

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

- [x] Each Windows row is observed, corrected, or marked with why it could not run.
- [x] Recycle Bin behaviour over the cap is observed and the guidance matches it.
- [x] The inspector's fixture test runs and reports open files as unchecked, or the failure is fixed or filed.
- [x] Inspector free space matches `Get-Volume`; OneDrive placeholders are handled or filed.
- [x] Commands and output are recorded; `node scripts/gate.mjs pre-merge` passes on Windows.

## Observed failure (2026-10-31, from the ticket 125 session)

`node --test scripts/inspect-footprint.test.mjs` on Windows 11 Pro 10.0.26300, Node from this checkout, fails 3 of 7 on a clean detached worktree of `HEAD` (so it is not caused by uncommitted work), which makes `check-repo` invariant 13 red:

- `not ok 1 - seeded families get the right facts and outcomes, and the run goes red`: expected `'skip'`, actual `'keep'`
- `not ok 4 - the free-space floor and the summary line`: `1 !== 2`
- `not ok 5 - goes green once the seeded problems are cleaned up`: expected `0`, actual `1`

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: complete the still-unobserved Windows row/bin-cap/cloud-placeholder probes, using owned
disposable fixtures for potentially destructive cases. The October 31 three-test failure is
historical: later #137/#176 artifact-hygiene gate runs passed on Windows (see the tracked
test-optimization evidence). Those runs do not prove Recycle Bin cap behavior, placeholder
allocation or every filesystem variant. Reproduce any remaining defect against current source before
fixing it.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Partial Windows verification 2026-11-02

Reviewed worker commit 00552356 updates the
[OS observation report](../docs/agents/research/footprint-commands-by-os-20261031.md).
Current inspector fixtures pass 7/7 and worker full pre-merge passes 19/19. Windows
Get-Volume and inspector free-space values match exactly on this host. Historical failures
did not reproduce; no cause or source fix is claimed. Open-file coverage is unavailable and
incomplete. A tiny owned hardlink fixture was recycled; no existing Bin contents were inspected.
At that point, the over-cap Bin scenario remained unrun because no safe isolated environment was
available. No host Bin settings or cloud data were changed.

## Isolated Recycle Bin cap probe 2026-11-02

Observed the `OnlyErrorDialogs` over-cap behavior in a disposable Windows Sandbox; this replaces
the earlier unrun status above. The host was Windows 11 Pro 10.0.26300, non-admin, with 5.09 GiB
available RAM and 93.25 GiB free on D: before startup. The Sandbox guest was Windows 11 Enterprise
build 26100 under interactive `WDAGUtilityAccount`, with 2048 MiB memory, networking and clipboard
redirection disabled, and exactly one writable mapping: an owned disposable fixture folder. The
per-volume C: `MaxCapacity` value changed only inside the Sandbox from 6137 to 1. The C: Bin began
empty; `SHQueryRecycleBinW` returned 0 items and 0 bytes.

The guest ran `Microsoft.VisualBasic.FileIO.FileSystem.DeleteFile(path,
UIOption.OnlyErrorDialogs, RecycleOption.SendToRecycleBin)`. A 512 KiB control disappeared from its
source and appeared in the C: Bin (1 item, 524,288 bytes). A 2 MiB fixture also disappeared from its
source, while the C: Bin stayed at 1 item and 524,288 bytes. This is direct evidence that the larger
fixture was not recycled under the tested cap; paired Bin counts and sizes distinguish it from the
under-cap control. No host Bin settings or contents were read or changed. The guest shut down, the
Sandbox window was closed after the report was written, and no Sandbox VM/client processes remained.

The guidance now labels this as observed only in the disposable Sandbox and keeps the default cap
claim secondary. Full measurements and official API/config references are in
[the Windows Sandbox Bin-cap evidence](../docs/agents/research/evidence/footprint-win-bin-cap-20261102.json).
OneDrive online-only placeholder behavior was not tested; [ticket 192](192-footprint-onedrive-placeholder.md)
tracks an owned placeholder follow-up. Other Windows rows and the current Windows pre-merge gate
remain to be checked before ticket close.

## Final integration and acceptance 2026-11-02

Independent critic accepted the isolated Bin result and its limits. Root resolved the evidence
merge by retaining the updated historical context and the #192 link, integrated at cb3bfdf,
and observed pre-merge ticket-graph/agent-guidance pass 2/2 (0.4/1.1 s). Pre-push passed 5/5;
canonical deploy check/default passed, installing 50 skills. The combined source was previously
covered by pre-release 29/29 at 8e6396b and integrated pre-merge 20/20 at ed60767; the Bin slice
changes only evidence/guidance. Root's final Windows fixture command
`node --test scripts/inspect-footprint.test.mjs` passed 7 with 2 WSL-only skips and zero failures
in 2.757 s. It explicitly asserts unavailable/incomplete open-file coverage. The separate
native WSL run passed those fixtures 9/9; Windows skips are not Linux execution evidence.

Every Windows row is observed or has an explicit unavailable reason in the report: current
NTFS size/hardlink and free-space readings, controlled guest Bin cap, unavailable handle.exe,
and the untested owned cloud case filed to #192. No historical failure cause or universal
filesystem behavior is inferred. Sandbox guest/window/processes are gone. Retain its 7,367-byte
script/config/raw-result set and named worker checkouts for the #192/shared platform evidence
audit; retire them after the remaining platform follow-ups no longer need regression/reproduction
inputs. Promoted JSON/report are durable; no host Bin state or existing cloud data changed.

## Resolution (2026-11-02)

done: Windows footprint rows and isolated over-cap Bin behavior qualified; reviewed, merged, pushed and deployed. Host Bin untouched; OneDrive branch filed separately192, not claimed tested. NativeWindows7pass2WSLskips; open-file detection remains explicitly unavailable. Evidence promoted in OS report/JSON. Sandbox VM/processes closed. Keep7,367-byte named Sandbox script/config/raw results and t132 workers for192/shared-platform evidence audit; retire after remaining platform integrations no longer need reproduction inputs.

### Verification
1. ✓ Each Windows row is observed, corrected, or marked with why it could not run. — "AllWindowsrows observedorexplicitunavailable inOSreport: size/hardlinks/GetVolume/controlledguestBin; handleabsentfromPATH, fsutilvolumeinfoAccessDenied recorded; cloudfixturegapfiledto192. No universalFSclaim."
2. ✓ Recycle Bin behaviour over the cap is observed and the guidance matches it. — "OwnedSandboxWindows26100 cap1MiB; freshSHQueryRecycleBinW baseline0/0,512KiBcontrolrecycled1/524288,2MiBovercapsourcegoneBinunchanged. PromotedJSON5e693bf, criticaccepted; hostBinuntouched, VMprocessesclosed."
3. ✓ The inspector's fixture test runs and reports open files as unchecked, or the failure is fixed or filed. — "Rootfinal node --test scripts/inspect-footprint.test.mjs passed7with2WSLskips0fail2.757s, explicitlyassertsopenfileunavailable/incomplete. Historicalfailuresnotreproducednocauseclaimed."
4. ✓ Inspector free space matches `Get-Volume`; OneDrive placeholders are handled or filed. — "RecordedGetVolumeandstatfsfreebytesexactmatch; OneDriveonlineonlycasecapturedinopen192withapprovedfixtureprerequisite ashandledORfiledcriterionpermits; nocloudclaim."
5. ✓ Commands and output are recorded; `node scripts/gate.mjs pre-merge` passes on Windows. — "Commands/results promotedJSONandOSreport; rootpremerge2/2atcb3bfdfprepush5/5deploy50skillspass. Priorcombinedsource29/29prereleaseand20/20integratedpremerge citedincandidates. NewBinchangeevidence/guidanceonly."

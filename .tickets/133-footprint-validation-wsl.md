---
id: "133"
title: "Validate footprint guidance and inspector under WSL 2"
status: done
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

- [x] Each WSL 2 row is observed, corrected, or marked with why it could not run.
- [x] The inspector reports the lower of the distro and Windows free space.
- [x] Reclaiming guidance matches measured behaviour with and without sparse mode.
- [x] The fixture test passes under WSL 2; output recorded; `node scripts/gate.mjs pre-merge` passes.

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

## Reviewed implementation and native evidence 2026-11-02

Worker commits f741565, 3b7eb5c and 60518e7 fix an observed non-C backing-volume defect.
The current Ubuntu VHD and owned disposable test VHD are on E:, while the old inspector
reported C:'s free space. The inspector now resolves the exact current distro registration,
its VHD and the Windows volume; missing, ambiguous or malformed evidence remains review/
incomplete, and summary mode says the host floor is unverified. Critic findings about malformed
capacity coercion, volume identity and under-floor summary disclosure were corrected and
independently accepted. A timing-sensitive real-host assertion was corrected to check stable
volume identity and each result's own minimum; deterministic fixtures prove exact arithmetic.

Native WSL fixtures on final source passed 9/9 with no skips. Final native pre-merge selected
artifact-hygiene only (1/19), passing in 15.8 s. A prior full attempt's artifact group had one
assertion failure from comparing host free space at different times; a separate early run had
PowerShell PATH infrastructure errors. Neither is counted as a pass. Exact commands, source
URLs/checksums and observations are in the
[OS research report](../docs/agents/research/footprint-commands-by-os-20261031.md).

Root integrated reviewed source privately, observed pre-release 29/29 at 8e6396b (deployer
95.7 s, release integration 164.2 s), then integrated reviewed guidance and concurrent-session
changes and passed pre-merge 20/20 on ed60767. Main was fast-forwarded and pushed; pre-push 6/6
and canonical deploy check/default passed, installing 50 skills. At that point host reclaim
with and without sparse mode remained unobserved. Owned WSL resources were retained for that measurement and final
cleanup; existing distro settings and default were preserved.

## Reclaim measurements completed 2026-11-02

Final worker report 27aed40 records both modes. After verifying every distro stopped,
two idle-VM shutdowns released the owned VHD lock; no active existing distro was interrupted.
Non-sparse guest unlink restored guest blocks immediately, while host allocation returned
only after the idle VM shutdown. Sparse mode was enabled only on the disposable distro,
with WSL 2.6.3's explicit experimental/corruption warning and required unsafe flag recorded.
For the bounded 16 MiB write, logical growth was 32 MiB but sparse allocation grew 9 MiB;
immediate unlink/terminate did not reclaim it, while the next owned launch did. The subsequent
fstrim output named about 1.08 TB of virtual trimmed space, but the measured extra host
allocation change was only 64 KiB. Neither number is generalized into a timing guarantee.
Existing Ubuntu/Podman remained stopped and Podman remained the default afterward.

Critic accepted the final source and measurement/guidance limits. Root integrated final
documentation at 0c0823e; initial automatic pre-merge selected zero checks (not a pass),
then explicit agent-guidance pre-merge passed 1/1. Pre-push passed 5/5; canonical deploy
check/default passed again, installing 50 skills. All four criteria are now supported.
Keep the named disposable WSL distro, pinned inputs and worker checkout as the shared
cross-platform validation baseline through remaining #131/#175 integration; retire them
after those platform checks no longer need Linux regression coverage. Sizes and exact
resource names are recorded in the research report. No simulator data was deleted.

## Resolution (2026-11-02)

done: WSL backing-volume defect fixed and both reclaim modes measured; reviewed, merged, pushed and deployed. Claims are bounded to recorded host/version/samples; unsafe sparse enabled only on owned disposable distro, no existing distro data/settings changed. Evidence promoted in OS report and ticket. Keep named WSL distro/pinned inputs and t133-worker as reusable shared test-verification baseline through remaining131/175 platform integration; retire afterward. Mac simulators untouched and deferred per user.

### Verification
1. ✓ Each WSL 2 row is observed, corrected, or marked with why it could not run. — "Each WSLrow observed/corrected orbounded in report27aed40; Ubuntu/disposabledistroVHDlocatedonE; existingdistrosStopped/defaultunchanged. Registryactualvolume replacesC assumption; guide records experimental sparsewarning scopedonlytodisposable."
2. ✓ The inspector reports the lower of the distro and Windows free space. — "RedactualE-backedrun reportedC151043506176 versusE96183488512; fixednative9/9 verifiesregisteredvolumeidentity andminofentries; deterministichostfixtures exactmin, malformed/unavailablefailclosed andfloorunverifiedsummary."
3. ✓ Reclaiming guidance matches measured behaviour with and without sparse mode. — "Bothmode16MiBsamples measured: nonsparseunlinkguestonlythenidleVMshutdownhostrecovery; sparselogical32MiBvsphysical9MiB, laterlaunchrecovery; fstrimvirtual1.08TB distinguishedfrom64KiBhostchange. Criticacceptedboundedguidance/report27aed40."
4. ✓ The fixture test passes under WSL 2; output recorded; `node scripts/gate.mjs pre-merge` passes. — "Finalnative9/9 noskips; selectednativepremergeartifact1/19passed15.8s. Rootprerelease29/29at8e6396b, integratedpremerge20/20ated60767, finaldocsguidance1/1at0c0823e; prepush5/5anddeploy50skills passed. Earlierassertion/PATHinfra disclosed."

# macOS footprint and inspector checks: partial host evidence

**Date:** 2026-11-02. **Tickets:** 131 and 175. **Host scope:** user-provided Mac,
macOS 26.6.2, arm64, zsh. Host identity, address, and account are intentionally omitted.
**Checkout:** existing `~/code/grey-matter`, clean at initial inspection on
`main...origin/main`; final read-only `git rev-parse HEAD`: `c739cbbff161dc4d15fdd0bdd4f5e5c7a450a49b`.
No checkout files were changed. No fetch, clone, build, test suite, gate, fixture, APFS
clone, simulator deletion, or remote file creation was performed.

## Stop condition

At first contact, `command df -Pk "$HOME"` reported 11,127,212 KiB available on the
Data volume (about 10.6 GiB, 98% used), below the repository's 20 GiB minimum. A later
read-only inventory reported 11,121,480 KiB available. Work that could add data stopped;
the macOS test suite and gates remain unrun. Current host evidence therefore cannot close
either ticket.

## 175: inspector test and lsof timing

The required `node --test scripts/inspect-footprint.test.mjs` was not run because of the
free-space stop. Node is installed as `/opt/homebrew/bin/node` (version `v26.7.0`), but
the login shell does not resolve bare `node`; existing `node_modules` is present. This
does not substitute for a current suite run.

| Probe | Result | Classification |
|---|---|---|
| `/usr/bin/time -p /usr/sbin/lsof -Fn -w +D "$HOME/code/grey-matter" >/dev/null` | real 0.63 s; user 0.04 s; sys 0.35 s | Completed, repository-scoped; not the required whole-host timing |
| `/usr/bin/time -p /usr/sbin/lsof -Fn -w >/dev/null` | No output or timing within the 20 s client wait; probe was externally stopped | Incomplete, lower bound >=20 s; no completion time or causal finding |
| `/usr/bin/timeout 15 ...` wrapper | `/usr/bin/timeout` is absent on this macOS host | Infrastructure error; lsof was not started by this attempt |

After the incomplete whole-host attempt, a process-pattern `pkill -f "lsof -Fn -w"`
command had already been issued. I will not repeat it: pattern matching can affect a
different user's probe or a shell containing the pattern. A subsequent read-only `ps`
check found no remaining `lsof -Fn -w` process, but cannot establish what the earlier
pattern command matched. The scoped result does not establish that the inspector's actual
whole-host call completes quickly, and the incomplete whole-host probe does not prove the
original historical hang's cause.

## 131: read-only macOS observations

The following bounded inventory used `command du -sk` on existing paths only. Sizes are
allocated KiB; no contents were copied or removed.

| Existing path | `du -sk` KiB | Ownership / lifecycle |
|---|---:|---|
| `~/code/grey-matter/.scratch` | 232,916 | Existing user data; ownership of individual contents not established; untouched |
| `~/Library/Developer/Xcode/DerivedData` | 215,128 | Existing user data; untouched |
| `~/Library/Developer/CoreSimulator` | 22,810,336 | Existing simulator data; individual ownership/use not established; untouched |

Other observations:

- `command df -Pk "$HOME"` succeeded; see the stop-condition figures above.
- `command -v trash` returned `/usr/bin/trash`; that system binary exists. No Homebrew
  `trash` shadow was observed.
- `alias df du cat` emitted no aliases in the login shell.
- `xcrun simctl list devices unavailable` completed and showed a device-list header and
  iOS 27.0 section; no device rows were returned. `xcrun simctl delete unavailable` was
  not run because that destructive action was outside owned disposable fixtures.
- `~/Library/Developer/Xcode/DerivedData` exists. The command did not establish whether
  Xcode Locations or a build override moves any project's output elsewhere.
- Node's absolute executable and version were observed as above; Git was 2.54.0. The
  initial existing checkout had `node_modules` and no tracked or untracked status output.

## Still required

- On a host above the 20 GiB threshold, run the current inspector suite and
  `node scripts/gate.mjs pre-merge --include artifact-hygiene` for #175, then run the
  #131 pre-merge gate.
- Record a completed, measured whole-host `lsof -Fn -w` invocation using a safe
  process-handle timeout method; the current observation is only a >=20 s lower bound.
- On an adequately provisioned host, run APFS clone/`du` comparisons and the inspector's
  `--summary` against a real repository, comparing its figures to `command df -Pk` and
  `command du -sk`.
- The `simctl delete unavailable` behavior remains unobserved; run only with explicit
  confirmation that affected devices are disposable and owned for this task.

## CoreSimulator read-only follow-up

After the initial free-space stop, a further read-only inspection was requested to identify
possible simulator cleanup. Free space remained below the 20 GiB floor: a fresh
`command df -Pk "$HOME"` reported 11,134,636 KiB available (98% used). No deletion or
other write was performed.

`xcrun simctl list runtimes` showed one available runtime: iOS 27.0, build 24A434.
`xcrun simctl list devices unavailable` returned no unavailable devices. `xcrun simctl
list devices` showed 12 devices, all Shutdown: ten generic iPhone/iPad devices, plus two
named devices, `Philippines Guide` and `Tagalog Helper`. No older installed runtime was
listed. The runtime's `simctl list runtimes -j` bundle path was under a mounted Apple
cryptex; `/Library/Developer/CoreSimulator/Profiles/Runtimes` had no entries. The runtime
bundle itself was not traversed for size.

Allocated `du -sk` results for the two named, shutdown simulator directories:

| Device | Directory | `du -sk` KiB | Approx. GiB |
|---|---|---:|---:|
| Philippines Guide | `~/Library/Developer/CoreSimulator/Devices/71C98FA5-66DD-491E-A642-A40AE91978CC` | 12,708,076 | 12.12 |
| Tagalog Helper | `~/Library/Developer/CoreSimulator/Devices/757E91C9-09FD-4E85-B93D-7BD16FCBCB0C` | 9,423,016 | 8.99 |

The other ten registered simulator directories measured 17,912 KiB each, except the
Shutdown iPhone 17 at
`~/Library/Developer/CoreSimulator/Devices/BA44BA40-9345-485D-88A7-5E0846E0407E`,
which measured 518,008 KiB (~0.49 GiB). Three other device UUID directories existed on
disk but were absent from `simctl list devices`; each had only an empty `data` directory
and `du -sk` measured 0 KiB: `5108C41D-BBD2-4D46-9D01-B12C27CE7048`,
`5E9042AD-0E8F-47F2-BDB7-158B357CA79A`, and
`D379EF18-E182-4064-966D-4A2305ADB8C6`. They cannot provide meaningful disk recovery.
The registered device directory totals (22,810,308 KiB) differ from the enclosing
`Devices` scan (22,810,324 KiB) by 16 KiB; the enclosing CoreSimulator scan was
22,810,336 KiB, another 12 KiB of directory accounting.

### Cleanup proposal (not executed)

The only material candidates are the two named simulator data trees, together measuring
22,131,092 KiB (`du` upper-bound, about 21.1 GiB). Both appear to contain substantial
simulator state, and their names suggest project/user content; shutdown status does not
show that the app data is disposable. Preserve both unless their owner confirms they can
be recreated and their in-simulator data is no longer needed. If confirmed, use
`xcrun simctl delete 71C98FA5-66DD-491E-A642-A40AE91978CC` and/or
`xcrun simctl delete 757E91C9-09FD-4E85-B93D-7BD16FCBCB0C` as the user, then remeasure
`df` and `du`. Actual freed APFS space may be lower than `du` because clones/shared blocks
can remain referenced. No specific runtime removal is supported by the observed inventory:
only iOS 27.0 is installed and it is available. The three unregistered empty directories
have a 0 KiB measured footprint and are not actionable cleanup targets.

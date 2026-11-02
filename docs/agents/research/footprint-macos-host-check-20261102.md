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

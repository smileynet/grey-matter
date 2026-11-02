---
id: "137"
title: "Slim the deployer and release-integration checks (92 s and 146 s at pre-release)"
status: done
blocked_by: []
validation_criteria:
  - "Per-file timings are recorded and fast release unit tests are separated from release integration checks."
  - "The targeted release fixtures and deployer avoid repeated setup, with observed before/after timings and limits recorded."
  - "Pre-release still covers every previously gated test file."
  - "node scripts/gate.mjs pre-release passes after the optimization."
tags: ["stream:test-verification"]
---

# Slim the deployer and release-integration checks (92 s and 146 s at pre-release)

## Observed (2026-11-01, Windows 11, `node scripts/check-repo.mjs --full`)

Total 233 s. Group 1 (deploy.test.mjs) took 90.8 s and group 11 (17 release test files) 116.2 s;
every other group is under 10 s. `--affected` selects both whenever a plugin manifest,
`.agents/`, `.kiro/` or `skill-packs.json` changes, so such a push takes about 210 s, over the
2 min pre-push budget in [local gates](../docs/agents/local-gates.md).

## Update 2026-11-01

Since ba5d38a no test group runs at push; they run only in `--full`, the release gate. The
2 min pre-push budget no longer applies to groups 1 and 11. What is left is release-gate time.

## What to build

Profile both groups (`node --test --test-reporter=spec` per file) and, in order: narrow the
slow tests (shared fixtures, fewer temp-repo builds), split group 11 so `--affected` selects
only the release files whose sources changed, then move whatever stays slow to `--full` only.

## Acceptance criteria

- [x] Timing per file is recorded, and the release group is split: fast files pre-merge (`release-units`), slow files pre-release (`release-integration`).
- [x] The four slow release files (artifacts, development, product, git/verify) and `deploy.test.mjs` share or narrow fixtures that are rebuilt needlessly, with before and after times recorded here.
- [x] Pre-release still runs every test it ran before (`gates-coverage` fails on any unrun test file).
- [x] `node scripts/gate.mjs pre-release` passes after the slimming (it passes 25/25 in 294 s before it).

## Progress 2026-11-01 (proposal 18 step 3)

`check-repo.mjs` is retired; its groups are `gates.json` checks. Per-file times on Windows 11
(`node --test` per file; the host was under load, so treat them as upper bounds):

| File | Time | Stage now |
|---|---|---|
| deploy.test.mjs | 81.5 s (45 tests) | pre-release `deployer` |
| release-artifacts.test.mjs | 111.4 s (31 tests) | pre-release `release-integration` |
| release-development.test.mjs | 81.5 s (14 tests) | pre-release `release-integration` |
| release-product.test.mjs | 52.0 s (10 tests) | pre-release `release-integration` |
| release-native.test.mjs | 16.9 s | pre-release `release-integration` |
| release-entrypoints.test.mjs | 11.4 to 13.1 s | pre-release `release-integration` |
| release-git, release-verify, release.test.mjs | not measured cleanly (load) | pre-release `release-integration` |
| eight other release-*.test.mjs | 0.3 s together (78 tests) | pre-merge `release-units`, scope `scripts/release` |

Done: the split (fast release files are scoped pre-merge; the slow ones run only before a
release). Left: narrowing the four slow files' fixture rebuilds, the first criterion's
"narrowed" half.

Host finding: during this run a bare `git remote get-url` from Node averaged 324 ms (max
3.2 s) against tens of ms normally, with 3.2 of 31.4 GB RAM free; release-git, release-verify
and deploy hit their 120 s test timeouts with a `git.exe` that had no child process. Not a
code fault, but these suites make hundreds of Git calls, so host load multiplies their time.

## Progress 2026-11-02 — implementation present, verification incomplete

- Shared test-owned Git defaults remove repeated identity and line-ending configuration calls.
- Artifact, development and ref fixtures reuse immutable Git histories while retaining independent
  working trees, refs and remotes. Verification fixtures copy mutable artifact bundles from immutable
  per-product/script seeds. The seed roots live through the suite and are cleaned afterward.
- Windows fixture workers select the Git binary from the reported installation instead of its cmd
  shim. A five-call startup sample changed from 267 ms mean to 108 ms through the test helper.
- Removed the duplicate deploy-validation import; the gate still explicitly runs both test files.
  The eight release files remain present, running sequentially to reduce memory contention.

Observed per-file profile (180-second diagnostic bound; timings are not a controlled comparison):

| File | Before | Optimized profile | Outcome |
|---|---:|---:|---|
| artifacts | 111.7 s | 70.1 s | pass |
| development | timeout at 181.3 s | 177.9 s | pass |
| git | 166.4 s | 150.6 s | pass |
| product | 33.2 s | 22.3 s | pass |
| verify | timeout at 181.2 s | timeout at 184.4 s | incomplete |
| deployer group | 116.8 s | not measured | incomplete |

The full main release file also exceeded the diagnostic bound; its isolated CLI-termination case
passed in 24.8 s. No lifecycle defect was reproduced by that isolated case.

Latest `node scripts/gate.mjs pre-merge --base d62347c`: 17 checks pass; gate-runner and
artifact-hygiene time out at their unchanged 120-second outer limits. Free RAM fell to about
0.6 GiB out of 31.4 GiB. Heavy verification is stopped pending available resources; no SKIP was used.
The earlier timer-based descendant test was replaced by a post-termination PID probe and a
parent-only mutation control (focused run passes 2/2). Inner whole-file Node deadlines were removed
from gate-runner and artifact-hygiene; their outer limits and the stage budget remain unchanged.

Structured observations and the reproducible per-file manifest:
[verification evidence](../docs/agents/research/evidence/test-optimization-20261102.json).
Required pre-release evidence is still missing, so this ticket remains in progress.

## Verification completed 2026-11-02

After free RAM recovered to about 4.5 GiB, candidate `67320db` passed the fresh pinned-base
pre-merge run (19 commands, including gate-runner 29.8 s and artifact-hygiene 11.3 s), the tracked
pre-push hook (7 commands), and the full hostile-config pre-release run (28 commands). Deployer took
86.0 s versus the earlier 116.8 s group observation; release integration took 228.9 s. These are
observations on different host loads, not a controlled speedup claim. Existing POSIX/Linux-only
fixtures skip on Windows. No SKIP override or outer timeout increase was used.

The evidence file now includes the fresh successful observations as `latestVerification`; earlier
timeouts remain historical evidence. The deployer flake investigation continues separately in #122.

## Resolution (2026-11-02)

done: narrowed repeat fixture setup and removed duplicate validation, preserving gated coverage. Pre-merge 19 commands and pre-push 7 completed. Promoted profiles and final evidence; recycled owned scratch and 20 MiB failed fixtures/worktrees. Kept current deployment packages until next deploy; preserved others' artifacts with sizes recorded. Historical deployer cause remains tracked separately in 122.

### Verification
1. ✓ Per-file timings are recorded and fast release unit tests are separated from release integration checks. — "Per-file baseline/optimized timings and full eight-file manifest are recorded in docs/agents/research/evidence/test-optimization-20261102.json; release-units stays pre-merge and release-integration pre-release."
2. ✓ The targeted release fixtures and deployer avoid repeated setup, with observed before/after timings and limits recorded. — "Immutable artifact/development/ref/verification seeds, shared Git defaults and direct Windows Git reduce repeated setup; duplicate deploy validation removed. Observed deployer 116.8s before and 86.0s after under different host loads; limits recorded."
3. ✓ Pre-release still covers every previously gated test file. — "Hostile-config pre-release completed all 28 commands, including gates-coverage and all eight release integration files; no SKIP override."
4. ✓ node scripts/gate.mjs pre-release passes after the optimization. — "Candidate 67320db: node scripts/gate.mjs pre-release with hostile GIT_CONFIG_GLOBAL completed 28 commands; deployer 86.0s, release-integration 228.9s. Existing Windows platform skips remain."

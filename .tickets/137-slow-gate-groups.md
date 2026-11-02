---
id: "137"
title: "Slim the deployer and release-integration checks (92 s and 146 s at pre-release)"
status: in_progress
blocked_by: []
tags: ["stream:tooling"]
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
- [ ] The four slow release files (artifacts, development, product, git/verify) and `deploy.test.mjs` share or narrow fixtures that are rebuilt needlessly, with before and after times recorded here.
- [x] Pre-release still runs every test it ran before (`gates-coverage` fails on any unrun test file).
- [ ] `node scripts/gate.mjs pre-release` passes after the slimming (it passes 25/25 in 294 s before it).

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

---
id: "175"
title: "Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# Reproduce the inspect-footprint test hang on macOS and confirm the lsof cause

Split from 151 on 2026-11-01. philippines-trip (macOS) saw `scripts/inspect-footprint.test.mjs`
run about 524 s before an outer timeout. It could not be reproduced on Windows, which has neither
`lsof` nor `/proc`, so open-file detection is reported unavailable there.

**Hypothesis (unverified):** each `inspect()` call scanned the whole machine with `lsof -Fn -w`
under a 60 s timeout, and the tests called it about ten times. Commit 936226e passes an empty
open-file set (`opts.open`) to six of seven tests, leaving one real scan plus three spawned CLI
runs. The pre-merge stage bounds the file with `--test-timeout=60000` and a 120 s runner timeout.

## Acceptance criteria

- [ ] On macOS, time `node --test scripts/inspect-footprint.test.mjs` and one `lsof -Fn -w` call; record both.
- [ ] If the file still exceeds its 120 s runner timeout, record which call is slow and either narrow the scan (for example `lsof +D <repo>`) or move the spawned CLI tests to pass `--open` data.
- [ ] `node scripts/gate.mjs pre-merge --include artifact-hygiene` passes on macOS.

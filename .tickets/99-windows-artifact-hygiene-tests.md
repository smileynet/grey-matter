---
id: "99"
title: "Repository artifact hygiene tests fail on Windows (newline filename, path separators)"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Each failure is reproduced on Windows and marked confirmed, rejected or obsolete with evidence before code changes."
  - "'policy globs cover newline-containing Git paths' runs on Windows without writing a newline filename to disk (e.g. git update-index --cacheinfo), or skips on win32 with the reason stated."
  - "'caller Git context cannot redirect...' compares repository paths in one form on every platform, and the chosen form is the one inspect-artifacts.mjs documents for scope.repository."
  - "node scripts/check-repo.mjs invariant 13 passes on Windows and still passes on macOS/Linux."
tags: ["type:bug", "stream:tooling"]
---

# Repository artifact hygiene tests fail on Windows (newline filename, path separators)

## What to build

TBD

## Acceptance criteria

- [ ] TBD

## Finding

Found by `sync` on Windows 11 (Node 24.17, Git Bash), 2026-10-28: `node scripts/check-repo.mjs`
invariant 13 (repository artifact hygiene) fails while the other 15 pass. Two tests in
`scripts/repository-artifact-hygiene.test.mjs` fail:

1. **`policy globs cover newline-containing Git paths`** (line 134). The fixture writes
   `evidence\nreport.html` to disk; Windows forbids newlines in filenames:
   `ENOENT: no such file or directory, open '...\gm artifact xhibTq\evidence` (from `put`, line 19).
   Hypothesis: the test is platform-bound, not the script. Stage the path straight into the
   index (`git update-index --add --cacheinfo` with a blob from `git hash-object -w --stdin`)
   so the inspector still sees a newline path, or skip on win32.

2. **`caller Git context cannot redirect the inspected repository or index`** (line 176).
   `scope.repository` is `C:\Users\...\gm artifact GyLOLD` while `realRoot()` (git
   `rev-parse --show-toplevel`) gives `C:/Users/.../gm artifact GyLOLD`. Hypothesis: decide
   which form `scope.repository` promises, then normalize either the script or the test's
   `realRoot()` to it.

Related: 83 (Windows cutover verification) and 60 (check-repo green on Windows, done).

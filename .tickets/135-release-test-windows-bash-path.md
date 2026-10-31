---
id: "135"
title: "release-artifacts test 31 fails on Windows: bash gets a backslash path"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# release-artifacts test 31 fails on Windows: bash gets a backslash path

## Observed (2026-10-31, from the ticket 125 session)

`node --test scripts/release-artifacts.test.mjs` on Windows 11 Pro 10.0.26300 passes 30 of 31. It fails the same way with the working tree stashed, so this is not caused by uncommitted work. This makes `check-repo` invariant 11 red:

```
not ok 31 - sealed runtime includes its dependency manifest and wrapper works in each host layout
  location: scripts/release-artifacts.test.mjs:192:1
  error: /bin/bash: C:UsersuosmiAppDataLocalTemprelease-artifact-test-OIxBHmcodexskillsexamplereferencesrelease.sh: No such file or directory
  expected: 0
  actual: 127
```

bash receives a native Windows path and drops its backslashes as escapes. Earlier the same day the gate showed only invariant 13 failing, so which `bash` gets resolved (Git Bash vs. WSL) may decide the result.

## What to build

Pass bash a path it can read (forward slashes or `cygpath`), or skip the wrapper check with a reason when no POSIX bash is present.

## Acceptance criteria

- [ ] Test 31 passes on Windows, or is skipped there with a stated reason.
- [ ] `node scripts/check-repo.mjs` invariant 11 is green on Windows.

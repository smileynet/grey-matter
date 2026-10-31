---
id: "136"
title: "delivery-dashboard tests 31-32 fail on Windows: cleanup calls gio trash"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# delivery-dashboard tests 31-32 fail on Windows: cleanup calls gio trash

## Observed (2026-10-31, from the ticket 126-129 session)

`node scripts/check-repo.mjs` invariant 15 is red on Windows 11. Two subtests of `scripts/delivery-dashboard.test.mjs` fail in their `after` hook, not their assertions:

```
not ok 31 - checker rejects malformed flow configuration and malformed tags
  location: scripts/delivery-dashboard.test.mjs:240:1
  failureType: 'hookFailed'
  error: 'spawnSync gio ENOENT'
not ok 32 - snapshot retains real ticket tags when the CLI omits them
  failureType: 'hookFailed'
  error: 'spawnSync gio ENOENT'
```

Line 235 cleans its temp fixture with `execFileSync("gio", ["trash", "--", dir])`. `gio` is a GNOME tool that Windows and macOS lack. The hook arrived with 2cd94cd.

## What to build

Clean the temp fixture portably (`rmSync(dir, { recursive: true, force: true })` on a `mkdtemp` directory the test owns), or pick a per-OS recycle route as the footprint guidance does.

## Acceptance criteria

- [ ] `node --test scripts/delivery-dashboard.test.mjs` passes on Windows.
- [ ] `node scripts/check-repo.mjs` invariant 15 is green on Windows.

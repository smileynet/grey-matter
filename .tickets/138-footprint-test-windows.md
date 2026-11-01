---
id: "138"
title: "inspect-footprint tests 1, 4, 5 fail on Windows (invariant 13 red before ticket-gates change)"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# inspect-footprint tests 1, 4, 5 fail on Windows (invariant 13 red before ticket-gates change)

## Observed (2026-11-01, Windows 11 Pro 10.0.26300)

`node --test scripts/inspect-footprint.test.mjs` passes 4 of 7, the same with commit 70219ca's
changes stashed, so it predates that change. This keeps `check-repo.mjs` invariant 13 red.

```
not ok 1 - seeded families get the right facts and outcomes, and the run goes red
  inspect-footprint.test.mjs:73  'keep' !== 'skip'
not ok 4 - the free-space floor and the summary line
  inspect-footprint.test.mjs:107  1 !== 2
not ok 5 - goes green once the seeded problems are cleaned up
```

Test 2's name ("the quiet floor skips recent writes: 15 minutes by default") suggests the
quiet-floor or mtime handling differs on Windows; unverified.

## Acceptance criteria

- [ ] `node --test scripts/inspect-footprint.test.mjs` passes on Windows, or each Windows-only difference is skipped with a stated reason.
- [ ] `node scripts/check-repo.mjs` invariant 13 is green on Windows.

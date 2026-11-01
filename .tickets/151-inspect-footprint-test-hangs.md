---
id: "151"
title: "inspect-footprint test hangs and fails the release gate"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "Hang reproduced and root cause recorded"
  - "Test completes or fails within a bounded time"
tags: ["stream:tooling"]
---

# inspect-footprint test hangs and fails the release gate

Since ba5d38a the pre-push gate runs only the static checks, so this no longer blocks
pushes. It still fails `check-repo.mjs --full`, which the release workflow runs: on
2026-11-01 the "seeded families" test expected an open file's folder to be `skip` and got `keep`.

## Origin

Observed 2026-11-01 from the philippines-trip session. Publishing `main` (14 commits ahead) ran the repository's git pre-push check, whose test run hung in `scripts/inspect-footprint.test.mjs` for about 524 seconds ("Promise resolution is still pending but the event loop has already resolved") until an outer 600-second timeout ended it with exit 124. The same hang explains `tkt new` stalling in its publish step for two sessions earlier that day (see 153 item 7). Nothing was published; the check was not bypassed.

## Acceptance criteria

- [ ] Reproduce the hang locally and record the root cause (the pending promise or unclosed handle).
- [ ] The test completes, or fails with a clear message, within a bounded time; the suite enforces a per-test timeout.
- [ ] `node scripts/check-repo.mjs --full` (the release gate) completes with this test; 153 item 7 is updated.

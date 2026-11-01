---
id: "151"
title: "inspect-footprint test hangs and fails the release gate"
status: done
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

- [x] Reproduce the hang locally and record the root cause (the pending promise or unclosed handle). Moved to ticket 175: not reproducible on Windows (no lsof); hypothesis recorded there.
- [x] The test completes, or fails with a clear message, within a bounded time; the suite enforces a per-test timeout.
- [x] `node scripts/check-repo.mjs --full` (the release gate) completes with this test; 153 item 7 is updated.

## Progress (2026-11-01)

- Windows failures (138) fixed in 936226e: the CLI tests spawned `URL.pathname` (`/D:/...`); the
  open-file test now asserts incomplete coverage where neither lsof nor /proc exists; fixtures are
  removed after the run. 7/7 pass three runs in a row, about 3.5 s.
- Bounded: six of seven tests pass an empty open-file set (`opts.open`), leaving one machine-wide
  scan; the pre-merge check `artifact-hygiene` runs with `--test-timeout=60000` under a 120 s
  runner timeout that kills the process tree.
- The macOS reproduction moved to 175.

## Resolution (2026-11-01)

done: Windows failures fixed and the suite bounded (936226e); macOS hang reproduction moved to 175 with the lsof hypothesis. check-repo --full on Windows: all groups pass, 202.6 s (artifact hygiene 8.7 s). 153 item 7 updated: the slow tkt publish was the old full-suite pre-push hook hanging here.

---
id: "217"
title: "artifact-hygiene check takes 240s vs 9s measured and times out the 120s gate"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "The slow test(s) are named with per-test timings captured on Windows"
  - "The check finishes inside its gates.json timeout on an idle Windows host, or the timeout and measured value are updated with recorded evidence"
tags: ["kind:bug", "stream:test-verification"]
---

# artifact-hygiene check takes 240s vs 9s measured and times out the 120s gate

## What to build

Intent source: the 2026-11-03 sync. In the gate, `artifact-hygiene` (`scripts/repository-artifact-hygiene.test.mjs scripts/inspect-footprint.test.mjs`) timed out at 133.9 s against its 120 s `timeout_s`; `gates.json` records it as measured 9 s on 2026-11-01. Run standalone, it passed 43/43 but took 240 s. So this is slowness, not a correctness failure, and it is 25x the recorded measurement.

Prior work: tickets 137 (slow gate groups), 138 (footprint test on Windows) and 151 (inspect-footprint test hangs). Capture per-test durations (`--test-reporter=spec`) on Windows, name the slow tests, and fix the cause (likely a footprint walk or a git/lsof-style subprocess per fixture). Otherwise re-measure on an idle host and update `measured` and `timeout_s` with the evidence.

## Acceptance criteria

- [ ] The slow test(s) are named with per-test timings captured on Windows
- [ ] The check finishes inside its gates.json timeout on an idle Windows host, or the timeout and measured value are updated with recorded evidence

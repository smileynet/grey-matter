---
id: "302"
title: "Explore diff-hunk carry-forward checks for multi-round critic reviews"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "At least 4 completed multi-round review records audited; later-round findings classified as re-flagged unchanged, dropped prior, or new on edited hunks."
  - "Existing code-review frozen-packet hash check and tkt filing evaluated against observed gaps."
  - "If adopted: bounded hunk-overlap check added and skill/doc gates pass."
  - "Resolution records adopt/adapt/reject with supporting counts."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---
## Finding

`code-review` binds each review to a frozen diff packet and files findings as `tkt` tickets, while multi-round critic loops (`skills/meta/retro/references/convergence.md`) re-review revised candidates.

Prior art: `SprocketLab/slop-code-bench` (`src/slop_code/metrics/rubric/carry_forward.py`, `is_span_unchanged`, commit `de70a479acce7b565d2d0c772f48d7c881c15510`, MIT — prior art, not authority) maps unified-diff hunk offsets across checkpoints to detect unchanged spans and prevent dropped or re-flagged findings.

Candidate change: evaluate whether multi-round critic reviews need a bounded hunk-overlap check to avoid wasting rounds on unchanged code or losing unresolved prior findings.

## Approach: explore and test, don't adopt

1. **Audit historical multi-round reviews.** Inspect at least 4 completed multi-round review logs from real repos (e.g. `tagalog-helper/.memory/reviews/`).
2. **Measure the gap.** Classify later-round findings as `re-flagged unchanged`, `dropped prior`, or `new on edited hunks`, and check whether `code-review`'s frozen-packet hash check + `tkt` tracking already close the gap.
3. **Decide.** Build a hunk-overlap check only if >=2 historical reviews show wasted rounds or dropped findings from missing diff-offset tracking; otherwise reject as speculative generality.

## Acceptance criteria

- [ ] At least 4 completed multi-round review records audited; later-round findings classified as re-flagged unchanged, dropped prior, or new on edited hunks.
- [ ] Existing `code-review` frozen-packet hash check and `tkt` filing evaluated against observed gaps.
- [ ] If adopted: bounded hunk-overlap check added and skill/doc gates pass.
- [ ] Resolution records adopt/adapt/reject with supporting counts.

Related: #221.

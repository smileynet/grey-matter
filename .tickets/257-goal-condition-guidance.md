---
id: "257"
title: "Guidance for writing /goal conditions that can end honestly"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "A reference covers stop rules as end states, mid-run ticket exclusions and the length limit"
tags: ["stream:orchestration", "kind:enhancement"]
---
## What to build

A short reference on writing Claude Code `/goal` conditions, linked from `docs/agents/harness-surfaces/claude-code.md` (today only a table row at line 352).

## Intent and context

Source: android-helper session retrospective, 2026-11-07 (plan finalized after two critic rounds). Filed from android-helper; no work done here.

In android-helper, a `/goal` delivering tickets 24-42 had stop-and-report rules (false premise, owner decision) that were not among its allowed end states. A ticket filed during the run (44), and one the owner later ruled out of scope, still counted against the literal done set. The Stop hook rejected roughly 20 consecutive stops (counted from the transcript) until the owner ran `/goal clear`. The first condition was refused by the harness ("Goal condition is limited to 4000 characters (got 6448)"); the condensed 2,875-character version lost nuance.

## Acceptance criteria

- [ ] Every stop-and-report rule in a goal is also an allowed end state
- [ ] Tickets filed, or ruled out of scope by the owner, during the run are excluded from the done set by definition
- [ ] The condition stays well under the 4,000-character limit and points to a committed contract file for detail
- [ ] claude-code.md links the reference from its /goal row
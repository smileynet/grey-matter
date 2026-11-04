---
id: "253"
title: "Review findings: published history and cleanup gate isolation"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Independently reproduce each finding and classify confirmed, rejected or obsolete before changing code."
  - "Published historical branch merges pass privacy checking while genuinely unpublished intermediate leaks and novel merge resolution leaks still fail."
  - "Cleanup ownership safety runs without installed tkt and cannot hang on its version probe; generation demonstrations remain on-demand."
tags: ["stream:test-verification"]
---
Scoped review of gate changes through11cbd1e; related closed tickets250 and252. Reviewer: Codex with independent subagent source review. Run: gate-review-20261104-gm11cbd1e-tktf0cf085. Confirmation status: unconfirmed independently. P2 Spec: scripts/gate.mjs136 uses remoteSHA..localSHA for existing refs; scripts/check-home-path.mjs66 rescans already-published commits from another remote branch. Disposable reproduction: clean origin/main, origin/published containing synthetic historical path, merge published into main; existing-ref audit fails on published history while new-ref exclusion passes. Keep path-selection scope exact, exclude already-published history only for privacy, and retain new/intermediate/novel-merge leak detection. P2 Spec: scripts/spike-orchestrate-test-fixtures.mjs10 runs installed tkt --version unbounded; scripts/spike-orchestrate-fixture.test.mjs22 skips both marked cleanup and unmarked refusal without tkt. Reproduction with Git but no tkt on PATH: exit0,2 pass,1 skip. Seed cleanup safety locally without tkt; reserve generation dependency for optional demonstrations. Fresh broad review fixtures56 pass,4 platform skips; passing suite does not cover these cases. No implementation changes made.
---
id: "253"
title: "Review findings: published history and cleanup gate isolation"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "Independently reproduce each finding and classify confirmed, rejected or obsolete before changing code."
  - "Published historical branch merges pass privacy checking while genuinely unpublished intermediate leaks and novel merge resolution leaks still fail."
  - "Cleanup ownership safety runs without installed tkt and cannot hang on its version probe; generation demonstrations remain on-demand."
tags: ["stream:test-verification"]
---
Scoped review of gate changes through11cbd1e; related closed tickets250 and252. Reviewer: Codex with independent subagent source review. Run: gate-review-20261104-gm11cbd1e-tktf0cf085. Confirmation status: unconfirmed independently. P2 Spec: scripts/gate.mjs136 uses remoteSHA..localSHA for existing refs; scripts/check-home-path.mjs66 rescans already-published commits from another remote branch. Disposable reproduction: clean origin/main, origin/published containing synthetic historical path, merge published into main; existing-ref audit fails on published history while new-ref exclusion passes. Keep path-selection scope exact, exclude already-published history only for privacy, and retain new/intermediate/novel-merge leak detection. P2 Spec: scripts/spike-orchestrate-test-fixtures.mjs10 runs installed tkt --version unbounded; scripts/spike-orchestrate-fixture.test.mjs22 skips both marked cleanup and unmarked refusal without tkt. Reproduction with Git but no tkt on PATH: exit0,2 pass,1 skip. Seed cleanup safety locally without tkt; reserve generation dependency for optional demonstrations. Fresh broad review fixtures56 pass,4 platform skips; passing suite does not cover these cases. No implementation changes made.

## Resolution (2026-11-04)

done: runner v5 separates pinned published-history privacy exclusions from exact ordinary path selection. Blocking cleanup safety seeds its own marked Git fixture; only optional demonstrations probe installed tkt with a five-second bound. Shared release product entry explicitly forces tkt release verification. Verified, committed, pushed and redeployed both packs. No full product release or cross-platform matrix claimed.

### Verification
1. ✓ Independently reproduce each finding and classify confirmed, rejected or obsolete before changing code. — "Confirmed both findings with red regression before edits: published merge falsely failed; missing-tkt cleanup case skipped. Tests now cover both corrected behaviors."
2. ✓ Published historical branch merges pass privacy checking while genuinely unpublished intermediate leaks and novel merge resolution leaks still fail. — "node --test scripts/check-home-path.test.mjs scripts/gate.test.mjs:42 pass,1 Windows-only skip. Published branches pass; introduced, intermediate and novel merge leaks still fail; selected-remote and tracking-ref snapshot coverage pass. Pre-merge4/4 groups and actual pre-push6/6 passed without gate skips."
3. ✓ Cleanup ownership safety runs without installed tkt and cannot hang on its version probe; generation demonstrations remain on-demand. — "Restricted-PATH safety suite3/3 pass, no tkt installed, no skips; optional demonstrations2/2 pass. Product/sandbox/demo focused rerun14/14. Docs, catalog, shared22-module consistency, dashboard and diff checks pass. Commit9234524 pushed and both-pack portfolio deployment completed with strict validation. Task helpers sent to Trash; existing dist188944KiB and unrelated proposal7414 bytes preserved."

---
id: "300"
title: "Add SCBench iterative-erosion and verbosity smells to code-review and concentration check to retro"
status: done
blocked_by: []
validation_criteria:
  - "rubric-app.md and rubric-game.md document SCBench iterative-erosion and verbosity smells with flag/skip indicators"
  - "retro SKILL.md includes cumulative complexity/LOC concentration check"
  - "node scripts/gate.mjs pre-merge and node scripts/deploy.mjs check --static pass"
tags: ["stream:skills-review", "kind:enhancement"]
---
## Intent source
Cross-repo adoption of prior art from SprocketLab/slop-code-bench (SCBench) into grey-matter review and retrospective skills.

## What to build
1. Add an `Iterative erosion and verbosity smells` section to `skills/engineering/code-review/references/rubric-app.md` (with Flag / Skip indicators) covering gaps not in Fowler or data-modeling: Silent Fallbacks & Error Destruction, Lenient Parsing & Silent Auto-Correction, Validation Theater, Sentinel Values & Boolean Success Flags, Narration Comments & Echo Docstrings, Redundant Boundary Guards, and Single-Entry Registry / Constant Factory.
2. Update `skills/engineering/code-review/references/rubric-game.md` so the iterative-erosion and verbosity smells still apply alongside non-OO Fowler smells.
3. Update `skills/engineering/retro/SKILL.md` step 3 to include a cumulative concentration / erosion check for multi-ticket file or complexity hotspots.

## Acceptance criteria
- [x] `skills/engineering/code-review/references/rubric-app.md` includes the 7 iterative-erosion & verbosity smells with concrete Flag and Skip guidance
- [x] `skills/engineering/code-review/references/rubric-game.md` explicitly preserves the iterative-erosion & verbosity smells on game diffs
- [x] `skills/engineering/retro/SKILL.md` adds a cumulative concentration / erosion check under step 3
- [x] `node scripts/gate.mjs pre-merge` and `node scripts/deploy.mjs check --static` pass and skills deploy cleanly

## Resolution (2026-11-25)

Added SCBench iterative-erosion and verbosity smells to code-review rubrics and cumulative concentration/erosion check to retro skill.

### Verification
1. ✓ rubric-app.md and rubric-game.md document SCBench iterative-erosion and verbosity smells with flag/skip indicators — "rubric-app.md and rubric-game.md include the 7 SCBench-inspired iterative-erosion and verbosity smells with Flag/Skip indicators (verified in diff)"
2. ✓ retro SKILL.md includes cumulative complexity/LOC concentration check — "skills/engineering/retro/SKILL.md includes cumulative concentration/erosion check under step 3"
3. ✓ node scripts/gate.mjs pre-merge and node scripts/deploy.mjs check --static pass — "node scripts/gate.mjs pre-merge (kimi-plugin-package 3.1s), node scripts/gate.mjs pre-push, and node scripts/deploy.mjs check --static all passed"

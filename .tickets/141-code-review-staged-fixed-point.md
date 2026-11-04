---
id: "141"
title: "code-review accepts staged or uncommitted work as its fixed point"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Skill documents a staged/working-tree target"
  - "Filing findings is safe with staged work"
tags: ["stream:skills-review","epic:outcome-orchestration"]
---

# code-review accepts staged or uncommitted work as its fixed point

## Origin

Field report from philippines-trip, 2026-11-01. The review target was staged, uncommitted work against HEAD; `code-review` assumes `git diff <fixed-point>...HEAD`, so the operator had to pass `git diff --cached` by hand in the arguments. Its "file findings as tickets" step then ran into 140 (tkt commits sweep staged work).

## Acceptance criteria

- [x] The skill documents reviewing staged and working-tree changes (`git diff --cached`, `git diff`) as well as commit ranges, and step 1 validates the chosen diff is nonempty.
- [x] Step 5 tells the reviewer how to file tickets without committing the staged work under review (until 140 is fixed).
- [x] One review of staged work runs end to end with the updated skill.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain staged/working-tree review-target ownership; #204 handles dispatch and candidate/evidence binding without claiming every review target must be a commit.

## Resolution (2026-11-04)

Added pinned staged and working-tree targets, nonempty validation, correct index/working content capture, untracked coverage and safe ticket filing. End-to-end actual staged review accepted in separate contexts; no actionable finding needed filing, and axes were sequential under capacity rather than a simultaneous-dispatch claim. Promoted case report and independent reviews under docs/agents/research. Parent frozen packet/scripts/raw reviews retained through queue settlement and evidence disposition; installed skill copies retained as intended deployment. No historical artifacts released.

### Verification
1. ✓ Skill documents a staged/working-tree target — "PASS: staged, working-tree, all tracked uncommitted and commit-range modes documented; actual staged patch519b419e7609d6dcf90210caf77307897ffa7a5428b894dab48b4c5e61a64e01 independently reviewed Standards and Spec, then recaptured unchanged. Syntax10 PASS, parent pre-merge syntax1 PASS and pre-push5 PASS."
2. ✓ Filing findings is safe with staged work — "PASS: safe filing requires verified ticket-only isolation or a clean separate board checkout. Installed isolation independently qualified in140; its real closure preserved this staged index/patch unchanged. Source f845007 pushed and 50 skills deployed with Agy/Crew skipped."

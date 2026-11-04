---
id: "141"
title: "code-review accepts staged or uncommitted work as its fixed point"
status: open
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

- [ ] The skill documents reviewing staged and working-tree changes (`git diff --cached`, `git diff`) as well as commit ranges, and step 1 validates the chosen diff is nonempty.
- [ ] Step 5 tells the reviewer how to file tickets without committing the staged work under review (until 140 is fixed).
- [ ] One review of staged work runs end to end with the updated skill.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain staged/working-tree review-target ownership; #204 handles dispatch and candidate/evidence binding without claiming every review target must be a commit.

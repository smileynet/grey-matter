---
id: "195"
title: "Keep slash-style CLI arguments out of missing-skill errors"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "The current AGENTS.md Git Bash argument example no longer produces a missing-skill error, without editing that example or hard-coding args as a builtin."
  - "Public checker fixtures distinguish CLI argument examples and ambiguous slash tokens from explicit missing skill references; valid references and existing detection stay covered."
  - "Applicable checker fixtures and repository gates pass; guidance audit results distinguish baseline worktree path limitations from checker regressions."
tags: ["stream:test-verification", "type:bug"]
---

# Keep slash-style CLI arguments out of missing-skill errors

## What to build

TBD

## Acceptance criteria

- [ ] TBD

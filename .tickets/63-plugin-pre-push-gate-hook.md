---
id: "63"
title: "Claude plugin hook: run check-repo.mjs before an agent's git push"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "a PreToolUse hook on Bash 'git push' in the grey-matter plugin runs scripts/check-repo.mjs only when that script exists in the project, and blocks the push on a nonzero exit"
  - "the hook is a Node script, passes claude plugin validate, and is a no-op in unrelated repos"
tags: ["stream:tooling"]
---

# Claude plugin hook: run check-repo.mjs before an agent's git push

## What to build

TBD

## Acceptance criteria

- [ ] TBD

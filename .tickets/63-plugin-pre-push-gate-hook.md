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

Proposal 07, phase 2. Add a `PreToolUse` hook on Bash commands that match `git push`. It runs
`node scripts/check-repo.mjs` and blocks the push, naming the failing invariant, when the check
exits nonzero. This covers the agent half of ticket 60's pre-push gate; the git hook still covers
humans. The plugin is installed for the user, so the hook runs in every repo. It must do nothing
unless `scripts/check-repo.mjs` exists in `$CLAUDE_PROJECT_DIR`. Write it in Node, not shell, for
Windows.

The SessionStart frontier nudge moved to tkt's plugin, because tkt owns the frontier.

## Acceptance criteria

- [ ] a PreToolUse hook on Bash 'git push' in the grey-matter plugin runs scripts/check-repo.mjs only when that script exists in the project, and blocks the push on a nonzero exit
- [ ] the hook is a Node script, passes claude plugin validate, and is a no-op in unrelated repos

---
id: "63"
title: "Claude plugin hook: run check-repo.mjs before an agent's git push"
status: done
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

- [x] a PreToolUse hook on Bash 'git push' in the grey-matter plugin runs scripts/check-repo.mjs only when that script exists in the project, and blocks the push on a nonzero exit
- [x] the hook is a Node script, passes claude plugin validate, and is a no-op in unrelated repos

## Resolution (2026-10-24)

done: Claude-only Node push gate, blocking diagnostics, launch-project guards and isolated host release packaging; Windows/Linux and native checks pass

### Verification
1. ✓ a PreToolUse hook on Bash 'git push' in the grey-matter plugin runs scripts/check-repo.mjs only when that script exists in the project, and blocks the push on a nonzero exit — "1: source 90482ee; four direct handler fixtures and exact platform run 40058361224 pass on Windows/Linux; actual Windows job 120766260402 logs checker success, exit-2 failure, unrelated no-op and crash/input blocking; project checker guarded by file existence and launch cwd"
2. ✓ the hook is a Node script, passes claude plugin validate, and is a no-op in unrelated repos — "2: Node exec-form config passes native Claude manifest/bundle validation; inline inventory reports one PreToolUse hook; all six native plugin bundle rows pass; 27 artifact fixtures ensure private Claude closure and no foreign hook declaration; corrected portfolio audit has zero findings/errors"

---
id: "209"
title: "Decommission the model-tier spike harnesses (168-171) and keep a retest recipe"
status: open
blocked_by: []
validation_criteria:
  - "No t168-t171 spike harness, test, fixture or gate remains in scripts/ or scripts/gates.json."
  - "Every research doc link to a removed file points at a pinned commit that still has it; the docs consistency check passes."
  - "A 'How to rerun' recipe names the commit, host, CLI versions, commands and authorization step for each spike."
  - "node scripts/gate.mjs pre-release passes on Linux with no Windows-only wrapper for these checks."
tags: ["type:chore", "stream:tooling"]
---

# Decommission the model-tier spike harnesses and keep a retest recipe

## Why

Tickets 168-171 are done and their findings are written up. Their harnesses still ship in
`scripts/`: experimental code with pinned Windows paths (`D:\...\codex.exe`, `USERPROFILE`,
`LOCALAPPDATA`) that no skill or script uses. On Linux and macOS the tests cannot even load, so
the four gates are wrapped by `scripts/windows-only.mjs` as a stopgap. Git history already keeps
the code; the repo should not carry it as product.

## What to remove

- `scripts/spike-model-tier-review-t168.mjs` and `.test.mjs`
- `scripts/spike-model-tier-research-t169.mjs`, `.test.mjs`, `scripts/grade-model-tier-research-t169.mjs`
- `scripts/spike-model-task-tier-t170.mjs`, `.test.mjs`, `scripts/t170-review-envelope.mjs`
- `scripts/spike-model-effort-t171.mjs`, `.test.mjs`, `scripts/bind-reviewer-evidence-t171.mjs`, `.test.mjs`, `scripts/reviewer-evidence-core-t171.mjs`
- `scripts/fixtures/model-review/`, `model-research/`, `model-tasks/`, `model-effort-t171/`
- Gates `model-review-fixtures`, `model-research-fixtures`, `model-text-fixtures`, `model-effort-fixtures` in `scripts/gates.json`
- `scripts/windows-only.mjs`, if nothing else uses it

Check first whether `model-eval-fixtures` (`scripts/spike-model-eval*`) is in the same state.

## What to keep, and how to retest

The research docs that cite these files (11 under `docs/agents/research/`, plus
`docs/orchestration.html`) keep their findings. Replace each link to a removed file with a
pinned link to the last commit that has it, and add one "How to rerun" section (in the
protocol docs, or one shared note they link to):

1. `git worktree add --detach <dir> <last commit with the harness>`
2. The host and CLI versions the spike ran on (Windows, the pinned CLI paths and versions).
3. The command per spike and the authorization step its protocol requires.
4. Where results and review envelopes go, and how they are graded.

## Owns

`scripts/` files listed above, `scripts/gates.json`, `scripts/fixtures/model-*`,
`docs/agents/research/*` link edits, `docs/orchestration.html` link edits, `CHANGELOG.md`.

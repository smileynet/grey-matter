---
id: "106"
title: "Release verify keeps numbered attempts instead of overwriting evidence"
status: open
blocked_by: []
priority: medium
tags: ["kind:enhancement"]
---

# Release verify keeps numbered attempts instead of overwriting evidence

## What to build

Intent: recommendation 7 (high confidence against overwriting records). Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main).

The tool is already safe: `scripts/release-verify.mjs` refuses an existing output folder
and a test proves it. The overwrite happened in operation: during the 2026-10-29 macOS run
the operator deleted the failed verify folders before rerunning, losing the record of the
PATH failure. Fix the instructions, not the code:

- the `release` skill and `docs/agents/release-preparation.md` give each verify or probe
  attempt its own numbered folder and keep failed attempts in the evidence archive;
- reconcile ticket 97 (scratch retention): delete earlier attempts only after the evidence
  that matters has been promoted, and never a failed attempt a recovery still needs.

## Acceptance criteria

- [ ] The release skill and preparation doc say to use a new numbered folder per attempt and keep failed ones
- [ ] Ticket 97's rule 3 is reconciled with this
- [ ] `node scripts/check-repo.mjs` passes

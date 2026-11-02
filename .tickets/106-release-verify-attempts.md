---
id: "106"
title: "Release verify keeps numbered attempts instead of overwriting evidence"
status: open
blocked_by: []
validation_criteria:
  - "The release skill and preparation doc say to use a new numbered folder per attempt and keep failed ones"
  - "Ticket 97's rule 3 is reconciled with this"
  - "`node scripts/gate.mjs pre-merge` passes"
priority: medium
tags: ["kind:enhancement","stream:test-verification"]
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
- [ ] `node scripts/gate.mjs pre-merge` passes

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: update release/preparation instructions and the maintained artifact-retention policy for
numbered attempts. The existing output-folder refusal is already implemented; reverify its
regression rather than build it again. #97 is terminal historical evidence: reconcile its policy in
the maintained reference, preserving the closed ticket.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

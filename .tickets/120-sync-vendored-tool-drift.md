---
id: "120"
title: "sync resolves vendored-tool drift and a diverged tkt checkout without guesswork"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "A fixture with a stale vendored `tools/deploy.mjs` is repaired by one documented command, and the deploy lint message names that command."
  - "`skills/meta/sync/SKILL.md` states what to do when the tkt checkout is behind or diverged: fetch, compare the vendored files with upstream, and stop for the owner's decision before dropping or rebasing a local commit."
  - "`node scripts/gate.mjs pre-merge` passes."
tags: ["type:enhancement","stream:test-verification"]
---
# sync resolves vendored-tool drift and a diverged tkt checkout without guesswork

## What to build

Intent source: the 2026-10-31 sync, where two things stalled a routine pull-and-deploy.

1. `node scripts/deploy.mjs` aborted with `portfolio tkt: vendored deployer drift at D:code	kt	oolsdeploy.mjs`. The message names no fix. `scripts/sync-release-tools.mjs` reported no drift because it does not cover `tools/deploy.mjs`; that file is vendored by a plain copy, mentioned only in `docs/agents/distribution-maintenance.md` (line 26). The sync skill's step 5 therefore leads an agent to a clean check and a failed deploy.
2. The tkt checkout had one local vendor-sync commit and was 69 commits behind `origin`. Upstream had already vendored the same change byte-for-byte, so the right move was to drop the local commit. The sync skill covers a non-fast-forward only for the grey-matter checkout, not the sibling.

Make both cases one documented, tool-assisted step. Either bring `tools/deploy.mjs` under `sync-release-tools` or have the deploy lint name the exact command, and make sync say what to do when the sibling checkout has diverged (compare with upstream first; if the vendored files are identical, the local commit is redundant and is the owner's call to drop).

## Context

Files: `scripts/deploy.mjs` (line ~733, the drift finding), `scripts/sync-release-tools.mjs`, `skills/meta/sync/SKILL.md` step 5, `docs/agents/distribution-maintenance.md`.

## Acceptance criteria

- [ ] A fixture with a stale vendored `tools/deploy.mjs` is repaired by one documented command, and the deploy lint message names that command.
- [ ] `skills/meta/sync/SKILL.md` states what to do when the tkt checkout is behind or diverged: fetch, compare the vendored files with upstream, and stop for the owner's decision before dropping or rebasing a local commit.
- [ ] `node scripts/gate.mjs pre-merge` passes.

## Out of scope

Changing which release modules are vendored.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: turn vendored deployer repair into one documented, tool-assisted step and qualify
behind/diverged fixtures. This gap recurred during #178: tkt was fast-forwarded and manually
synchronized in companion commit 3841188. That manual recovery is evidence of need, not completion
of this automation ticket. Compare upstream bytes before proposing any history change.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

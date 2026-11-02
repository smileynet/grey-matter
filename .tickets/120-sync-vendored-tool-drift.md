---
id: "120"
title: "sync resolves vendored-tool drift and a diverged tkt checkout without guesswork"
status: done
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

- [x] A fixture with a stale vendored `tools/deploy.mjs` is repaired by one documented command, and the deploy lint message names that command.
- [x] `skills/meta/sync/SKILL.md` states what to do when the tkt checkout is behind or diverged: fetch, compare the vendored files with upstream, and stop for the owner's decision before dropping or rebasing a local commit.
- [x] `node scripts/gate.mjs pre-merge` passes.

## Out of scope

Changing which release modules are vendored.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: turn vendored deployer repair into one documented, tool-assisted step and qualify
behind/diverged fixtures. This gap recurred during #178: tkt was fast-forwarded and manually
synchronized in companion commit 3841188. That manual recovery is evidence of need, not completion
of this automation ticket. Compare upstream bytes before proposing any history change.

That reconciliation preceded the implementation below.

## Delegated implementation 2026-11-02

Worker commits 9b5ef95 and 68bc02d implemented and qualified the guarded `--deployer`
repair path. Independent critic accepted Spec and Standards, including actual CLI repair,
foreign ownership refusal, a genuinely diverged fixture preserving HEAD and CRLF bytes,
and shared Git-environment isolation. Worker fixtures passed 13/13, including under
hostile parent Git configuration. Root integrated the source; full pre-merge passed all
19 selected commands. The release-module vendor inventory was unchanged.

The production command `node scripts/sync-release-tools.mjs --target D:/code/tkt --deployer --write`
repaired one deployer and recorded its ownership manifest. The subsequent absolute-path
read-only check passed with zero findings. Companion tkt tests passed 38 with one Windows
platform skip; commit 62c8226 was pushed. An intervening check invoked from the wrong cwd
failed to find the script; correcting the invocation passed. No history was discarded.
Canonical `node scripts/deploy.mjs check` and `node scripts/deploy.mjs` subsequently passed,
installing 50 grey-matter skills. Companion pack compatibility is tracked separately by #98.
Retain the owned worker checkout/dependency junction through final stream integration cleanup.

## Resolution (2026-11-02)

done: one-command guarded deployer repair shipped and exercised on companion tkt; reviewed, merged, pushed and grey-matter deployed. No history discarded. Companion pack compatibility remains #98; visual dashboard acceptance pending. Evidence promoted in ticket/source, retain t120-worker/dependency junction and shared test-verification artifacts through final stream cleanup.

### Verification
1. ✓ A fixture with a stale vendored `tools/deploy.mjs` is repaired by one documented command, and the deploy lint message names that command. — "Actual CLI fixture repair, divergence and foreign-owner guards13/13 pass including hostile parent Git config; production --deployer --write repaired tkt then read-only check zero findings; companion62c8226 pushed, tests38pass1platformskip."
2. ✓ `skills/meta/sync/SKILL.md` states what to do when the tkt checkout is behind or diverged: fetch, compare the vendored files with upstream, and stop for the owner's decision before dropping or rebasing a local commit. — "Sync guidance fetch/compare/stop before owner history decision reviewed by independent critic; genuine1ahead1behind fixture preserves HEAD and CRLF bytes, release vendor inventory unchanged."
3. ✓ `node scripts/gate.mjs pre-merge` passes. — "Root integrated full premerge19/19 commands passed; canonical deploy check/default passed50skills. See dated implementation evidence in ticket."

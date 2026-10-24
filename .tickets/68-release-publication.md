---
id: "68"
title: "Publish and resume coordinated GitHub and plugin releases safely"
status: in_progress
blocked_by: ["66"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "A fixture proves one GitHub publisher per repo; existing matching drafts/releases are resumed while a mismatched tag/SHA or duplicate publisher fails clearly."
  - "Publication verifies the remote release tag, uses --verify-tag, uploads the complete asset set before publishing an immutable draft, and verifies published asset hashes."
  - "The branch and release tag use an atomic push; unsupported atomic pushes stop with recovery instructions, and no code pushes every local tag or deletes/moves a published release tag."
  - "State-aware resume covers missing/draft/published GitHub states, interrupted asset upload, tkt crate publication and failed stable promotion without bumping again or replacing published bytes."
  - "Stable advances only to the tested published release SHA, remains unchanged on failed pre-publication verification, and is re-verified after promotion; pinned consumers retain immutable refs."
  - "The command reports per-channel status and URLs, distinguishes optional store submission from Git marketplace availability, and fixtures run without real publication."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Publish and resume coordinated GitHub and plugin releases safely

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

Publication and recovery expose only verified releases and never create competing GitHub publishers. Publish the prepared identity, stage assets in a draft, verify them, then promote stable. Keep tkt's generated dist workflow configured through its generator. Handle crates.io, GitHub and marketplace promotion as distinct observable steps; partial completion is possible and must be resumable. This ticket implements and tests publication capability only: use fixtures/fake services and do not execute real registry publication, GitHub release publication, tag pushes or stable promotion.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `skills/meta/release/references/release.sh`, `scripts/release-publish.mjs` and `scripts/release-publish.test.mjs`
- [tkt release workflow](https://github.com/smileynet/tkt/blob/main/.github/workflows/release.yml)
- [tkt release configuration](https://github.com/smileynet/tkt/blob/main/release.toml)
- plugin marketplaces and stable-channel install instructions

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [ ] A fixture proves one GitHub publisher per repo; existing matching drafts/releases are resumed while a mismatched tag/SHA or duplicate publisher fails clearly.
- [ ] Publication verifies the remote release tag, uses --verify-tag, uploads the complete asset set before publishing an immutable draft, and verifies published asset hashes.
- [ ] The branch and release tag use an atomic push; unsupported atomic pushes stop with recovery instructions, and no code pushes every local tag or deletes/moves a published release tag.
- [ ] State-aware resume covers missing/draft/published GitHub states, interrupted asset upload, tkt crate publication and failed stable promotion without bumping again or replacing published bytes.
- [ ] Stable advances only to the tested published release SHA, remains unchanged on failed pre-publication verification, and is re-verified after promotion; pinned consumers retain immutable refs.
- [ ] The command reports per-channel status and URLs, distinguishes optional store submission from Git marketplace availability, and fixtures run without real publication.

## Implementation dependency

Depends on completed contract 66 rather than final-candidate evidence 67: offline
implementation and fixture testing can proceed independently of final-candidate verification.
The final audit 70 still depends on both 67 and 68. This changes work ordering, not
the required candidate evidence or publication authorization.

## Current implementation checkpoint

Canonical release modules live in grey-matter `scripts/`; tkt vendors 16 owned
files through `scripts/sync-release-tools.mjs`. Library and CLI fixtures use
synthetic evidence, fake services and disposable Git remotes. No real release,
registry upload, tag push or stable promotion has run.

- `release-publication.mjs`: grey-matter-only publish/resume CLI, read-only by
  default; binds pinned staging review, clean dedicated candidate, GitHub remote,
  annotated tag object and exclusive external recovery state. Refuses a competing
  local tkt publisher before repository/API access.
- `release-staging.mjs` / `release-verify.mjs`: verify committed notes, exact
  artifact/report/log hashes and six completed gate receipts. Integrity relative
  to a review SHA does not itself prove human approval. Replacement refs cannot
  replace reviewed Git objects. See [staging evidence](../docs/agents/release-staging.md).
- `release-development.mjs`: construct M in an owned independent clone, preserve C
  and local main, check versions/tags, bootstrap isolated npm and run the full
  product gate at M. Reuse M on replay; reintegrate if remote main advances.
- `release-git.mjs`: atomic candidate/tag/main transaction, explicit refspecs,
  annotated-object validation, one push URL, no implicit tags or force. Reject
  unsupported servers/conflicting refs. A receive-time race on an already-matching
  ref can leave another ref created; observe and stop, never roll back tags.
- `release-publish.mjs` / `release-github.mjs`: authenticated paginated draft
  discovery; exact title/notes/assets, release ID and immutable policy; timeout
  readback without clobbering. `publish:false` stages a complete draft only.
  Stable promotion requires the complete immutable release and rechecks it afterward.
- `release-registry.mjs`: exact sparse-index identity/checksum/yanked checks,
  harmless matching-version replay and explicit retry after an uncertain attempt.
  The real upload adapter and durable attempt ledger are not implemented.
- tkt `tools/generate-release-workflow.mjs`: checked cargo-dist 0.32.0 wrapper
  retains generated platform builds, replaces mutating planning, removes host and
  announce jobs, and adds clean crate packaging plus exact-file sealing. Manual
  dispatch and each checkout bind to C; permissions are contents:read. Intermediate
  names/downloads are attempt-qualified and native platform shells are preserved.
  This is build-only staging, not the finished CI publisher.

## Evidence and current smoke runs

grey-matter's current runtime passes all 12 invariants and 194 release fixtures.
tkt `57c27af` passes 13 Node checks, 296 Rust tests, fmt and clippy after clearing
regenerable compiler caches following a disk-full failure. A portfolio refresh ran
once per completed unit; strict duplicate/provenance audit is clean.

[Platform run 40046645650](https://github.com/smileynet/grey-matter/actions/runs/40046645650)
passed Windows and Ubuntu full gates at `4953fc1` (192 release fixtures each), plus
Windows regressions. It predates draft-only staging and is not final-candidate proof.

[tkt staging run 40048479836](https://github.com/smileynet/tkt/actions/runs/40048479836)
at `23c4940` passed planning, clean crate packaging and four platform builds; Windows
failed at dist installation because the wrapper forced bash over PowerShell.
The targeted test failed before correction. Another regression caught unqualified
intermediate names before the attempt-isolation fix. A fresh corrected smoke run,
[40048951483](https://github.com/smileynet/tkt/actions/runs/40048951483), is at exact
SHA `57c27af008511646a02b3fb8ca62ececbca9b01d`; its planning/crate jobs passed and
platform jobs were active at the last observation. Poll that run; do not dispatch
again merely because observation times out. Neither run is a 0.5.0 candidate.

Tkt 212/213/214 are closed: scratch exclusion, packaged Git identity and root-anchored
crate inputs. See [identity remediation](../docs/agents/research/evidence/crate-remediation-20261023.json)
and [crate closure](../docs/agents/research/evidence/crate-runtime-closure-20261023.json).
The initial 0.2.0/0.5.0 drafts predate these changes and must be regenerated.

## Remaining work before closure

1. Complete and inspect a successful staging run, sealed bytes and artifact
   provenance. Verify run/attempt/jobs, artifact IDs/digests/expiry, exact inventory
   and safe extraction. Names or run IDs alone are insufficient. Live rerun
   behavior remains unverified; require a complete fresh attempt.
2. Implement the later review-bound CI publisher and local dispatch/observer.
   It must download reviewed staged bytes, never rebuild or reseal them. Preserve
   one GitHub publisher, exact annotated tag, development M and stable C.
3. Implement the durable registry-attempt barrier and prove the exact Cargo upload
   boundary with a harmless localhost probe. A dry-run comparison plus a checksum
   after upload does not by itself prove pre-upload byte equality. Require explicit
   recovery after unknown outcomes; Actions retention cannot serve as the ledger.
4. Integrate/fix/retest all publication states and per-channel reporting, then
   reconcile the acceptance criteria. Final candidate/upgrade/audit evidence still
   belongs to 67/69/70/71; version approval is recorded, scope dispositions remain.

Immutable releases were observed disabled in both repositories. Future publication
must refuse until separately authorized enablement; do not change settings now.

## Durable research

- [Publication/recovery contracts](../docs/agents/research/publisher-recovery-contract.md)
  and [preflight observations](../docs/agents/research/publication-preflight-observations.md)
- [Development reconciliation](../docs/agents/research/development-release-reconciliation.md)
  and [publication guide](../docs/agents/release-publication.md)
- [Dist hook ordering](../docs/agents/research/dist-publisher-hooks.md) and
  [reviewed CI staging ADR](../docs/agents/decisions/0002-reviewed-ci-staging.md)
- [CI staging/attempt evidence](../docs/agents/research/ci-staging-and-registry-intent.md),
  [registry recovery](../docs/agents/research/registry-recovery.md) and
  [Cargo transport follow-up](../docs/agents/research/cargo-sealed-transport.md)

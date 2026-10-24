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

Canonical release modules live in grey-matter `scripts/`; tkt vendors 22 owned
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
  The prepared upload adapter is implemented and native-tested (latest checkpoints below). `release-tkt-publication.mjs` now stages ordinary assets, creates a deterministic registry-intent receipt, reconciles Cargo/GitHub, then promotes stable. Initial attempt permission requires a successful receipt-creation response and matching asset-ID readback; an existing receipt with no registry observation requires explicit recovery. Fourteen mock-service fixtures cover interrupted phases. The receipt is mutable until GitHub publication and relies on serialized publishers and no out-of-band draft deletion.
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
SHA `57c27af008511646a02b3fb8ca62ececbca9b01d`; all nine jobs completed successfully. The downloaded ZIP matches its GitHub
digest; all 16 files, archive paths, crate VCS and ARM macOS binary identity were
checked. Local tkt packaging reproduces the CI crate hash. See [smoke evidence](../docs/agents/research/evidence/ci-stage-smoke-20261023.json).
Neither run is a 0.5.0 candidate.

Tkt 212/213/214 are closed: scratch exclusion, packaged Git identity and root-anchored
crate inputs. See [identity remediation](../docs/agents/research/evidence/crate-remediation-20261023.json)
and [crate closure](../docs/agents/research/evidence/crate-runtime-closure-20261023.json).
The initial 0.2.0/0.5.0 drafts predate these changes and must be regenerated.

## Remaining work before closure

1. Connect `readStagedTktCandidate` to the CI publication entry point. The staging
   reader now binds the CI identity file/digest at pinned review R, checks identity
   against the plugin candidate, reads verified CI bytes and joins both inventories.
   It retains original stage JSON bytes and refuses colliding asset names. Fixtures
   cover unreviewed/changed/missing identities and collisions. Its underlying eight
   reader fixtures and live read bind run/attempt/jobs, upload-log ID/digest, API
   metadata, ZIP digest, bounded decoding and exact inventory. Live rerun behavior
   remains unverified; require a complete fresh attempt.
2. Implement the later review-bound CI publisher and local dispatch/observer.
   It must download reviewed staged bytes, never rebuild or reseal them. Preserve
   one GitHub publisher, exact annotated tag, development M and stable C.
3. Connect the tested registry-intent barrier to the production Cargo upload
   boundary. Four localhost capture cases now verify clean-source reproducibility,
   replacement of corrupt output, default dirty-source refusal and changed bytes
   under --allow-dirty; they do not complete the production transport guard. A dry-run comparison plus a checksum
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

Source-write boundary research: [Cargo read-only boundary](../docs/agents/research/cargo-readonly-boundary.md)
documents bubblewrap mount semantics and the original hosted-probe plan. A read-only
bind constrains Cargo and descendants but cannot prevent a concurrent host writer
from mutating the backing checkout. Later execution of private data-backed mounts
is recorded below; the ordinary-bind limitation remains. Preserve this
limitation; either enforce exclusive trusted host ownership or verify stronger
immutable backing before claiming the production guard is complete.


## Cargo transport research checkpoint (2026-10-23)

New primary-source work resolves the previous exact-Cargo-source retrieval gap:
[Cargo 1.99.1 source contract](../docs/agents/research/cargo-publish-source-contract.md)
verifies the official source archive SHA and matching Cargo commit. Cargo's supported
credential-provider protocol exposes the freshly packaged archive checksum before
reading that same open file handle into the upload body. A provider must prohibit
cached operation-independent tokens, command-line tokens and fallback; a private
archive inode must prevent post-check writes. This is a promising enforcement seam,
not an implemented transport or permission to publish.

[Private source-mount research](../docs/agents/research/cargo-immutable-source-mount.md)
explains how sealed inputs, private data-backed mounts and frozen directories can
isolate changes to the original checkout. It explicitly does not claim inherited
memfd seals on copied backing files or protection against a hostile privileged host.
Independent source audits and Linux/mock execution remain required before adoption.


Independent audits now support both source arguments at 9/10 within their stated
scope: [Cargo checksum/provider audit](../docs/agents/research/cargo-publish-source-contract-audit.md)
and [private-mount audit](../docs/agents/research/cargo-immutable-source-mount-audit.md).
They independently re-fetched protocol/manual sources and verified the exact Cargo
archive against its official checksum. Runtime readiness is still unproved: build
the credential-provider mock and Linux source/output mutation controls next.


## Credential-provider implementation checkpoint (2026-10-23)

`release-cargo-credentials.mjs` now implements protocol-v1 authorization with exact
name/version/checksum/registry binding, fatal refusals, never-cache credentials and
no operation-independent read token. Six Node fixtures pass. The provider is a
self-contained owned vendor file in tkt; the inventory now contains 19 files.
The [seven-case real-Cargo probe](../docs/agents/research/cargo-credential-checksum-probe.md)
records one matching localhost PUT and five zero-PUT refusals. Its deliberate
CLI-token bypass control uploads mismatched bytes only to the refusing mock,
proving that override rejection remains mandatory in the production wrapper.

Real invocation exposed that Cargo puts configured extra arguments in request
JSON: `[node, script]` is not a valid executable prefix. The probe uses a small
native Rust launcher to prepend the fixed Node/script path before forwarding
Cargo's flags. The Linux/private-output transport and sole CI entry point are
still unimplemented; this component does not close ticket 68 or authorize publishing.

## Linux boundary checkpoint (2026-10-23)

The [private-mount execution probe](../docs/agents/research/cargo-private-mount-probe.md)
now passes as the ordinary Ubuntu runner user at `45f11d0`, run 40062286350.
Both the filesystem control and real Cargo/provider capture pass. After successful
private preflight, host mutations change the original source, Git HEAD and old
archive while the mounted source/Git inventory and private output remain intact.
The single dummy-auth localhost PUT exactly matches the independently sealed
872-byte fixture crate. Six child source writes fail with EROFS; an ordinary bind
reflects host changes as the negative control. The first root invocation's
toolchain-permission failure and correction are retained in the report/evidence.

This resolves the fixture-level runtime uncertainty without another broad source
review. Implement the prepared adapter next, then test actual tkt dependencies,
delayed token availability and the registry-intent lifecycle through that adapter.
Review the integrated path before regenerating final release candidates, following
the plan's review order. This is not production readiness or final-candidate proof.

## Prepared adapter checkpoint (2026-10-23)

The [prepared transport report](../docs/agents/research/cargo-prepared-transport-probe.md)
and its committed JSON supersede the earlier unimplemented-adapter checkpoint.
Grey `4162afa` and tkt `ba8f23b` contain the adapter and its corrections; the owned
release-tool inventory is now 21 files. Hosted run 40065935400 passes all six cases,
including actual tkt 0.4.0 source, delayed credential/intent ordering, cancellation,
wrong-seal refusal and replay without duplicate upload. All external publication
services remain mocked; this is not final-candidate or production-publication proof.

Next: finish the review-bound sole CI publisher and local dispatch/observer; verify
runner-loss and integrated failure/recovery behavior, then request one independent
review of the complete path before regenerating 67's candidates. Keep 69 → 70 → 71
as the subsequent verification/audit/staging order. Do not reopen completed source
research without a concrete new uncertainty. No publication is authorized.

## Reviewed CI entry library checkpoint (2026-10-23)

`release-tkt-ci.mjs` now connects `readStagedTktCandidate`, exact reviewed tag-object
import, CI run/repository/workflow binding, development M, scoped atomic refs and
the prepared Cargo adapter through the intent/registry/GitHub/stable coordinator.
A committed optional `publication` descriptor is mandatory for this entry; it binds
workflow SHA/ID, candidate branch and raw annotated tag bytes to review R. Library
default mode is read-only. The canonical module is vendored into tkt (22 owned files).

Focused integration fixtures cover delayed credential ordering, replay, stable
failure recovery, dry-run preservation, wrong tag/dispatch, disabled immutability,
failed ref observation and dispatch revalidation after development work. This
checkpoint does not claim production workflow/dispatch wiring or close ticket 68.
Next implement the reviewed input transfer and sole publication workflow plus its
local dispatch/observer; prove runner-loss cleanup, then review the integrated path.

## Sole workflow and dispatcher checkpoint (2026-10-23)

Tkt now has a separate manual `publish.yml`, `tools/publish-reviewed.mjs` and
`tools/dispatch-publication.mjs`. The generated dist workflow remains build-only.
The sole publisher checks separate exact C/R checkouts, uses pinned Cargo 1.99.1,
serializes all versions without cancellation, and defaults to planning. The local
client verifies the candidate branch/workflow, persists intent before dispatch,
correlates unknown responses and observes/replays without a second POST. The
review carrier layout and the current GitHub dispatch response contract are in
the staging guide; final 71 must commit the exact carrier on review branch R.

Nine focused publisher/dispatch fixtures pass with fake services, including a
response lost after dispatch and a request temporarily absent from run listings.
No production workflow dispatch, registry upload, tag or stable promotion ran.
Remaining 68 work: runner-loss cleanup proof, one integrated independent review,
fixes/retesting and requirement-by-requirement closure evidence. The final candidate
and installation/audit/staging tickets stay open; do not reuse old drafts.

## Parent-loss verification checkpoint (2026-10-23)

The [parent-loss report](../docs/agents/research/cargo-parent-loss-probe.md) and
committed JSON retain three failed controls and successful run 40070114004 at
grey309a739/tkt93f83c5. Removing host staging inputs before prepared/intent now
passes both parent-kill cases: four/five descendants stop, host inputs are already
gone, before-intent has zero callback/PUT, and a held-upload case has one exact
localhost capture with an explicitly unconfirmed outcome. All six prepared
transport regressions also pass. No production publication was exercised.

The runtime phase gate is now satisfied within the report's stated scope. Next:
one independent integrated Standards/Spec review, reproduce and resolve findings,
then reconcile all six acceptance criteria with fresh evidence before closing68.
Do not regenerate final candidates until those blockers are resolved.

## Integrated review findings (2026-10-23)

Standards and Spec review run `8f1352a4-ad00-4a18-80de-621b54d8afd5`
examined grey `d61b772` and tkt `93f83c5`. Four findings remain within this
ticket's existing publication/recovery scope; none is deferred:

1. **Standards S1, P1 — credential inheritance.** A fresh local fixture failed
   because a product subprocess inherited dummy publication credentials. Product
   and npm bootstrap children now share an allowlist of host/toolchain environment
   variables, excluding both known tokens and arbitrary publisher variables.
   The parent retains credentials for the delayed upload callback. Product and
   development fixtures pass (24 tests). This establishes environment isolation,
   not protection against hostile same-user process inspection or credential files;
   the broader trusted-runtime boundary still needs the affected-path review.
2. **Standards S2, P1 — publisher prerequisites.** Source inspection identifies
   missing mise, cargo-dist 0.32.0 and Rust components required by the actual tkt
   product gate. Provision them, handle trust for the owned development clone,
   and prove the real gate in a nonpublishing hosted integration probe.
3. **Spec P1, P2 — stable-only recovery.** Re-entry currently prepares development
   and candidate refs before observing already published registry/GitHub state.
   Confirm with a failing regression, then make verified completed publication
   resume stable promotion without repeating development integration or ref pushes.
4. **Spec P2, P2 — partial failure reports.** CLI error output loses channel states
   and URLs when stable fails after registry/GitHub publication. Preserve safe,
   structured observations and candidate/review identity on failure; test the CLI
   result rather than relying only on coordinator success fixtures.

Coverage correction: the Standards reviewer originally named a nonexistent CI test
file in its test command. That result does not establish fresh CI-entry coverage;
the report was corrected. The next affected-path review must include the actual
CI cases in `scripts/release-verify.test.mjs` and the new regressions. Complete
these fixes before that review, then reconcile all six acceptance criteria.

## Review remediation checkpoint (2026-10-23)

Credential environment isolation is committed at grey `445a32d` / tkt `86e8dbf`.
All 12 grey repository invariants pass. One portfolio refresh and strict audit
pass (19 plugins, 4 packs, zero findings/errors).

Tkt `862e57f` adds one shared publication-toolchain action and a separate read-only
product probe. The action supplies Node 22, Rust/Cargo 1.99.1 with rustfmt/clippy,
mise 2026.10.18, cargo-dist 0.32.0 and bubblewrap. Both callers use it; the probe
executes actual `prepareDevelopment` and `mise run check`, without publication
credentials or Git ref mutations. [Hosted run 40071721321](https://github.com/smileynet/tkt/actions/runs/40071721321)
passes on exact source `862e57fb8227335440e73cb2dfddaeff3c2341da`: 30 Node tests,
296 Rust tests, formatting, clippy with denied warnings, and real dist generation.
The downloaded product report and log digests were independently checked against
their receipts. [Committed evidence](../docs/agents/research/evidence/publication-product-20261024.json)
retains the reports, source hashes, observed checks and hosted artifact identity.
This is source 0.4.0 product-gate evidence, not final-candidate or publication proof.

The exact owned clone is the sole `MISE_TRUSTED_CONFIG_PATHS` entry for the gate;
the shared setup neither loads project env nor persists its GitHub token.
Primary references read: [mise trust](https://mise.jdx.dev/cli/trust.html),
[trusted config paths](https://mise.jdx.dev/configuration/settings.html#trusted-config-paths),
and [mise-action inputs](https://github.com/jdx/mise-action/blob/v5/action.yml).
Current mise can automatically trust configs for commands that run project code;
the explicit path avoids relying on trust inherited from the original checkout.

Both stable-only recovery regressions first failed on a seeded later-main conflict.
The entry points now observe and validate complete immutable publication before
skipping development integration/candidate ref pushes. Recovery still validates
exact tag, notes and asset hashes; tkt also requires matching registry publication.
Controls refuse removed remote assets and an absent registry observation without
repeating development or Cargo. Partial-failure reporting remains unfinished;
perform the affected-path independent re-review after it is fixed.

## Partial-outcome reporting checkpoint (2026-10-23)

The stable-failure reporting regression first failed because the thrown error had
no publication identity or observations. Both publishers now attach a structured
report to failures; their CLI handlers use the shared `publicationFailure`
formatter. Reports retain C/R, product/version, last observed GitHub and registry
phases, URLs and timestamps. Stable is `not-attempted`, `unconfirmed` after entering
promotion, or `verified` only after the adapter confirms success. Grey persists
that stable observation in its existing owned recovery state too.

Fixtures serialize the exact shared CLI formatter after seeded stable failures,
assert complete published channels and uncertain stable, and reject serialization
of asset bytes and nested credential-bearing causes. These exercise the libraries
and shared output formatter, not a real publishing CLI invocation or production
services. Complete the affected-path Standards/Spec re-review, including S1's
trusted-runtime boundary, then reconcile acceptance evidence before closing 68.

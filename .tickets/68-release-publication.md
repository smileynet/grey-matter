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
implementation and fixture testing can proceed while version approval is pending.
The final audit 70 still depends on both 67 and 68. This changes work ordering, not
the required candidate evidence or publication authorization.

## Reconciliation library progress

`scripts/release-publish.mjs` is shared with tkt through its owned vendor inventory.
Eighteen fake-service fixtures exercise default read-only inspection, publisher
assignment, local asset hash checks, candidate gate identity, partial drafts/uploads,
recovery after timeouts, changed/missing release IDs, immutable releases and
replay without repeated writes. Digest-less, incomplete, mismatched, duplicate or unexpected assets
stop recovery without clobbering. The gate record checks product/version/commit and
pending work; its authenticity must still be established by the staging integration.

The [recovery research](../docs/agents/research/publisher-recovery-contract.md) retains
primary URLs, current tkt workflow evidence, API warnings and remaining gaps. No live
adapter, publication CLI, atomic branch/tag push, crate recovery or stable promotion is
implemented by this library. Ticket 68 remains open until those components are
implemented and verified. No real publication ran.

## Verification checkpoint

grey-matter `7dbb7a1` passes all 12 local invariants and 121 release tests. tkt
`5617825` passes five Node fixtures, 296 Rust tests, fmt/clippy and
[hosted CI](https://github.com/smileynet/tkt/actions/runs/40039176668) on Node 22.
All six source-version bundles contain the same publisher module hash
`784fad3d9d7f9635da32c013eca7021287e0e44aa54c9dd98e60e9b1b3b018e8`.
These are 0.1.0/0.4.0 smoke bundles, not approved 0.2.0/0.5.0 candidates.
One portfolio deployment refreshed each pack once; strict audit: 19 plugins/four
packs, zero findings/errors.
[Platform run 40039247245](https://github.com/smileynet/grey-matter/actions/runs/40039247245)
completed successfully at the same grey-matter revision: Windows Server 2025
(Node 22.23.4) and Ubuntu (Node 22.23.3) each passed the complete repository gate,
121 release tests and five hook tests with zero skips. The separate Windows
regression job passed 49 fixtures. These fixture runs do not establish live
publication or candidate install/upgrade readiness.

[Publication preflight observations](../docs/agents/research/publication-preflight-observations.md)
retain the next adapter contracts and disposable Git transcript. Actual setting GETs
found immutable releases disabled in both repositories. Future publication must
block until enabled under separate authorization; no settings were changed. Git
probes establish transaction behavior, not annotated-tag or full release-order coverage.

`release-git.mjs` now exposes an offline-testable candidate ref adapter: pinned commit/annotated-tag objects, one push destination, explicit refspecs, atomic push and observed-state replay. Five disposable-remote fixtures cover dry-run, replay, implicit-tag suppression, unsupported atomic servers, conflicting tags, multiple URLs, stable refusal and divergence. Local gate: all 12 invariants and 126 release tests pass; tkt check passes five Node and 296 Rust tests plus fmt/clippy. Stable promotion, ambiguous transport/concurrency fixtures, authenticated GitHub integration and publication CLI remain unfinished; no real release refs were pushed.

The Git adapter also validates the annotated tag's embedded name/type/object. Nine disposable-remote cases now include mirror configuration and receive-time branch races. Git omits an already-matching branch from its transaction: a concurrent move can therefore leave the exact tag created while post-push inspection stops the workflow; never roll that tag back or treat the failed inspection as publication permission. When both refs require updates, the competing branch update rejects the entire candidate transaction. Ambiguous transport outcomes and live adapter integration remain unverified.

`release-github.mjs` adds a read-only-by-default GitHub.com adapter. Four injected-command fixtures verify authenticated paginated draft discovery, malformed/error responses, annotated-tag identity, write opt-in, `--verify-tag`, exact binary upload input and typed publication JSON. Live read-only calls returned zero grey-matter/five tkt releases and immutable releases disabled in both repos; no mutation ran. The adapter is vendored into tkt and included in both runtime closures. Publication CLI, evidence binding, CI/crate/stable integration and ambiguous transport coverage remain unfinished.

`readCandidateEvidence` now verifies an externally supplied SHA-256 anchor for `verification.json`, artifact metadata, both report hashes and identities, executed product log, and native rows for every sealed artifact. It rejects altered reports/logs, cleared pending gates, missing/duplicate native rows, failed commands and path/symlink escapes. This proves integrity relative to the supplied anchor, not provenance or human approval; staging must bind that anchor through its reviewed index. All six later audit/staging gates remain pending and `publishable` stays false.

Stable recovery now has a library path: inspect the complete immutable GitHub release, fast-forward/create only `refs/heads/stable`, then recheck the same release ID and asset identity. Five disposable-remote cases cover dry-run/creation/replay, failed publication gates, fast-forward/divergence, rejected-push retry and changed release IDs after promotion. Failures do not roll back refs or repeat publication. The CLI/staging integration must still bind remote repository identity and approved evidence; these fixtures use fake GitHub observations and no real stable branch was changed.

`release-staging.mjs` now derives publication inputs from a pinned review commit: committed gate receipts/notes, exact candidate identity, sealed artifact metadata and verified report/log hashes. It returns all five plugin-release assets only after the selected product's six receipts pass. Synthetic committed-repository fixtures prove mutable working files cannot replace reviewed notes and blocked/missing/mismatched gates fail. This reader establishes integrity relative to the chosen commit, not human approval; publication CLI, remote binding and tkt dist/crate integration remain unfinished. The format is documented in [pinned staging evidence](../docs/agents/release-staging.md).

[Platform run 40041198520](https://github.com/smileynet/grey-matter/actions/runs/40041198520) passed at `d0340d4`: Windows Node 22.23.4 and Ubuntu Node 22.23.3 each passed all 12 invariants and 143 release fixtures, including stable/receive-hook cases. It predates the later stdin-import/evidence-field fixes and staging reader; it is not final-candidate platform evidence.

A seeded replacement-ref fixture initially replaced the reviewed notes despite the pinned SHA. Release Git operations now set `GIT_NO_REPLACE_OBJECTS=1`; the same fixture reads the original commit, and the combined 31 staging/Git fixtures pass. This preserves exact object identity without deleting a user's replacement refs.

`release-publication.mjs` now connects grey-matter's reviewed staging commit, clean dedicated candidate, exact annotated tag, bound GitHub remote, atomic refs, immutable release reconciliation and stable promotion. Default planning is read-only, including a real CLI fixture from an unrelated cwd. Execution requires explicit opt-in; fixtures inject fake GitHub/ref services and use synthetic staging receipts. Recovery saves observed release IDs under an exclusive state-path lock, rechecks inputs between phases and refuses conflicting IDs or foreign state. Disabled immutability blocks ref pushes. The [publication guide](../docs/agents/release-publication.md) records inputs, recovery, lock limits and separate authorization. tkt local publication is refused before repository/API access; CI/dist assets, crate recovery and final candidate evidence remain unfinished. No real publication ran.

Remaining source-bookkeeping finding: publication currently pushes the dedicated candidate branch/tag and stable, while development main retains its old manifest version. `deploy.mjs` lines 431–440 rejects a manifest behind any local vX.Y.Z tag, so creating the candidate's annotated tag in the shared repository can already make main fail its manifest gate. Complete and fixture-test the development-branch reconciliation policy before closing 68 or exposing this path as the finished release workflow; preserve the reviewed candidate SHA and staging-only authorization. This remains unimplemented alongside tkt CI/crate integration.

The shared registry library now observes the documented tkt sparse index and reconciles exact sealed crate hashes. Six fixtures prove dry-run, immutable-version replay, malformed/error refusal, timeout-after-upload recovery and an explicit retry requirement after an unconfirmed attempt. Live reads found unyanked 0.4.0 and missing 0.5.0; no upload adapter is enabled. [Registry research](../docs/agents/research/registry-recovery.md) records Cargo source links, cache/publish warnings and required durable CI-ledger integration. A real initial-candidate package built successfully but failed content/provenance inspection, producing tkt blockers 212 and 213; both must be resolved before final packaging/audit.

Remediation verified (2026-10-23): tkt 212 and 213 are fixed and closed. Source commits `a924678` (scratch exclusion) and `b849d43` (packaged/checkout build identity) pass the full tkt gate. A fresh crate rebuilt beneath grey-matter reports its own `b849d43` hash, excludes scratch and retains matching clean archive VCS metadata. Durable evidence: `docs/agents/research/evidence/crate-remediation-20261023.json`. These source-smoke results do not validate the old approved-version drafts: regenerate 0.2.0/0.5.0 after the remaining source changes, then run the final candidate gates.

Development-ref transport now accepts a verified integration commit containing the unchanged candidate and includes `main` in the same atomic branch/tag push. Three disposable fixtures prove merge ancestry, dry-run/replay, unsupported-server refusal and changed-main refusal. Merge construction, version/full-gate evidence and CLI integration remain unfinished. The [development research](../docs/agents/research/development-release-reconciliation.md) records the design and local-tag caveat. [Pinned cargo-dist research](../docs/agents/research/dist-publisher-hooks.md) proves 0.32 hooks cannot replace its publisher: `create-release=false` still undrafts. Implement a deterministic generator wrapper around the supported dist build pipeline rather than additive publication hooks or hand-maintained generated edits.

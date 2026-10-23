---
id: "68"
title: "Publish and resume coordinated GitHub and plugin releases safely"
status: open
blocked_by: ["67"]
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
- `skills/meta/release/references/release.sh` and `release.test.sh`
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

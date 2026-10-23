---
id: "66"
title: "Define coordinated release skills and guidance"
status: done
blocked_by: ["65"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "A committed release contract maps one version authority per repo to every manifest, crate/binary where applicable, Git tag, GitHub release and generated artifact; the deploy engine internal version is distinguished."
  - "The contract specifies pre-1.0 and post-1.0 bumps, including behavior-changing skill/guidance edits and skills-only tkt releases, and records any decisions requiring user confirmation."
  - "Release skills describe dry-run, prepare, publish, resume and verify boundaries; grey-matter local tooling and tkt CI are the sole GitHub publishers for their respective repos."
  - "Guidance defines local development versus stable/pinned consumers, separates Git marketplace releases from optional public-directory submission, and never promises undocumented Codex cache semantics."
  - "Release/sync/AGENTS/router references route local refresh through one canonical deploy call with duplicate prevention; no instruction runs legacy wrappers as extra deployments."
  - "Document links, invocation sidecars and skill indexes pass check-repo; an independent prose review is resolved and evidence is recorded."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Define coordinated release skills and guidance

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

A fresh agent has one release workflow and a clear boundary between planning, preparing, publishing, and local deployment. Turn the working proposal into reviewed release skills/guidance shared by both repos while retaining product-specific mechanics. Record unresolved policy choices before coding them: pre-1.0 bumps, stable branch naming/promotion, exact-version pinning, candidate version approval, plugin compatibility, and immutable recovery. Update existing release/sync/router guidance rather than creating parallel procedures.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `skills/meta/release/SKILL.md` and `references/versioning.md`
- `skills/meta/sync/SKILL.md`, `skills/meta/compass/SKILL.md`, and `AGENTS.md`
- `docs/agents/harnesses.md` and release conventions
- [tkt release guidance](https://github.com/smileynet/tkt/blob/main/AGENTS.md)

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [x] A committed release contract maps one version authority per repo to every manifest, crate/binary where applicable, Git tag, GitHub release and generated artifact; the deploy engine internal version is distinguished.
- [x] The contract specifies pre-1.0 and post-1.0 bumps, including behavior-changing skill/guidance edits and skills-only tkt releases, and records any decisions requiring user confirmation.
- [x] Release skills describe dry-run, prepare, publish, resume and verify boundaries; grey-matter local tooling and tkt CI are the sole GitHub publishers for their respective repos.
- [x] Guidance defines local development versus stable/pinned consumers, separates Git marketplace releases from optional public-directory submission, and never promises undocumented Codex cache semantics.
- [x] Release/sync/AGENTS/router references route local refresh through one canonical deploy call with duplicate prevention; no instruction runs legacy wrappers as extra deployments.
- [x] Document links, invocation sidecars and skill indexes pass check-repo; an independent prose review is resolved and evidence is recorded.

## Implemented guidance

The [release contract](../docs/agents/release-contract.md) is the implementation
source of truth; [ADR-0001](../docs/agents/decisions/0001-release-identity.md) records
rationale and rejected alternatives. Release/versioning/sync/router guidance routes
to that contract, separates read-only dry-run from prepare/stage and authorized
publication, and explicitly identifies legacy script gaps for tickets 67–69.
tkt's `docs/releasing.md` and AGENTS point to the same authority and canonical deploy.
Candidate 0.2.0/0.5.0 approval remains pending; no version has been changed here.

## Resolution (2026-10-23)

Defined coordinated release identity, version policy, local/stable/pinned channels, publisher ownership and mode/recovery boundaries; updated release/sync/router/AGENTS guidance in both repos and recorded ADR. Candidate version approval remains explicitly pending; legacy publication paths are blocked pending 67-69 mechanics.

### Verification
1. ✓ A committed release contract maps one version authority per repo to every manifest, crate/binary where applicable, Git tag, GitHub release and generated artifact; the deploy engine internal version is distinguished. — "grey 52ff4b2 docs/agents/release-contract.md maps grey pack-manifest and tkt Cargo authorities to all manifests, lock/binaries/crate, tags/releases/bundles and distinguishes engine vendor version."
2. ✓ The contract specifies pre-1.0 and post-1.0 bumps, including behavior-changing skill/guidance edits and skills-only tkt releases, and records any decisions requiring user confirmation. — "Versioning reference and contract cover pre-1.0 patch/minor, post-1.0 SemVer, behavior-changing skills/guidance and skills-only tkt releases. 0.2.0/0.5.0 proposed; user approval requested and explicitly pending, no bump performed."
3. ✓ Release skills describe dry-run, prepare, publish, resume and verify boundaries; grey-matter local tooling and tkt CI are the sole GitHub publishers for their respective repos. — "Release skill and contract define read-only dry-run, local prepare/stage, isolated verify, authorized publish and same-identity resume; grey local and tkt dist CI are sole GitHub publishers. Existing script gaps explicitly remain 67-69."
4. ✓ Guidance defines local development versus stable/pinned consumers, separates Git marketplace releases from optional public-directory submission, and never promises undocumented Codex cache semantics. — "Contract distinguishes developer checkout, release-only stable, immutable pins and optional public-directory submission; Codex same-version/cache cadence is explicitly unverified, never inherited from Claude."
5. ✓ Release/sync/AGENTS/router references route local refresh through one canonical deploy call with duplicate prevention; no instruction runs legacy wrappers as extra deployments. — "grey release/sync/compass/AGENTS and tkt f2445dc AGENTS/docs/releasing.md point to canonical authority and one Node deployment. One portfolio deploy refreshed each active pack once; strict live audit passes."
6. ✓ Document links, invocation sidecars and skill indexes pass check-repo; an independent prose review is resolved and evidence is recorded. — "All 10 check-repo invariants pass; 44 skills/20 invocation sidecars and relative links consistent; generated AGY strict validation passes; tkt deploy check passes; git diff --check clean. Independent prose review findings repaired and re-review clear."

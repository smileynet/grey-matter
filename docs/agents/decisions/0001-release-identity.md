# ADR-0001: One release identity and publisher per product

**Status:** accepted for implementation; candidate versions await user approval
**Date:** 2026-10-23
**Deciders:** maintainer requested the coordinated plan; agent selected implementation defaults

## Context

Both repositories ship several plugin formats; tkt also ships a crate and binaries.
Independent version fields drift, main-backed marketplaces can expose unreleased
source to new installs, and two GitHub publishers race over one release. Recovery
must preserve a tested identity across non-atomic GitHub/registry operations.

## Decision

Use one product version/commit per repo and one GitHub publisher: local tooling for
grey-matter, generated dist CI for tkt. Separate local preparation from authorized
publication; stable follows published tested commits and explicit pins remain fixed.
The [release contract](../release-contract.md) is the implementation source of truth.

## Consequences

Version and artifact checks become mechanical; recovery completes missing steps
without a second bump. Consumers get a stable delivery path independently of main.
Skills-only tkt releases rebuild unchanged binaries. Each repo maintains one extra
branch, and tkt must observe partial completion across crates.io, GitHub and stable.
Local grey-matter publication depends on the maintainer environment. Candidate
platform and install checks remain necessary; neither tags nor schemas prove them.

## Alternatives considered

- Independent plugin versions: avoid CLI rebuilds but add a second compatibility and
  release train; rejected for current scale.
- Main as stable: less channel maintenance but exposes development to new installs
  despite unchanged version fields; rejected.
- Local tkt GitHub creation plus dist: easy reuse but competing publishers; rejected.
- Pin every consumer permanently to tags: reproducible but no continuing stable
  update path; retained as an advanced option alongside stable.

## Evidence

[GitHub mechanics and non-atomic creation warnings](../research/github-release-strategy.md),
[plugin source/cache distinctions](../research/plugin-release-semantics.md), and
[six-format conformance](../research/plugin-conformance.md). The deploy engine's
internal version continues to identify vendor drift, not a separate product.

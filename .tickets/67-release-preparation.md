---
id: "67"
title: "Prepare version-consistent release candidates and plugin bundles"
status: in_progress
blocked_by: ["66", "74"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "Fixtures prove prepare --dry-run changes neither repository nor user state and creates no remote tag, GitHub release, registry publication or stable update."
  - "Candidate preparation derives every version surface from its repo authority, updates the tagged crate lock version where applicable, and fails when any manifest/version differs."
  - "Each prepared bundle is closed over runtime references and executable resources; extraction into a clean directory validates paths without the source checkout."
  - "Bundles exclude .git, tickets, scratch, local credentials, target/node_modules and unrelated development output; checksums and machine-readable release metadata record the candidate SHA, versions, asset names, skill counts and tested compatibility."
  - "Fixtures reject stale assets, missing files, wrong versions and unexpected archive entries; successful preparation can be repeated or resumed without another bump."
  - "grey-matter check-repo, tkt mise run check, native package validation and release fixtures pass on the resulting candidate tree; platform coverage is explicit."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Prepare version-consistent release candidates and plugin bundles

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

Given approved candidate versions, preparation produces reproducible, internally consistent release trees and complete plugin bundles without publishing anything. Implement the common contract through the existing product-specific tools. Source every file from the candidate revision, keep generated packages out of source, and include all runtime references/scripts. Do not publish tags, GitHub releases, registries or stable channels during preparation.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `skills/meta/release/references/release.sh` and `release.test.sh`
- `scripts/deploy.mjs` and plugin manifests
- [tkt release.toml](https://github.com/smileynet/tkt/blob/main/release.toml)
- [tkt tools/release.sh](https://github.com/smileynet/tkt/blob/main/tools/release.sh)

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [ ] Fixtures prove prepare --dry-run changes neither repository nor user state and creates no remote tag, GitHub release, registry publication or stable update.
- [ ] Candidate preparation derives every version surface from its repo authority, updates the tagged crate lock version where applicable, and fails when any manifest/version differs.
- [ ] Each prepared bundle is closed over runtime references and executable resources; extraction into a clean directory validates paths without the source checkout.
- [ ] Bundles exclude .git, tickets, scratch, local credentials, target/node_modules and unrelated development output; checksums and machine-readable release metadata record the candidate SHA, versions, asset names, skill counts and tested compatibility.
- [ ] Fixtures reject stale assets, missing files, wrong versions and unexpected archive entries; successful preparation can be repeated or resumed without another bump.
- [ ] grey-matter check-repo, tkt mise run check, native package validation and release fixtures pass on the resulting candidate tree; platform coverage is explicit.

Native validation gate: [current Claude evidence](../docs/agents/research/claude-current-validation.md) proves root validation misses nested skill defects. Candidate preparation must run `scripts/probe-claude-validation.mjs` with a current validator for each candidate pack (explicit manifests plus exact components and seeded detection), alongside the other native checks. Preserve the isolated policy probe from ticket 73 for candidate compatibility checks.

Preserve ticket 65’s independent YAML syntax gate: native Claude accepted malformed YAML during the source audit. Native advice scans must be complete; run against tracked/candidate snapshots so untracked target/ and .git do not exhaust the directory scan cap.

## Artifact layer progress

[Release artifact tooling](../docs/agents/release-artifacts.md) builds all three host
bundles from an exact committed source and verifies them after extraction without
the checkout. It uses the deployer's shared resource closure plus declared runtime
files, preserves notices/modes and records hashes/identity. Seeded fixtures cover
stale assets, missing/extra files, malformed YAML, source/lock/version mismatches,
credential exclusions and replay protection. Native/platform fields remain unverified
until real candidate checks run. Candidate worktree/version preparation, read-only
dry-run, phase resume and final gates remain required; this ticket stays in progress.

The artifact layer is now invariant 11, with 22 isolated fixtures. Full source-version
bundle smoke checks pass on all six host/product rows, with [exact asset evidence](../docs/agents/research/evidence/artifact-conformance-20261023.json).
A stale root Cargo.lock fixture exposed a cargo metadata --no-deps limitation;
explicit TOML parsing now rejects it. The older bucket-removal regression fixture
was also repaired to mutate parsed JSON and reject no-op seeds after manifest
formatting changed. No candidate versions, tags or publication were changed.

The initial native artifact probe missed Claude README_MISSING because success=true
coexisted with blocking=true. The packager now generates complete per-host READMEs;
a resealed short-README fixture fails; the current Claude probe checks directory
blockers and seeds README removal. Final six artifact rows and both native controls
pass, with the initial finding retained in the same evidence JSON. Nonblocking icon
advice remains in staging 71. This is an implemented packaging fix, not release approval.

## Local draft mechanics progress

[Draft preparation](../docs/agents/release-preparation.md) implements default read-only
dry-run, a separate branch/worktree (or an explicit app-managed worktree), coordinated
version/lock/changelog edits, immutable notes/artifact identity and resume based on
observed Git/file state. Per-file ownership receipts recover interrupted replacements;
original source and foreign files are preserved. Git context variables cannot redirect
writes into another index/repository. The tool has no publication path and always
reports publishable=false with pending gates. Product/native/scope/compatibility and
platform gate integration, tkt standalone entry-point wiring and real approved candidate
evidence remain before closure. Candidate 0.2.0/0.5.0 approval is still pending; only
synthetic fixtures have executed version preparation.

## Exact-commit product gate progress

`release-product.mjs` now defaults to a read-only command plan, then runs the product's
full gate only with `--execute` against a clean full SHA. It records commands, log hashes,
exit/signal and actual host metadata outside the candidate. Dirty/moved candidates,
foreign output, path aliases and a successful command that changes source are refused.
The checker now offers `--require-tools`: missing tkt cannot silently skip a release
check. This evidence is explicitly product-only, not release readiness; native, scope,
compatibility, other-platform and standalone tkt wiring remain outstanding.

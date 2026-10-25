---
id: "79"
title: "Decide repository artifact hygiene scope and invocation"
status: in_progress
blocked_by: []
validation_criteria:
  - "A committed proposal identifies one owner for artifact classification and existing report/Git/doc owners."
  - "The ticket records the approved invocation and offline report retention contract before implementation starts."
  - "node --test scripts/repository-artifact-hygiene.test.mjs and node scripts/check-repo.mjs pass."
  - "Canonical local deployment exposes the new skill and its inspector exactly once per enabled harness."
tags: ["type:decision", "stream:tooling"]
---

# Decide repository artifact hygiene scope and invocation

## What to build

Intent source: the user requested a grey-matter proposal after a storage analysis
found repeated generated evidence mixed with source assets. Review
[proposal 10](../docs/agents/proposals/10-repository-artifact-hygiene.md) and decide
whether to adopt the narrow `repository-artifact-hygiene` workflow.

The user approved implementation on 2026-10-25: invocation by user and model,
staged-candidate inspection by default, and the revised offline/inline/bundle
report contract. Implement the skill, read-only inspector, fixture gate and
existing-owner routing from proposal 10.
Existing format, placement, curation, Git and provider-access owners keep their
boundaries. The prior pending decision is resolved by that explicit request.

## Context

Read the proposal, `docs/agents/report-format.md`, and
`skills/meta/adopt-project/references/repo-hygiene.md`. The proposal replaces
binary-implies-LFS advice and resolves generated inline payload retention without
banning useful self-contained deliverables. A separate
[billing access reference](../docs/agents/research/github-billing-access.md)
captures provider-specific permission interpretation, not storage policy.

The implementation adds no automatic migrations, deletion, history rewrites or
spending changes. Project-specific actions follow their own task authorization.

## Acceptance criteria

- [x] A committed proposal identifies classification ownership and the existing report, Git and document owners.
- [ ] Record the user's approved invocation and offline report retention contract before implementation starts.
- [ ] The inspector fixtures and complete repository gate pass on the implemented source.
- [ ] The canonical local deployer exposes the skill and bundled script without duplicate loading.

## Validation notes

The read-only inspector received independent code and guidance reviews. Three
policy gaps (newline globs, NUL-prefixed embedded content, and manifest-only
removal) were reproduced with red fixtures and fixed; all 23 fixtures pass.
Two read-only pilots covered an asset-heavy committed tree and a small code repo.
Source/LFS restoration was hash-verified from a clean remote cache for current
and historical revisions; a consumer's full rebuild still requires its ignored
private inputs, which were preserved and not published. Windows/Linux native
integration is not claimed from macOS checks.

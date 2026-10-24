---
id: "71"
title: "Stage reviewed changelogs README files and release artifacts"
status: in_progress
blocked_by: ["70"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "Approved candidate versions and release scope are recorded; each repo has a dedicated clean candidate branch/worktree and reproducible candidate SHA rather than unreviewed changes on the developer checkout."
  - "CHANGELOG/README/install-update-migration docs and GitHub release-note drafts describe all included user-facing changes, Codex/Claude/Antigravity delivery, Node maintainer requirements and tkt CLI compatibility accurately."
  - "Candidate versions agree across authorities/manifests/crate lock where applicable; prepared plugin archives, tkt release assets as applicable, checksums and release metadata correspond to the recorded candidate SHA."
  - "The final audit is re-run/reconciled on the fully staged candidate after documentation and version edits; links/prose, native syntax checks, package exclusions, install-upgrade and duplicate-loading gates pass with fresh evidence."
  - "A committed staging index lists both candidate revisions, review artifacts, release notes, checksums, compatibility, unresolved exclusions and exact later publish/resume commands; machine-local paths have reproducible generation instructions."
  - "No release tag is pushed, registry/GitHub release published, stable ref promoted or public plugin-directory submission made; closing this ticket reports staged status only."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Stage reviewed changelogs README files and release artifacts

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

Stage complete reviewable release candidates for both repos after a clean readiness audit. Update changelogs, README/install/update/migration guidance, compatibility notes, manifest/version surfaces, release notes and bundles. Prepare candidate branches/worktrees tied to approved versions and exact SHAs, and reconcile the final audit after every staging edit. Staging is not publication.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `CHANGELOG.md`, `README.md`, `docs/agents/harnesses.md`
- [tkt CHANGELOG](https://github.com/smileynet/tkt/blob/main/CHANGELOG.md) and [README](https://github.com/smileynet/tkt/blob/main/README.md)
- approved release scope/audit from ticket 70
- candidate preparation and package metadata from ticket 67

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [ ] Approved candidate versions and release scope are recorded; each repo has a dedicated clean candidate branch/worktree and reproducible candidate SHA rather than unreviewed changes on the developer checkout.
- [ ] CHANGELOG/README/install-update-migration docs and GitHub release-note drafts describe all included user-facing changes, Codex/Claude/Antigravity delivery, Node maintainer requirements and tkt CLI compatibility accurately.
- [ ] Candidate versions agree across authorities/manifests/crate lock where applicable; prepared plugin archives, tkt release assets as applicable, checksums and release metadata correspond to the recorded candidate SHA.
- [ ] The final audit is re-run/reconciled on the fully staged candidate after documentation and version edits; links/prose, native syntax checks, package exclusions, install-upgrade and duplicate-loading gates pass with fresh evidence.
- [ ] A committed staging index lists both candidate revisions, review artifacts, release notes, checksums, compatibility, unresolved exclusions and exact later publish/resume commands; machine-local paths have reproducible generation instructions.
- [ ] No release tag is pushed, registry/GitHub release published, stable ref promoted or public plugin-directory submission made; closing this ticket reports staged status only.

Native Claude 2.1.309 reports nonblocking icon and current marketplace install-line advice for both repos. Include these in artifact polish or explicitly resolve their applicability in the audit; do not drop them because schema validation passes. See [dated validation evidence](../docs/agents/research/claude-current-validation.md). Root CLAUDE.md is repository guidance and must not be advertised as automatically loaded plugin context.

## Windows companion-guide additions (2026-10-24)

Use the [native Windows report](../docs/agents/research/windows-native-validation-20261024.md) when staging installation/migration guidance. Explain that old Git Bash tkt installs may be regular copies, which the symlink migration tool preserves for explicit source/file-byte review; do not recommend forced deletion of arbitrary user directories. Reproduction guidance must pin AGY through an updater-disabling child launcher, set KIRO_HOME for native Kiro, and retain Codex's Windows Known Folder isolation limit until 77 resolves it. These are companion-guide requirements, not permission to alter frozen candidates, grant a scope exclusion or stage before 70.

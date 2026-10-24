---
id: "71"
title: "Stage reviewed changelogs README files and release artifacts"
status: done
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

- [x] Approved candidate versions and release scope are recorded; each repo has a dedicated clean candidate branch/worktree and reproducible candidate SHA rather than unreviewed changes on the developer checkout.
- [x] CHANGELOG/README/install-update-migration docs and GitHub release-note drafts describe all included user-facing changes, Codex/Claude/Antigravity delivery, Node maintainer requirements and tkt CLI compatibility accurately.
- [x] Candidate versions agree across authorities/manifests/crate lock where applicable; prepared plugin archives, tkt release assets as applicable, checksums and release metadata correspond to the recorded candidate SHA.
- [x] The final audit is re-run/reconciled on the fully staged candidate after documentation and version edits; links/prose, native syntax checks, package exclusions, install-upgrade and duplicate-loading gates pass with fresh evidence.
- [x] A committed staging index lists both candidate revisions, review artifacts, release notes, checksums, compatibility, unresolved exclusions and exact later publish/resume commands; machine-local paths have reproducible generation instructions.
- [x] No release tag is pushed, registry/GitHub release published, stable ref promoted or public plugin-directory submission made; closing this ticket reports staged status only.

Native Claude 2.1.309 reports nonblocking icon and current marketplace install-line advice for both repos. Include these in artifact polish or explicitly resolve their applicability in the audit; do not drop them because schema validation passes. See [dated validation evidence](../docs/agents/research/claude-current-validation.md). Root CLAUDE.md is repository guidance and must not be advertised as automatically loaded plugin context.

## Windows companion-guide additions (2026-10-24)

Use the [native Windows report](../docs/agents/research/windows-native-validation-20261024.md) when staging installation/migration guidance. Explain that old Git Bash tkt installs may be regular copies, which the symlink migration tool preserves for explicit source/file-byte review; do not recommend forced deletion of arbitrary user directories. Reproduction guidance must pin AGY through an updater-disabling child launcher, set KIRO_HOME for native Kiro, and retain Codex's Windows Known Folder isolation limit until 77 resolves it. These are companion-guide requirements, not permission to alter frozen candidates, grant a scope exclusion or stage before 70.

## Pinned staged carrier (2026-10-24)

Review commit `c24720f77f252544659a376a1493fd5c53985018` on
`codex/stage-grey-matter-020-tkt-050` contains both exact candidates' archives,
README/changelog snapshots, note drafts, child verification reports/logs, all six
real gate receipts, inventory, coordinated install guide, tag text records and
deferred publication/recovery commands. The carrier remains on its dedicated
branch. The [closeout report](../docs/agents/research/release-staging-20261024.md)
and [structured proof](../docs/agents/research/evidence/release-staging-20261024.json)
record fresh pinned-reader verification: 47 regular files, five grey assets and
22 joined tkt assets. The tkt plan passes with `writes:false` and publication
workflow ID 394865280. No source/version candidate edits were made; unchanged
three-platform native/install/upgrade evidence is reused with original limits.

Audit70 is closed. Full carrier consistency/recovery gate passes all12 groups,
links and both final prose reviews pass. Existing sealed logs retain their original
whitespace; authored files pass the scoped check. No tag creation, publication,
registry upload, stable promotion, directory submission or settings/secret change
was performed. Any later execution requires separate authorization.

## Resolution (2026-10-24)

done: staged only. Review c24720f77f252544659a376a1493fd5c53985018 on codex/stage-grey-matter-020-tkt-050 contains exact grey0.2.0 and tkt0.5.0 release artifacts. Pinned readers and dry-run CI publisher plan pass; no remaining staging blockers. Publication requires separate authorization.

### Verification
1. ✓ Approved candidate versions and release scope are recorded; each repo has a dedicated clean candidate branch/worktree and reproducible candidate SHA rather than unreviewed changes on the developer checkout. — "User-approved grey0.2.0/tkt0.5.0 remain clean frozen C e071b7b/2b6ff17 on dedicated branches; review carrier c24720f77f252544659a376a1493fd5c53985018 is clean and pushed."
2. ✓ CHANGELOG/README/install-update-migration docs and GitHub release-note drafts describe all included user-facing changes, Codex/Claude/Antigravity delivery, Node maintainer requirements and tkt CLI compatibility accurately. — "Carrier preserves exact candidate README/CHANGELOG snapshots and note drafts; installation.md documents all three plugin hosts, dependency-first Claude, separate CLI, Node22/Rust1.85, update channels and Windows copies; prose review CLEAN."
3. ✓ Candidate versions agree across authorities/manifests/crate lock where applicable; prepared plugin archives, tkt release assets as applicable, checksums and release metadata correspond to the recorded candidate SHA. — "Pinned metadata, six sealed archives and SHA256SUMS match candidate identities; reader verifies 16 original CI dist/crate assets plus seal; tkt joined22assets, grey5."
4. ✓ The final audit is re-run/reconciled on the fully staged candidate after documentation and version edits; links/prose, native syntax checks, package exclusions, install-upgrade and duplicate-loading gates pass with fresh evidence. — "Carrier full check-repo all12 passes; pinned regular-blob/local-hash readers pass47files, child reports/native identities rechecked, unchanged three-platform install/upgrade/duplicates proof reconciled with explicit limits."
5. ✓ A committed staging index lists both candidate revisions, review artifacts, release notes, checksums, compatibility, unresolved exclusions and exact later publish/resume commands; machine-local paths have reproducible generation instructions. — "Committed index at c24720f binds both C and six real receipts each, note/metadata/verification digests, CI identity and publisher/tag record; README/publication guide provides reproduction and later publish/resume commands. Main5908109 records structured closeout."
6. ✓ No release tag is pushed, registry/GitHub release published, stable ref promoted or public plugin-directory submission made; closing this ticket reports staged status only. — "Authenticated read-only checks show candidate tags/stable refs/releases absent and crate0.5.0 missing; dispatch plan reports writes:false. No tag creation, registry/GitHub publication, stable promotion, directory submission or settings change."

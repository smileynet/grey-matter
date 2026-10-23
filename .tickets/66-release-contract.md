---
id: "66"
title: "Define coordinated release skills and guidance"
status: in_progress
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

- [ ] A committed release contract maps one version authority per repo to every manifest, crate/binary where applicable, Git tag, GitHub release and generated artifact; the deploy engine internal version is distinguished.
- [ ] The contract specifies pre-1.0 and post-1.0 bumps, including behavior-changing skill/guidance edits and skills-only tkt releases, and records any decisions requiring user confirmation.
- [ ] Release skills describe dry-run, prepare, publish, resume and verify boundaries; grey-matter local tooling and tkt CI are the sole GitHub publishers for their respective repos.
- [ ] Guidance defines local development versus stable/pinned consumers, separates Git marketplace releases from optional public-directory submission, and never promises undocumented Codex cache semantics.
- [ ] Release/sync/AGENTS/router references route local refresh through one canonical deploy call with duplicate prevention; no instruction runs legacy wrappers as extra deployments.
- [ ] Document links, invocation sidecars and skill indexes pass check-repo; an independent prose review is resolved and evidence is recorded.

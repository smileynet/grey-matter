---
id: "69"
title: "Verify plugin fresh installs and upgrades in isolated harness homes"
status: in_progress
blocked_by: ["67", "68"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "Fresh-install and previous-release upgrade cases cover grey-matter/tkt Codex, Claude and Antigravity packages, recording actual client versions, source refs and discovered file paths."
  - "Supported Kiro/OpenCode bare-root deployments and Crush project deployment are checked; any unsupported target/version or unavailable platform is explicitly a gap, not an assumed pass."
  - "Fixtures verify added/modified/removed skills, invocation policy, namespaces, packaged references, stale cache/version scenarios and tkt CLI capability/version compatibility."
  - "Physical roots plus live catalogs show each managed skill exactly once through install, upgrade, repeated deploy, enabled/disabled plugin and symlink scenarios; unrelated user files remain intact."
  - "Release tests prove dry-run/isolation, refresh failure recovery and identical second-run state; no test reads or mutates real user caches, credentials, registry publications or global plugin installs."
  - "Test results identify Windows/macOS/Linux coverage and link missing-platform remediation into the final audit; the release publisher consumes these results as gates."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Verify plugin fresh installs and upgrades in isolated harness homes

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

A candidate release is proven installable and upgradable rather than merely syntactically valid. Build isolated fresh-install and previous-release upgrade fixtures for all six plugin packages and supported bare-root deployment targets. Test the candidate tag/SHA in isolated fixtures and simulate stable promotion to verify the expected SHA; actual stable promotion and its live verification belong to a later authorized release. Use temporary homes and stub external services so tests never touch real harness state.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `scripts/deploy.test.mjs` and `scripts/deploy.mjs`
- `docs/agents/harnesses.md`
- [tkt deployment tests](https://github.com/smileynet/tkt/blob/main/tests/deploy_skills.rs)
- the conformance report from ticket 65 and candidate metadata from ticket 67

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [ ] Fresh-install and previous-release upgrade cases cover grey-matter/tkt Codex, Claude and Antigravity packages, recording actual client versions, source refs and discovered file paths.
- [ ] Supported Kiro/OpenCode bare-root deployments and Crush project deployment are checked; any unsupported target/version or unavailable platform is explicitly a gap, not an assumed pass.
- [ ] Fixtures verify added/modified/removed skills, invocation policy, namespaces, packaged references, stale cache/version scenarios and tkt CLI capability/version compatibility.
- [ ] Physical roots plus live catalogs show each managed skill exactly once through install, upgrade, repeated deploy, enabled/disabled plugin and symlink scenarios; unrelated user files remain intact.
- [ ] Release tests prove dry-run/isolation, refresh failure recovery and identical second-run state; no test reads or mutates real user caches, credentials, registry publications or global plugin installs.
- [ ] Test results identify Windows/macOS/Linux coverage and link missing-platform remediation into the final audit; the release publisher consumes these results as gates.

## Initial candidate probes (2026-10-24)

Use grey candidate `bec5afee9f4f070ef898ac309d45d5061a5be7b5` and tkt candidate
`cd96042a5a70123cfbfc656ddf34563c53cff7a0`. Their product/native preparation
evidence is committed by ticket 67. Previous tags v0.1.0/v0.4.0 contain no plugin
manifests, so previous-release cases must test bare-skill migration; synthetic
older plugin caches are separate version/cache controls, not historical releases.

The original tkt v0.4.0 installer reproduced a readable obsolete `tkt` symlink
beside the four new skills. [tkt 217](https://github.com/smileynet/tkt/blob/main/.tickets/217-legacy-skill-upgrade.md)
fixes that upgrade path with explicit old-source matching and foreign-content
preservation. It is closed and included in the new tkt candidate; retain the
migration in every previous-release fixture instead of silently deleting leftovers.

Initial isolated bare-root probes pass for Kiro/OpenCode and Crush project roots:
46 grey + 4 tkt skills plus one foreign sentinel, dry-run unchanged, repeated payload
bytes unchanged, foreign bytes preserved. OpenCode 1.18.21's live debug catalog
matches all 51 names. The initial piped catalog was truncated by the CLI; direct
file capture provides complete parseable output. This is partial coverage: Kiro and
Crush live catalogs, previous-release/native upgrade matrices, cache/enable/symlink
controls, compatibility and platform approval remain to be verified. Do not close
this ticket using these initial probes alone.

Candidate `cd96042` has now passed the complete five-target staging build and seal
(run 40076036798). [Bound CI artifact evidence](../docs/agents/research/evidence/tkt-candidate-stage-20261024.json)
records the 16 release assets, exact Actions repository/workflow/run/attempt/job and
artifact IDs, ZIP/seal hashes and sealed file inventory. The downloaded archive's
SHA256 matches the upload digest; `readCiStage` re-observed run/artifact metadata
before and after inspection and verified upload-log identity. Retain the original
ZIP locally for 71; no registry/release/stable operation ran.


## Current candidate evidence (2026-10-24)

The current pair is grey-matter `bec5afee9f4f070ef898ac309d45d5061a5be7b5`
and tkt `b2425c93f94a0b56a87cb6496ecbadaf381922bf`. The tkt candidate
supersedes `cd96042` after [tkt 218](https://github.com/smileynet/tkt/blob/main/.tickets/218-workflow-query-guidance.md)
corrected invalid query flags discovered during compatibility checks. Earlier
candidate reports above are historical, not evidence for the replacement candidate.

Durable current evidence:

- [Claude installed-plugin transitions](../docs/agents/research/evidence/claude-upgrade-session-catalog-20261024.json):
  real previous tagged bare installers, current sealed Claude assets and hooks,
  migration/pruning, repeated deploy, dependency disable guard, and native session
  command catalog **50 enabled → 0 disabled → identical 50 restored**. Initialization
  only; no user/model prompt. Command metadata does not prove hidden skill execution.
- [Other harness catalogs and upgrade controls](../docs/agents/research/evidence/plugin-compatibility-catalogs-20261024.json):
  exact executed probes and source digests for Codex, Antigravity, Kiro, Crush and
  bare roots/OpenCode. Each retains actual candidate identities, physical paths,
  foreign sentinels, repeated-state checks and native catalog scope. Antigravity's
  older-plugin controls are synthetic because historical tags had no plugin package.
- [Current tkt product/native and CLI verification](../docs/agents/research/evidence/tkt-final-candidate-verification-20261024.json):
  fresh product/native receipt digests, 21 command surfaces across 42 files, and an
  executed frozen-candidate context example. Planned migration map/apply templates
  are explicitly excluded from claims about current CLI capabilities.
- [Current tkt sealed hosted build](../docs/agents/research/evidence/tkt-candidate-stage-b2425c9-20261024.json):
  successful run 40078742961; 16 sealed assets, matching uploaded ZIP hash, and
  independently re-observed Actions run/attempt/artifact/seal-job identity.

Remaining work before closure: resolve the Windows full-check probe results,
consolidate platform coverage and missing-platform remediation into the final audit,
and connect compatibility/upgrade evidence to staging's required gate records.
Native vendor-client catalog observations above are macOS observations, not
Windows/Linux native loading proof. The first supplementary Windows run
40079229283 failed four Node tests (missing dist/mise prerequisites, checkout
byte mismatch and package-path assertion); probe-only follow-up 40079658409
retains the same candidate and installs prerequisites/preserves Git file bytes.
No Windows pass is claimed while that run is incomplete.

---
id: "69"
title: "Verify plugin fresh installs and upgrades in isolated harness homes"
status: done
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

- [x] Fresh-install and previous-release upgrade cases cover grey-matter/tkt Codex, Claude and Antigravity packages, recording actual client versions, source refs and discovered file paths.
- [x] Supported Kiro/OpenCode bare-root deployments and Crush project deployment are checked; any unsupported target/version or unavailable platform is explicitly a gap, not an assumed pass.
- [x] Fixtures verify added/modified/removed skills, invocation policy, namespaces, packaged references, stale cache/version scenarios and tkt CLI capability/version compatibility.
- [x] Physical roots plus live catalogs show each managed skill exactly once through install, upgrade, repeated deploy, enabled/disabled plugin and symlink scenarios; unrelated user files remain intact.
- [x] Release tests prove dry-run/isolation, refresh failure recovery and identical second-run state; no test reads or mutates real user caches, credentials, registry publications or global plugin installs.
- [x] Test results identify Windows/macOS/Linux coverage and link missing-platform remediation into the final audit; the release publisher consumes these results as gates.

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


## Prior candidate evidence (b2425c9; superseded below)

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


Windows follow-up 40079658409 is terminal failure: Node 34 passed / 2 failed /
1 skipped; fmt/Clippy and 191 Rust unit tests pass, then six deployment integration
fixtures fail by invoking the WSL bash launcher. Generator temporary-workspace and
Cargo package-path failures remain. [tkt 219](https://github.com/smileynet/tkt/blob/main/.tickets/219-windows-maintainer-verification.md)
owns this release-blocking remediation; resolve it and refresh affected candidate
evidence before closure. The ownership hash mismatch is verified checkout CRLF
conversion, and the corrected probe's ownership/mise wrapper checks pass.


## Verified replacement candidate pair (2026-10-24)

Current candidates: grey-matter `bec5afee9f4f070ef898ac309d45d5061a5be7b5`
and tkt `af4703d7b737a772eb45fb7e601ce3ec6b9b9735`. Tkt source
`468684dd6ff13b7c33c7d59e43d234400f392d80` contains the verified portability
corrections. Tickets 219 and 220 are closed after full source CI 40081866652
passed on Windows/Linux. Closure-only main commits do not change the candidate.

All six compatibility probe groups were rerun against this pair and passed. The
current generic evidence files linked above now contain this replacement tkt SHA,
exact executed probe sources and hashes. The current tkt product/native receipt
also passes, as do 21 CLI command surfaces and the executed context example.

[Bound replacement CI stage](../docs/agents/research/evidence/tkt-candidate-stage-af4703d-20261024.json)
verifies all 16 assets from build-only run 40082044616, the upload ZIP/seal hashes,
and before/after Actions identity observations. Original ZIP is retained locally.
Candidate CI 40082019316 also passes all five jobs at the exact replacement SHA.

[Platform coverage](../docs/agents/research/evidence/release-platform-coverage-20261024.json)
records the exact candidate Windows/Linux jobs and output, alongside macOS native
coverage. Native Windows/Linux vendor catalogs remain unverified. The Windows
relative-symlink Node case and Unix-only CLI fixture exclusions are named. Final
audit 70 must classify these limits; this ticket does not grant platform approval.

The publisher-format compatibility and upgrade receipts are committed for each
product under `docs/agents/research/evidence/release-gates/`. They bind these exact
candidate identities and reference the measured reports. `readStagedCandidate`
requires all six named gate receipts and their digests; platform approval, final
audit and staging remain separate pending gates. Ticket 71 must bind the real
receipts in review carrier R before its reader can permit a publication plan.
No release, registry, stable or public-directory operation was performed.

## Resolution (2026-10-24)

done: isolated fresh-install, historical bare migration and synthetic cache controls pass for the current candidate pair; compatibility and upgrade evidence is retained for final audit and staging without granting pending platform or publication approval

### Verification
1. ✓ Fresh-install and previous-release upgrade cases cover grey-matter/tkt Codex, Claude and Antigravity packages, recording actual client versions, source refs and discovered file paths. — "Current evidence commit 960bd78 binds grey bec5afee9f4f070ef898ac309d45d5061a5be7b5 and tkt af4703d7b737a772eb45fb7e601ce3ec6b9b9735. Fresh product/native receipts pass all six sealed packages. Executed previous v0.1.0/v0.4.0 bare installers migrate to Codex/Claude; AGY older-plugin controls are explicitly synthetic because prior tags had no plugin package."
2. ✓ Supported Kiro/OpenCode bare-root deployments and Crush project deployment are checked; any unsupported target/version or unavailable platform is explicitly a gap, not an assumed pass. — "Executed Kiro 2.34.0 ACP, OpenCode 1.18.21 debug catalog, and Crush 0.98.1 workspace API each match 50 managed skills plus the preserved foreign sentinel. Bare dry-run and repeated payload state are unchanged; native Windows/Linux vendor loading remains an explicit final-audit gap."
3. ✓ Fixtures verify added/modified/removed skills, invocation policy, namespaces, packaged references, stale cache/version scenarios and tkt CLI capability/version compatibility. — "Exact probe sources/hashes in plugin-compatibility-catalogs and Claude evidence verify AGY added/modified/removed payloads, invocation metadata, namespaces, sealed reference closure, Codex same-version cache repair and repeated catalogs. Current tkt binary reports 0.5.0 af4703d; 21 command surfaces across 42 files and scoped-context replay pass."
4. ✓ Physical roots plus live catalogs show each managed skill exactly once through install, upgrade, repeated deploy, enabled/disabled plugin and symlink scenarios; unrelated user files remain intact. — "Live catalogs and physical disposable roots retain each managed skill once. Claude session commands are 50 enabled, zero disabled, identical 50 restored; Codex disabled bare fallback and Kiro symlink separation pass; AGY enable/disable and repeated state pass. Foreign sentinels remain intact in all tested paths."
5. ✓ Release tests prove dry-run/isolation, refresh failure recovery and identical second-run state; no test reads or mutates real user caches, credentials, registry publications or global plugin installs. — "All six fresh probe groups pass using disposable homes, explicit isolated environments and metadata-only clients without model prompts; Node/npm bootstrap uses an owned cache. Exact candidate product/native evidence and all 12 repository invariants pass, including dry-run, ownership, failed-refresh preservation and repeat-state fixtures. No real harness installation, credentials or registry/release writes occur in these tests."
6. ✓ Test results identify Windows/macOS/Linux coverage and link missing-platform remediation into the final audit; the release publisher consumes these results as gates. — "Committed release-platform-coverage-20261024.json binds successful exact candidate Windows/Linux CI and macOS native results, names OS skips and unverified native-platform scope, and routes platform disposition to 70. Four publisher-format compatibility/upgrade receipts match sealed candidate identities; staging reader requires separate scope/platform/audit/staging gates and 71 will bind review carrier R. Current tkt sealed build 40082044616 validates 16 assets and upload provenance."

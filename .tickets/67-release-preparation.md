---
id: "67"
title: "Prepare version-consistent release candidates and plugin bundles"
status: done
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
- `skills/meta/release/references/release.sh`, `scripts/release.test.mjs` and
  `scripts/release-entrypoints.test.mjs` (replace the retired legacy-publication shell fixtures)
- `scripts/deploy.mjs` and plugin manifests
- [tkt release.toml](https://github.com/smileynet/tkt/blob/main/release.toml)
- [tkt tools/release.sh](https://github.com/smileynet/tkt/blob/main/tools/release.sh)

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

## Acceptance criteria

- [x] Fixtures prove prepare --dry-run changes neither repository nor user state and creates no remote tag, GitHub release, registry publication or stable update.
- [x] Candidate preparation derives every version surface from its repo authority, updates the tagged crate lock version where applicable, and fails when any manifest/version differs.
- [x] Each prepared bundle is closed over runtime references and executable resources; extraction into a clean directory validates paths without the source checkout.
- [x] Bundles exclude .git, tickets, scratch, local credentials, target/node_modules and unrelated development output; checksums and machine-readable release metadata record the candidate SHA, versions, asset names, skill counts and tested compatibility.
- [x] Fixtures reject stale assets, missing files, wrong versions and unexpected archive entries; successful preparation can be repeated or resumed without another bump.
- [x] grey-matter check-repo, tkt mise run check, native package validation and release fixtures pass on the resulting candidate tree; platform coverage is explicit.

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

## Sealed-bundle native gate progress

`release-native.mjs` promotes the six-row scratch audit into a repeatable command.
It verifies sealed assets before starting native CLIs, uses disposable configuration
and an environment allowlist, compares exact namespaces and installed Codex/AGY bytes,
and runs Claude's seeded probe against extracted snapshots. Directory blockers,
incomplete scans, duplicate/missing names, changed bytes and missing tools fail.
Native versions and actual platform/network isolation are recorded; no upgrade,
workflow-execution, cross-platform or overall release approval is implied.

[Six-host tooling evidence](../docs/agents/research/evidence/native-tooling-20261023.json)
records all rows passing on sealed grey-matter `932e441` / tkt `f2445dc`
source-version bundles (44/4 exact skills): Codex 0.147.0, Claude 2.1.309 and AGY 1.4.6.
The runner/probe file hashes match the implementation. Expected installed files match
for Codex (189/22) and AGY (186/19). These are macOS smoke results for existing bundle
identities, not approved 0.2.0/0.5.0 candidates or completion of ticket 67.

## Standalone wiring progress

tkt now owns hash-tracked copies of the shared preparation/product/native modules,
its own pinned private Node package/lock and a release-tool test task in the canonical
mise gate. The sync helper refuses unowned/local edits and dependency drift.
Both shell entry points forward explicit prepare/verify modes only; legacy publishing
and auto-bump aliases are removed. Their wrappers work in source and flat plugin
layouts; runtime manifests include modules, deploy engine and package/lock resources.
Actual candidate preparation/verification orchestration, approved scope/version results,
compatibility and remaining platforms still gate closure.

[Wiring evidence](../docs/agents/research/evidence/release-wiring-20261023.json) ties
grey-matter `f77fbd3` and tkt `d9e55e5` to six passing native bundle rows, 94 local
release fixtures, four standalone tkt wiring fixtures and 296 Rust tests. tkt's
[hosted CI run](https://github.com/smileynet/tkt/actions/runs/40033425413) also passes
on Ubuntu 24.04.5 / Node 22.23.3 / Rust 1.99.1. This verifies Linux tkt product wiring,
not native Windows support or grey-matter's entire Linux suite. Versioned candidates
and final release readiness remain pending.

## Candidate verification orchestration progress

`release.mjs verify` now joins the strict product gate and sealed-bundle native gate
for a full commit SHA. It rejects mismatched checkout/bundle identity before output,
runs fresh checks in ordered child directories, skips native execution after product
failure and binds both reports plus sealed metadata by hashes in an atomic index.
Source cleanliness and artifact identity are checked again before success. Reusing
existing evidence output is refused; failed/interrupted runs retain unfinished phases.
The new module is vendored into tkt and included in both runtime manifests/wrappers.
The result keeps scope, compatibility, upgrade, platform approval, audit and staging
pending; it never grants publication or closes this ticket by itself.

[Coordinated evidence](../docs/agents/research/evidence/coordinated-verification-20261023.json)
records fresh product/native success for grey-matter `6def961` and tkt `64c651c`,
with child report/log hashes checked against their indices. tkt's new
[hosted run](https://github.com/smileynet/tkt/actions/runs/40034566186) also passes.
These are current source-version smoke snapshots (0.1.0/0.4.0); proposed 0.2.0/0.5.0
approval, included-scope decisions and actual final-candidate evidence remain pending.

## Candidate version approval (2026-10-23)

The user explicitly approved grey-matter 0.2.0 and tkt 0.5.0 for staged candidates. This supersedes the pending-version notes above. It does not approve publication, release-tag pushes, crates.io, stable promotion or directory submission. Final included-scope dispositions and candidate checks remain required.

[Approved-version draft evidence](../docs/agents/research/evidence/approved-candidate-drafts-20261023.json) records grey-matter `d31b72a` (0.2.0) and tkt `8c40385` (0.5.0), all six bundles, fresh macOS product/native passes, hashes and unchanged-SHA preparation replay. Real evidence reads exposed and fixed two tooling defects: stdin imports attempted to resolve `-` as a file, and the reader's product report overwrote its product-name field. Seeded regressions now cover both, with YAML fixtures included in the full gate. These initial drafts predate those fixes and require regeneration before final staging; compatibility, upgrade, platform, scope and final-audit gates remain pending. No publication occurred.

External release blockers discovered during real Cargo packaging: [tkt 212](https://github.com/smileynet/tkt/blob/main/.tickets/212-exclude-cargo-scratch.md) owns tracked scratch inclusion, and [tkt 213](https://github.com/smileynet/tkt/blob/main/.tickets/213-packaged-build-identity.md) owns the false ancestor-Git hash in packaged binaries. The initial 0.5.0 archive is rejected for release despite a successful build. Its [failure evidence](../docs/agents/research/evidence/registry-initial-package-findings-20261023.json) and primary sources are retained; fresh final candidate packaging must verify both fixes.

Remediation verified (2026-10-23): tkt 212 and 213 are fixed and closed. Source commits `a924678` (scratch exclusion) and `b849d43` (packaged/checkout build identity) pass the full tkt gate. A fresh crate rebuilt beneath grey-matter reports its own `b849d43` hash, excludes scratch and retains matching clean archive VCS metadata. Durable evidence: `docs/agents/research/evidence/crate-remediation-20261023.json`. These source-smoke results do not validate the old approved-version drafts: regenerate 0.2.0/0.5.0 after the remaining source changes, then run the final candidate gates.

Crate closure follow-up: tkt 214 is fixed at `62250e4`: root-anchored Cargo inputs exclude plugin/maintainer files, including nested README/license/build-script names. A clean package rebuild retains matching VCS/binary identity. Evidence: `docs/agents/research/evidence/crate-runtime-closure-20261023.json`. This is source-version smoke evidence; refresh approved candidates before final staging.

## Documentation freeze checkpoint (2026-10-24)

Ticket 68 is closed after integrated Standards/Spec review and four verified fixes.
Before regenerating candidates, two read-only documentation audits and two fresh
prose passes covered public README/changelog/glossary and operational release
guidance. Current instructions now describe the implemented sole publishers and
retain 67/69–71's final gates. README/changelog coverage includes Codex/Claude/agy
delivery, maintainer requirements, default-ref versus stable delivery, recovery and
crate/resource closure. No published-release claim or version edit was introduced.

The glossary now names the adoption ADR explicitly and leaves procedures in their
owning skills. tkt's Node gate equivalent and tooling exemption agree with mise;
Claude update wording distinguishes cached versions from new default-ref installs.
The proposal labels initial findings as historical. Internal parent-field groundwork
was explicitly excluded from public release notes after query/output source showed
no new CLI behavior.

Evidence: documentation consistency and invocation checks pass (46 skills);
tkt's 30 release-tool/workflow fixtures pass; both diff checks pass; the canonical
plan matches ticket 68's done status. Fresh candidate preparation, product/native
and platform checks remain required. Preserve the reviewed documentation in the
candidate commits rather than editing it after install/upgrade verification.

## Candidate closure control (2026-10-24)

Preparation from source `153dad4` produced local version commit
`bf81a4b09f1a535f7183aa178a2a3f19fa46c220`, then correctly refused artifact creation:
`excluded development/credential path: .tickets/60-check-repo-green-windows-then-pre-push.md`.
That failed draft is not a release candidate. Its owned preparation state and old
branch remain for inspection; no remote release ref or publication was created.

The resource graph reached historical probe/ADR/proposal documents, whose local
ticket links pulled development records into package inputs. Link existence had
passed, but source-bundle closure had not been checked after the integrated work.
The proposal and parent-loss report now cite the same tickets through pinned
GitHub links. Observations and packaging exclusions remain intact. A direct check
of the canonical resource graph first failed, then passed with 250 resources and
no ticket paths. The release workflow now requires a source-version bundle smoke
before candidate version commits. Build/verify that smoke, then regenerate from
the corrected source; do not reuse the failed `bf81a4b` draft.

## Candidate version-fixture controls (2026-10-24)

Drafts grey `92f66df3c884cd3adcf22d816eee9c65411a534c` and tkt
`2fec15c5e1aa0dd0fe9488a92f592eaa110ce610` built closed bundles, but their exact
product gates failed before native validation. Grey had three deployment fixtures
reporting a hardcoded Claude folderVersion 0.1.0 for the 0.2.0 source. Tkt had two
CI-seal fixtures combining copied 0.5.0 manifests with a hardcoded 0.4.0 plan/crate.
Production source/version guards correctly refused those inconsistent inputs.

The fixture defaults now derive identity from their copied pack/Cargo authority;
explicit stale-version controls remain stale. Fresh targeted commands reproduced
all five failures. Fixed-fixture overlays then ran the complete 32 deployment and
7 CI-seal cases against the unchanged failed candidate trees: 39 passed. The
overlays changed only test path/import context, not either candidate or production
checks; both candidate trees remain clean. Regenerate from the committed fixture
fixes and rerun product/native verification. Neither failed draft is final evidence.

## Verified candidate preparation (2026-10-24)

Current candidates are grey `bec5afee9f4f070ef898ac309d45d5061a5be7b5`
from source `9e8a047`, and tkt `cd96042a5a70123cfbfc656ddf34563c53cff7a0`
from source `39d8bdf`. Both dedicated candidate branches are pushed. Each has
three sealed, independently verified bundles and fresh exact-commit product/native
reports. [Committed preparation evidence](../docs/agents/research/evidence/release-candidates-20261024.json)
retains identities, metadata, file inventories, hashes, reports, hosted jobs and
explicit platform limits. Report, metadata, archive and product-log hashes were
independently compared to the retained local files.

Grey's exact candidate passed all 12 repository invariants on macOS and hosted
Windows/Linux (run 40075385295); tkt's exact candidate passed its local full gate
and hosted CI (40075956812), including 37 Node tests, 296 Rust tests, MSRV and
Windows/Linux Claude hook fixtures. Native Codex 0.147.0, Claude 2.1.310 and AGY
1.4.6 pass all six candidate rows on macOS arm64, including seeded Claude defects,
exact Codex/AGY catalogs and installed-file hash comparisons. Native checks on
Windows/Linux remain outside this preparation evidence, not assumed passes.

A previous-release migration probe found that the original v0.4.0 tkt installer
left an unowned old `tkt` link beside the new four skills. [tkt 217](https://github.com/smileynet/tkt/blob/main/.tickets/217-legacy-skill-upgrade.md)
adds an explicit-source, preview-first migration, seven safety tests and upgrade
guidance. It is implemented and closed; the tkt candidate above includes it.
The earlier tkt `79302cb` candidate's successful five-target build is historical;
new candidate `cd96042` has a separate in-progress staging build (40076036798).
Final artifact staging and install/upgrade/compatibility approvals stay in 69–71.

## Resolution (2026-10-24)

done: prepared and verified approved 0.2.0/0.5.0 candidates and all six closed plugin bundles, with exact-commit product/native/platform evidence and explicit coverage limits; no tags, releases, registry publication or stable promotion. Continue install/upgrade ticket69, final audit70 and staging71.

### Verification
1. ✓ Fixtures prove prepare --dry-run changes neither repository nor user state and creates no remote tag, GitHub release, registry publication or stable update. — "Exact grey candidate bec5afee product gate includes the default/explicit CLI dry-run fixture, which compares source/Git/remote/harness-home bytes and prevents release/tag/registry/stable writes. Required check-repo passes locally and hosted Windows/Linux; preparation evidence committed at docs/agents/research/evidence/release-candidates-20261024.json."
2. ✓ Candidate preparation derives every version surface from its repo authority, updates the tagged crate lock version where applicable, and fails when any manifest/version differs. — "Prepared grey 0.2.0 at bec5afee9f4f070ef898ac309d45d5061a5be7b5 and tkt 0.5.0 at cd96042a5a70123cfbfc656ddf34563c53cff7a0; version inspectors and source/lock/manifest mismatch controls pass. Tkt candidate full gate passes 37 Node and 296 Rust tests, including manifest/crate consistency."
3. ✓ Each prepared bundle is closed over runtime references and executable resources; extraction into a clean directory validates paths without the source checkout. — "Each candidate built all three closed host bundles; independent extraction/resource/YAML/legal checks and native loading pass for all six rows. Artifact fixtures verify without the source checkout; native installed file hashes match 255/252 grey Codex/AGY files and 46/43 tkt files, with Claude seeded validators also passing."
4. ✓ Bundles exclude .git, tickets, scratch, local credentials, target/node_modules and unrelated development output; checksums and machine-readable release metadata record the candidate SHA, versions, asset names, skill counts and tested compatibility. — "Committed preparation evidence retains metadata with candidate SHAs, authority versions, all asset names/file hashes and 46/4 skill counts, plus tested client/platform reports. Report, metadata, asset and product-log SHA256 were independently compared. Ticket/scratch/credential/development exclusions and hook host boundaries pass; compatibility/upgrade approvals remain distinct 69 gates."
5. ✓ Fixtures reject stale assets, missing files, wrong versions and unexpected archive entries; successful preparation can be repeated or resumed without another bump. — "Exact-candidate release fixture groups pass stale assets, missing/extra entries, wrong versions, corrupted resume, interruption recovery and repeat-without-second-commit controls. Initial hardcoded-version fixture failures were reproduced and corrected without weakening source guards; current candidate gates are green."
6. ✓ grey-matter check-repo, tkt mise run check, native package validation and release fixtures pass on the resulting candidate tree; platform coverage is explicit. — "Grey 12-invariant check-repo passes on macOS and hosted Windows/Linux run 40075385295; tkt full mise gate passes locally and Linux CI 40075956812, with MSRV and Windows/Linux hook checks. Native Codex0.147.0/Claude2.1.310/AGY1.4.6 pass six macOS arm64 rows. Native Windows/Linux checks are explicitly unclaimed. Tkt five-target build/seal run40076036798 is also success; final install/audit/staging remain 69–71."

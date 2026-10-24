---
id: "70"
title: "Audit both projects before release staging"
status: in_progress
blocked_by: ["64", "60", "65", "66", "67", "68", "69", "72", "73", "74", "75", "76", "77", "78"]
priority: high
spec: "release-readiness"
validation_criteria:
  - "A committed audit report records exact grey-matter/tkt SHAs, tool versions, supported-platform coverage, source links, commands/output, severity and release disposition."
  - "Every open ticket and known finding across both repos is classified include/block/defer with rationale and explicit user approval where required; tickets 54,55,59,60,63,64 and tkt 210 are explicitly considered without silently reopening completed work."
  - "All six plugin conformance rows are current, every release-blocking finding is resolved, and any remediation discovered during audit has a linked ticket and blocks release staging."
  - "Fresh grey-matter check-repo, tkt mise run check, native validators, release fixtures and candidate fresh-install/upgrade probes pass; unavailable checks remain visible blockers or explicitly approved exclusions."
  - "The audit checks deployment provenance/collisions/vendor drift, documentation links/prose and README accuracy, changelog coverage, dependency/toolchain pins, packaged-file/secret exclusions and publication recovery."
  - "The report supplies a go/no-go decision for staging and lists the exact gates to repeat after staging edits; it does not tag, publish, submit plugins or advance stable."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Audit both projects before release staging

## Intent source

User request on 2026-10-23: create tickets for outstanding findings, release
skills/scripts/guidance, final pre-release audit and staged artifacts; audit each plugin
against its source documentation.

## What to build

Produce the final cross-project release-readiness audit from exact source revisions. Reconcile every outstanding finding and open ticket against an explicit release scope, run all applicable gates, verify plugin syntax against primary documentation, and identify blockers. This is a real project audit, not a summary of old test runs. Do not cut a release.

## Context and sources

Read the [coordinated release plan](../docs/agents/proposals/09-release-readiness.md) first. It contains policy proposals,
source-of-truth rules, current findings, host documentation URLs, scope boundaries and
verification requirements. Research is committed in [GitHub release mechanics](../docs/agents/research/github-release-strategy.md)
and [plugin update semantics](../docs/agents/research/plugin-release-semantics.md). Re-verify dated
facts at execution time; links alone are not evidence of conformance.

Start with:
- `scripts/check-repo.mjs` and `.tickets/`
- the release contract and conformance matrix from tickets 65-66
- [tkt project source](https://github.com/smileynet/tkt)
- candidate/verification evidence from tickets 67-69

Implementation may span both repos. Commit/push them independently and link each
revision in evidence. Keep the coordinated dependency graph in grey-matter; link any
repo-local tkt implementation ticket rather than duplicating its scope.

Tickets 60 and 64 are mandatory blockers in the current graph. Deferral language applies
to other work outside the chosen release scope. If the user explicitly removes a
platform or capability requiring 60/64, first record the approved scope change and
update this ticket's dependencies; an audit report alone cannot waive an active blocker.

## Acceptance criteria

- [ ] A committed audit report records exact grey-matter/tkt SHAs, tool versions, supported-platform coverage, source links, commands/output, severity and release disposition.
- [ ] Every open ticket and known finding across both repos is classified include/block/defer with rationale and explicit user approval where required; tickets 54,55,59,60,63,64 and tkt 210 are explicitly considered without silently reopening completed work.
- [ ] All six plugin conformance rows are current, every release-blocking finding is resolved, and any remediation discovered during audit has a linked ticket and blocks release staging.
- [ ] Fresh grey-matter check-repo, tkt mise run check, native validators, release fixtures and candidate fresh-install/upgrade probes pass; unavailable checks remain visible blockers or explicitly approved exclusions.
- [ ] The audit checks deployment provenance/collisions/vendor drift, documentation links/prose and README accuracy, changelog coverage, dependency/toolchain pins, packaged-file/secret exclusions and publication recovery.
- [ ] The report supplies a go/no-go decision for staging and lists the exact gates to repeat after staging edits; it does not tag, publish, submit plugins or advance stable.

Additional external blockers: tkt 212 (tracked scratch content in the crate) and 213 (wrong ancestor-Git hash in packaged binaries). Resolve and verify both before go/no-go; initial candidate package build success does not clear these failures. See [registry/package failure evidence](../docs/agents/research/evidence/registry-initial-package-findings-20261023.json) and the linked tickets in preparation 67. Check actual registry availability again at final staging; observed absence of 0.5.0 is not a reservation.

Remediation verified (2026-10-23): tkt 212 and 213 are fixed and closed. Source commits `a924678` (scratch exclusion) and `b849d43` (packaged/checkout build identity) pass the full tkt gate. A fresh crate rebuilt beneath grey-matter reports its own `b849d43` hash, excludes scratch and retains matching clean archive VCS metadata. Durable evidence: `docs/agents/research/evidence/crate-remediation-20261023.json`. These source-smoke results do not validate the old approved-version drafts: regenerate 0.2.0/0.5.0 after the remaining source changes, then run the final candidate gates.

Ticket-health disposition to retain in the final report: `tkt validate --brief` passes with one advisory for closed ticket 07's unchecked ACs. Its resolution explicitly closed it as a duplicate of 14, rather than claiming those ACs independently passed; do not fabricate checks to silence the warning. Ticket 14 is closed with dated evidence and explicit ancillary gaps. Its old claim that Codex does not read the shared root is superseded by 64's newer live catalog evidence; use the current conformance/portfolio reports for release readiness.

Crate closure follow-up: tkt 214 is fixed at `62250e4`: root-anchored Cargo inputs exclude plugin/maintainer files, including nested README/license/build-script names. A clean package rebuild retains matching VCS/binary identity. Evidence: `docs/agents/research/evidence/crate-runtime-closure-20261023.json`. This is source-version smoke evidence; refresh approved candidates before final staging.

Dependency/toolchain finding resolved: tkt ticket 215 declares Rust 1.85.0 and
checks that exact floor in CI. Hosted run 40054220986 reproduces the previous
1.80.1 edition2024 failure; run 40054566229 passes the 1.85.0 locked binary check
and the stable full gate. Ticket 216 fixes the separately observed cold-cache
identity fixture prerequisite, verified by that same clean full run. Both are
closed with numbered evidence. See [MSRV evidence and primary sources](../docs/agents/research/tkt-msrv-evidence.md).
Repeat candidate checks after preparing final 0.5.0; source smoke is not candidate proof.


## Hook scope progress (2026-10-23)

Included scope now contains grey-matter 54/55 and tkt 210, all implemented and
closed. Grey-matter 63 is implemented at `90482ee`; its exact Windows/Linux
platform run 40058361224 is green and ticket 63 is closed with both criteria verified. [Hook contract and primary sources](../docs/agents/research/claude-plugin-hooks.md)
and [source-smoke evidence](../docs/agents/research/evidence/claude-hooks-20261023.json)
record host isolation, native validation, the corrected Windows fixture and limits.
These source-version results do not replace final 0.2.0/0.5.0 candidate gates.

The current Claude client additionally reports a source-root CLAUDE.md context
advisory and an optional listing-icon advisory. Final audit must record their
source-versus-extracted-artifact disposition; native manifest success alone does
not mean all directory advisories are absent. No scope exclusion or publication
has been approved by these checks.


User scope confirmation: explicitly include grey-matter 54, 55, 63 and tkt 210
before staging. This supersedes the earlier deferral question; no deferral of those
four is authorized. Staging still waits for all remaining release gates.

Review sequencing (user direction, 2026-10-23): follow the plan's
[review order and evidence reuse](../docs/agents/proposals/09-release-readiness.md#review-order-and-evidence-reuse).
Resolve the design/runtime uncertainties and integrated publication review in 68
before preparing final candidates. This ticket audits frozen candidates after
67/69; it does not repeatedly commission broad reviews of intermediate components.
Track each remediation's evidence impact and repeat the affected gates, preserving
the SHA attached to reusable source evidence. Changed candidate identities require
new bound artifacts and receipts. Complete technical corrections before final
prose review and staging in 71.

## Cleanup role-review follow-up (2026-10-23)

Fresh read-only review covered grey-matter GLOSSARY/AGENTS and tkt AGENTS; all
12 AGENTS Markdown link occurrences resolved. During final documentation audit:
make the glossary's ambiguous ADR 0002 pointer explicit; route procedural glossary
clauses to their existing skill owners; clarify that tkt Rust-check exemptions
retain applicable Node/generation checks; reconcile the stale Claude "only after
release" update assertion with main-backed marketplace behavior. These are bounded
documentation findings, not evidence that final release gates have passed.

## Frozen replacement audit checkpoint (2026-10-24)

The [final candidate audit](../docs/agents/research/final-release-audit-20261024.md) is committed at `3673e6f`. Current candidates are grey-matter `e071b7b03d02025dc1af6c3ff2c4f8369f777587` and tkt `2b6ff173993c9fe413c40287fb1cb3f0a9879ca1`. Both pass product/native verification and all six install/upgrade probe groups. Hosted grey-matter run 40085165446 and tkt CI 40085001417 pass Windows/Linux gates; tkt build-only run 40085017493 supplies 16 provenance-verified assets. The downloaded ARM64 macOS binary reports the exact candidate identity; crate VCS/exclusions pass.

Independent primary-source reviews are retained with a complete sealed-file comparison: replacement manifests, marketplaces, skills, sidecars, hooks and legal bytes are unchanged. Parser/resource remediation 76 is closed and all three grey archives contain the formerly omitted evidence JSON. Individual ticket dispositions are recorded in the audit evidence; all four explicitly required features and mandatory 60/64 remain done. Six minor prose-review findings were corrected.

One decision remains: native vendor loading/upgrades were executed on macOS, while Windows/Linux have product/deploy/hook-fixture coverage. A user coverage decision is pending under acceptance criterion 4; no platform-approval, final-audit or staging receipt has been granted. The staged companion install guide must register/install the tkt package before grey-matter and distinguish the separate CLI prerequisite. Do not replace the successful dependency-first probes with the inconclusive compact-README fresh-home timeout.

## Native machine handoff (2026-10-24)

The user will run native platform validation on the respective machines. [Windows 77](77-windows-native-candidate-validation.md) and [Linux 78](78-linux-native-candidate-validation.md) are independent high-priority frontier tickets and now block this audit. This replaces the pending coverage-waiver question with evidence collection; no exclusion was approved. Both tickets bind the current exact candidates, durable inputs, platform runbooks, isolation limits and five evidence criteria. Reconcile their reports before granting platform-approval or closing 70.

## Linux native coverage verified (2026-10-24)

SSH validation on `sam@randomserver` passes for the current exact candidates: two full product gates, six native plugin rows, six catalog/upgrade groups, and the actual CI Linux release binary. See the [Linux report](../docs/agents/research/linux-native-validation-20261024.md) and its structured/raw evidence. Disposable user/config roots were used; network isolation was not enforceable and is reported explicitly. Windows 77 remains outstanding. This evidence does not grant final-audit/staging/publication gates or authorize a Windows exclusion.

## Windows native evidence checkpoint (2026-10-24)

[SharkTank evidence](../docs/agents/research/windows-native-validation-20261024.md) records successful exact-candidate product gates, six native package rows, five complete harness groups and fixture-scoped Codex state controls. Windows 77 stays in progress: Codex's Known Folder user root exposes 48 external skills and prevents a full isolated catalog assertion. Complete that check under a clean Windows profile or record an explicitly approved fixture-scope exclusion; no decision has been granted. The report also captures initial Kiro metadata exposure, corrected KIRO_HOME isolation, reviewed old Windows copies, the pinned AGY launcher and exact native test skips. This is partial platform evidence, not a platform-approval or final-audit receipt.

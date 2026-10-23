---
id: "70"
title: "Audit both projects before release staging"
status: open
blocked_by: ["64", "60", "65", "66", "67", "68", "69"]
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

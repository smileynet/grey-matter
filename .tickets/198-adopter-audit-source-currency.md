---
id: "198"
title: "Establish source identity before diagnosing adopter gaps"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "An adoption audit records repository identity and inspected revision plus available upstream or cited-reference evidence before diagnosing gaps"
  - "Stale or unverifiable local snapshots yield qualified observations rather than current nonconformance claims"
  - "Reviewed scenarios cover a current pinned source and an old checkout missing the cited implementation without automatic fetch or phase changes"
tags: ["stream:tooling", "type:chore"]
---

# Establish source identity before diagnosing adopter gaps

## Intent source

User requested on 2026-11-02: file tickets and address the current session retrospective findings.
See [delivery and wrap evidence](../docs/agents/research/test-verification-delivery-20261102.md).
This is prevention work; native parser/fixture and ephemeral-citation repairs are already landed.

## What to build

Add a compact source-currency preflight to the existing conformance audit owner. Record target identity and revision, reference revision when supplied, and locally available upstream evidence. If a cited implementation is absent or currency is unknown, qualify the snapshot and seek an authorized current source before generalizing. No automatic network fetch, clone, time-based stale threshold, phase change or mandatory new script. Existing #164 owns actual consumer migrations.

## Context

Read skills/meta/conformance-audit/SKILL.md, current local-gates guidance and the originating session findings.
Related open work #149/#146/#164 retains its broader original scope and is not closed by this task.

## Acceptance criteria

- [x] An adoption audit records repository identity and inspected revision plus available upstream or cited-reference evidence before diagnosing gaps.
- [x] Stale or unverifiable local snapshots yield qualified observations rather than current nonconformance claims.
- [x] Reviewed scenarios cover a current pinned source and an old checkout missing the cited implementation without automatic fetch or phase changes.

## Verification

Independent critic review of the guidance and scenario outcomes; syntax fixtures and required repository gates.
No live consumer, provider, device or rendered dashboard result is claimed by this guidance change.

## Implementation and evidence — 2026-11-02

Source `6bb7283` implements this scoped guidance change. Independent critic Spec and
Standards review accepted it without findings. Scenario evidence is recorded below as manual
review, not automated agent-compliance proof. `node --test scripts/skill-syntax.test.mjs`
passed 10/10, no skips. Docs consistency passed for 50 skills. Root pre-merge with syntax
fixtures and agent-guidance explicitly included passed 3/3 (0.3/1.1/1.9 s; dashboard-contract
selected by scope). The push hook passed 5/5. `node scripts/deploy.mjs check` and default
deployment passed, installing 50 skills; the optional logo notice is informational.
No global policy, adopter runtime, provider, device or rendered-dashboard state changed.
Temporary ticket helpers/indexes are recycled after closure/publication; the current
deployment package is retained until the next deployment. Prior platform evidence keeps its
separate documented lifecycle. Broader #149/#146/#164 remain open.

## Resolution (2026-11-03)

done: accepted retro prevention guidance implemented in its existing owner, independently reviewed, verified, pushed and deployed. Manual scenario review is distinguished from runtime evidence; no duplicate repair ticket or new approval gate.

### Verification
1. ✓ An adoption audit records repository identity and inspected revision plus available upstream or cited-reference evidence before diagnosing gaps — "Conformance preflight records target repository identity, inspected revision, supplied comparison/cited revision and locally verifiable relation plus available upstream evidence before current nonconformance claims."
2. ✓ Stale or unverifiable local snapshots yield qualified observations rather than current nonconformance claims — "Old checkout missing a later cited implementation is snapshot-limited, not proof of current product defect. Unknown upstream/currency is explicit; pinned source is not runtime validation."
3. ✓ Reviewed scenarios cover a current pinned source and an old checkout missing the cited implementation without automatic fetch or phase changes — "Manual scenarios reviewed: current pinned source; stale local missing cited implementation; no upstream and unverifiable relation; missing phase/release activity. Already-authorized current sources may be read; no implied fetch, clone, age heuristic or phase change. Critic accepted."

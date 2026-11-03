---
id: "198"
title: "Establish source identity before diagnosing adopter gaps"
status: open
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

- [ ] An adoption audit records repository identity and inspected revision plus available upstream or cited-reference evidence before diagnosing gaps.
- [ ] Stale or unverifiable local snapshots yield qualified observations rather than current nonconformance claims.
- [ ] Reviewed scenarios cover a current pinned source and an old checkout missing the cited implementation without automatic fetch or phase changes.

## Verification

Independent critic review of the guidance and scenario outcomes; syntax fixtures and required repository gates.
No live consumer, provider, device or rendered dashboard result is claimed by this guidance change.

---
id: "79"
title: "Decide repository artifact hygiene scope and invocation"
status: open
blocked_by: []
validation_criteria:
  - "A committed proposal identifies one owner for artifact classification and existing report/Git/doc owners."
  - "The ticket records the approved invocation and offline report retention contract before implementation starts."
tags: ["type:decision", "stream:tooling"]
---

# Decide repository artifact hygiene scope and invocation

## What to build

Intent source: the user requested a grey-matter proposal after a storage analysis
found repeated generated evidence mixed with source assets. Review
[proposal 10](../docs/agents/proposals/10-repository-artifact-hygiene.md) and decide
whether to adopt the narrow `repository-artifact-hygiene` workflow.

Confirm invocation by user and model, staged-candidate inspection by default,
and the revised offline/inline/bundle report contract before implementation.
Existing format, placement, curation, Git and provider-access owners keep their
boundaries. This ticket is deliberately parked pending that decision.

## Context

Read the proposal, `docs/agents/report-format.md`, and
`skills/meta/adopt-project/references/repo-hygiene.md`. The proposal replaces
binary-implies-LFS advice and resolves generated inline payload retention without
banning useful self-contained deliverables. A separate
[billing access reference](../docs/agents/research/github-billing-access.md)
captures provider-specific permission interpretation, not storage policy.

No skill, detector, hook, project migration, history rewrite, billing change or
deletion is authorized by this proposal-only task. Approved implementation can
be decomposed after the scope decision.

## Acceptance criteria

- [x] A committed proposal identifies classification ownership and the existing report, Git and document owners.
- [ ] Record the user's approved invocation and offline report retention contract before implementation starts.

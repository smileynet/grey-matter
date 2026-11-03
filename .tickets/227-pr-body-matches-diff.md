---
id: "227"
title: "Explore a check that the PR body matches the diff on every revision"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Sample 3+ past PR bodies against their final diffs; count stale or unmapped claims. If zero, consider rejecting."
  - "If a script is proposed: test it on those samples for false positives and missed claims before wiring it into any gate (local-gates admission rules)."
  - "Resolution records adopt/adapt/reject."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore a check that the PR body matches the diff on every revision

## Finding

The pr skill forbids composed evidence, but nothing verifies Summary/Evidence claims against the actual diff after later revisions. Kiro Crew (prior art) rewrites the description on every revision and runs a CI check that it matches the code.

Candidate change: the pr skill regenerates the body per revision and maps each claim to a hunk or run output, dropping unmapped claims. Optionally a mechanical script checks that named files/symbols exist in the diff.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Sample 3+ past PR bodies against their final diffs; count stale or unmapped claims. If zero, consider rejecting.
- [ ] If a script is proposed: test it on those samples for false positives and missed claims before wiring it into any gate (local-gates admission rules).
- [ ] Resolution records adopt/adapt/reject.

Related: pr skill, repo-pr-conventions.md.

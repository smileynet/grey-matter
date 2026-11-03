---
id: "229"
title: "Explore running the pre-merge gate in GitHub CI with fast checks first"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Read #152 and local-gates.md; record whether hosted CI was deliberately excluded and why. If so, the default is reject unless new evidence appears."
  - "If explored: a draft workflow on a branch runs pre-merge on one PR; record runtime, flakiness and the Windows/Linux differences."
  - "Resolution records adopt/adapt/reject."
tags: ["type:research", "stream:tooling", "triage:ready-for-agent"]
---

# Explore running the pre-merge gate in GitHub CI with fast checks first

## Finding

Gates are local and opt-in (core.hooksPath). The two GitHub workflows (cargo-boundary-probe, platform-validation) don't run gate.mjs pre-merge, so external PRs and agents have no remote verdict. Kiro Crew (prior art) runs everything in CI with a cheap fast gate first and slow checks only after it passes, and moved some workloads off GitHub to avoid rate limits.

Note: #152 recorded "hosted CI on every push" as a finding to avoid, so this may conflict with a deliberate decision.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Read #152 and local-gates.md; record whether hosted CI was deliberately excluded and why. If so, the default is reject unless new evidence appears.
- [ ] If explored: a draft workflow on a branch runs pre-merge on one PR; record runtime, flakiness and the Windows/Linux differences.
- [ ] Resolution records adopt/adapt/reject.

Related: #152, #223.

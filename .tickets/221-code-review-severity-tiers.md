---
id: "221"
title: "Explore severity tiers and an evidence bar for blocking code-review findings"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Gap confirmed, partial or rejected against current code-review, reviewer-brief and #92, with evidence."
  - "At least two past diffs re-reviewed with the tiered brief; findings count, blocking count and ticket count compared against the current brief."
  - "If adopted: one definition of blocking, referenced (not restated) by reviewer-brief; skill-syntax and doc-links gates pass."
  - "Resolution records adopt/adapt/reject and why."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore severity tiers and an evidence bar for blocking code-review findings

## Finding

code-review files every finding worth acting on as a ticket and splits Standards findings into hard vs judgement, but it has no blocking/advisory/nit tier. Only orchestrate/references/reviewer-brief.md defines blocking (concrete trigger + observable wrong outcome).

Kiro Crew (prior art): every finding gets a severity. Blocking requires location, quoted evidence, trigger and consequence; anything else is advisory. Design concerns block only for one-way doors. Nits become batched follow-ups.

Candidate change: add `severity: blocking | advisory | nit` to both sub-agent briefs, move the blocking definition into code-review (reviewer-brief links to it), and batch nits into one follow-up ticket per review.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Gap confirmed, partial or rejected against current code-review, reviewer-brief and #92, with evidence.
- [ ] At least two past diffs re-reviewed with the tiered brief; findings count, blocking count and ticket count compared against the current brief.
- [ ] If adopted: one definition of blocking, referenced (not restated) by reviewer-brief; skill-syntax and doc-links gates pass.
- [ ] Resolution records adopt/adapt/reject and why.

Related: #92 (critic verdict gaps), #46 (crew-research review nuggets).

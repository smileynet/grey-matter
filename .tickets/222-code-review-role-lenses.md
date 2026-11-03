---
id: "222"
title: "Explore design / first-principles / UX review lenses for consequential diffs"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Check overlap first: does Spec already cover first-principles, and does codebase-design / improve-codebase-architecture cover design? Record the result."
  - "Run the lenses on 2+ past consequential diffs; count findings unique to each lens compared with Standards+Spec, and the false positives."
  - "Adopt only lenses that surface unique, confirmed findings; record cost (time/tokens) per lens."
  - "Resolution records adopt/adapt/reject per lens."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore design / first-principles / UX review lenses for consequential diffs

## Finding

code-review has two axes (Standards, Spec) plus an optional cross-family Standards pass. Kiro Crew (prior art) splits review by role: design (fits the architecture? a much simpler option?), first-principles (root cause? does the user need it?), UX, and reviewers from different model families.

Candidate change: optional lens briefs in code-review/references/lenses.md, used only when implement classifies the change as consequential. Each reports under its own heading, with no reranking across axes. A game UX lens pairs with rubric-game.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Check overlap first: does Spec already cover first-principles, and does codebase-design / improve-codebase-architecture cover design? Record the result.
- [ ] Run the lenses on 2+ past consequential diffs; count findings unique to each lens compared with Standards+Spec, and the false positives.
- [ ] Adopt only lenses that surface unique, confirmed findings; record cost (time/tokens) per lens.
- [ ] Resolution records adopt/adapt/reject per lens.

Related: #02 (game-centric lenses).

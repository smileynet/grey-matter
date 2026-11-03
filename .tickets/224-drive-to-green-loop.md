---
id: "224"
title: "Explore a bounded drive-to-green loop (prepare-pr equivalent) in implement"
status: open
blocked_by: ["223"]
priority: medium
validation_criteria:
  - "Read Kiro Crew's prepare-pr skill source; list what needs GitHub CI and what doesn't apply to local gates."
  - "Pilot on 2+ real tickets: rounds to green, findings fixed vs rejected, wall time, and whether the final diff stayed in scope."
  - "Confirm the loop never edits outside the ticket and respects provider limits/escalation.md."
  - "Resolution records adopt/adapt/reject, the chosen round cap and why."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore a bounded drive-to-green loop (prepare-pr equivalent) in implement

## Finding

implement runs gates and review, but nothing loops "read verdict, fix real findings or rebut with evidence, rerun" until green. Kiro Crew (prior art) ships a `prepare-pr` skill that does this until the readiness verdict is green.

Candidate change: a loop section in implement (or a new skill), capped at N rounds (start at 3). For each finding: fix, or mark it rejected with evidence (code-review already treats findings as hypotheses). Stop on green or at the cap, and report.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Read Kiro Crew's prepare-pr skill source; list what needs GitHub CI and what doesn't apply to local gates.
- [ ] Pilot on 2+ real tickets: rounds to green, findings fixed vs rejected, wall time, and whether the final diff stayed in scope.
- [ ] Confirm the loop never edits outside the ticket and respects provider limits/escalation.md.
- [ ] Resolution records adopt/adapt/reject, the chosen round cap and why.

Blocked by #223. Related: #225.

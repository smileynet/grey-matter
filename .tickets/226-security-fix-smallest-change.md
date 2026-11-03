---
id: "226"
title: "Explore a smallest-change rule for security findings"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "Search past review findings/tickets for security over-correction in this repo; record whether it has happened."
  - "Check the rule doesn't conflict with escalation.md (never bypass a security finding) or data-modeling's trust-boundary guidance."
  - "If adopted: re-run one past security-related review with the rule and compare."
  - "Resolution records adopt/adapt/reject."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore a smallest-change rule for security findings

## Finding

Kiro Crew (prior art): AI over-corrects on security (extra layers, new flags, validation that never runs). Their rule: fix the actual user-reachable problem with the smallest change; anything beyond that is a follow-up.

Candidate change: one line in the code-review Standards brief and rubric-app.md.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Search past review findings/tickets for security over-correction in this repo; record whether it has happened.
- [ ] Check the rule doesn't conflict with escalation.md (never bypass a security finding) or data-modeling's trust-boundary guidance.
- [ ] If adopted: re-run one past security-related review with the rule and compare.
- [ ] Resolution records adopt/adapt/reject.

Related: #221.

---
id: "228"
title: "Explore feature sizing (simple/medium/complex) at triage"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "Check whether to-spec / grilling / compass routing already does this implicitly; record the overlap."
  - "Retro-classify 10+ recent tickets; check whether size predicted rework or reopened tickets."
  - "Check the tag discipline in tkt-conventions (single-select, interim rules, #04) before adding an axis."
  - "Resolution records adopt/adapt/reject."
tags: ["type:research", "stream:skills-review", "triage:ready-for-agent"]
---

# Explore feature sizing (simple/medium/complex) at triage

## Finding

triage assigns kind and readiness but not size. Kiro Crew (prior art): when code is cheap, saying yes is too easy, so every request is sized first. Simple is built directly, medium needs a one-page design, complex needs a team review.

Candidate change: a `size:` axis in tkt-conventions; triage routes medium to to-spec and complex to grilling + human review.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Check whether to-spec / grilling / compass routing already does this implicitly; record the overlap.
- [ ] Retro-classify 10+ recent tickets; check whether size predicted rework or reopened tickets.
- [ ] Check the tag discipline in tkt-conventions (single-select, interim rules, #04) before adding an axis.
- [ ] Resolution records adopt/adapt/reject.

Related: #04.

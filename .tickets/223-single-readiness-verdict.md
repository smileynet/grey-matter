---
id: "223"
title: "Explore a single readiness verdict (gate.mjs verdict) that means every expected check ran and passed"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Confirm whether gate.mjs already reports this, partly or fully (read source + tests)."
  - "Test-first: fixtures for all-pass, one-fail, one-skip, one-timeout and empty-selection; the verdict is PASS only for all-pass."
  - "Run against the real repo on a clean and a dirty tree; paste real output."
  - "If adopted: implement and pr cite the verdict at close; consequential change, so full code-review."
tags: ["type:research", "stream:tooling", "triage:ready-for-agent"]
---

# Explore a single readiness verdict (gate.mjs verdict) that means every expected check ran and passed

## Finding

gate.mjs runs stages, but there is no single verdict an agent and a human both read as "done". Kiro Crew (prior art) rolls 80+ checks into one PR Readiness verdict that means every expected check ran AND passed. That matters because "no failures" and "nothing ran" look the same.

Candidate change: `node scripts/gate.mjs verdict <stage>` prints PASS/NOT-READY plus reasons. A skipped, unavailable, timed-out or not-selected check is NOT-READY. This matches the verification values in orchestrate/references/outcome-contract.md.

Source: Kiro Crew, "Keeping a software factory stable at 1,000 PRs a week" (A to Z / Software@, 2026-11-03) and repo at github.com/kirodotdev/KiroCrew. Prior art, not authority (AGENTS.md): cite as "Kiro Crew does X (prior art); grey-matter chose Y".

## Approach: explore and test, don't adopt

This is a **hypothesis from prior art**, not a decided change. Before editing any skill:

1. **Check current behaviour.** Read the owning skill(s) and docs/agents/ references, and search closed tickets for an earlier decision. Record whether the gap is real, partial or already covered.
2. **Compare with the source.** Read the matching Kiro Crew workflow/prompt in the repo, not just the article summary. Note what depends on their setup (GitHub CI, open-source fork model, 100 PRs/day) and won't carry over.
3. **Test it before changing it.** Run a small experiment: replay one or two past diffs/sessions from this repo with and without the change, and compare the outcome (findings, rounds, tickets filed, false positives). A prose-only change still needs a before/after comparison on a real case.
4. **Decide.** Adopt, adapt, or reject, with evidence in the resolution. Rejecting with evidence is a valid close.

## Acceptance criteria

- [ ] Confirm whether gate.mjs already reports this, partly or fully (read source + tests).
- [ ] Test-first: fixtures for all-pass, one-fail, one-skip, one-timeout and empty-selection; the verdict is PASS only for all-pass.
- [ ] Run against the real repo on a clean and a dirty tree; paste real output.
- [ ] If adopted: implement and pr cite the verdict at close; consequential change, so full code-review.

Related: #152 (scoped commit gates). Prerequisite for #224.

---
id: "223"
title: "Explore a single readiness verdict (gate.mjs verdict) that means every expected check ran and passed"
status: done
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

- [x] Confirm whether gate.mjs already reports this, partly or fully (read source + tests).
- [x] Test-first: fixtures for all-pass, one-fail, one-skip, one-timeout and empty-selection; the verdict is PASS only for all-pass.
- [x] Run against the real repo on a clean and a dirty tree; paste real output.
- [x] If adopted: implement and pr cite the verdict at close; consequential change, so full code-review.

Related: #152 (scoped commit gates). Prerequisite for #224.

## Resolution (2026-11-25)

done: Kiro Crew rolls checks into one PR Readiness verdict (prior art); grey-matter chose node scripts/gate.mjs verdict <stage> (runner v6) emitting PASS only when >=1 check ran with zero skips/fails/timeouts/infra errors. Full two-axis code review completed, implement/pr/AGENTS.md updated, scratch review patch deleted.

### Verification
1. ✓ Confirm whether gate.mjs already reports this, partly or fully (read source + tests). — "Confirmed gap directly in scripts/gate.mjs (v5) and scripts/gate.test.mjs: bare stage runs exited 0 on empty selection and SKIP overrides with no single PASS/NOT-READY readiness line"
2. ✓ Test-first: fixtures for all-pass, one-fail, one-skip, one-timeout and empty-selection; the verdict is PASS only for all-pass. — "TDD RED->GREEN in scripts/gate.test.mjs (35 pass / 0 fail / 1 Win-only skip): isolated fixtures for all-pass, one-fail, one-skip, one-timeout, one-infra, and empty-selection; PASS only on all-pass"
3. ✓ Run against the real repo on a clean and a dirty tree; paste real output. — "Real-repo probes: clean tree df92e73 -> 'verdict pre-push: PASS (7 of 7 selected check(s) ran and passed)' and 'verdict pre-merge: PASS (3 of 3 selected check(s) ran and passed)'; dirty tree 07fb5ed -> 'verdict pre-push: PASS (8 of 8 selected check(s) ran and passed; committed HEAD only, uncommitted changes not checked)'"
4. ✓ If adopted: implement and pr cite the verdict at close; consequential change, so full code-review. — "Adopted and cited in implement/SKILL.md, pr/SKILL.md, AGENTS.md, docs/agents/local-gates.md, and tool-scripts.md; parallel Standards + Spec code-review completed and findings resolved in 07fb5ed; .scratch/review-223.patch deleted"

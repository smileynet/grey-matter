---
id: "170"
title: "Spike: fast models for doc edits, triage and changelog classification"
status: done
blocked_by: ["174", "199"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note."
  - "A recommendation for this task class: the cheapest tier that met the bar, or \"keep the default\", folded into the Which model for what table in models-and-usage.md."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
assignee: "codex"
---

# Spike: fast models for doc edits, triage and changelog classification

## What to build

Run fast and mid tiers on doc rewrites to the repo's writing rules, ticket triage into the triage roles, and classifying harness changelog entries for the harness-changelog skill. Compare tiers within each provider using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what), with one cheap or fast tier against the default per provider that is available: Anthropic, OpenAI, Kiro, Google. Use fixed task fixtures so runs are comparable. Record pass rate, defects found or missed, wall time, and usage spent from the provider's usage check. Never move work between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Which of these routine text tasks can a fast tier do with no quality loss a reviewer can find?

## Acceptance criteria

- [x] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [x] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [x] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

Freeze input documents/tickets/changelog fragments and the grading rubric before runs. Separate mechanical classification errors from style judgments, and grade without tier labels where supported. Do not mutate real tickets or publish real user messages while scoring fixtures.

## Resolution (2026-11-03)

done: compared routine text tasks with blind reviews; no profile met all three tasks, so keep provider defaults. Preserved evidence and provenance limits, verified exact-session cleanup and immutable protocol, merged and pushed accepted source with scoped baseline gate exceptions. Private artifacts retained through remaining model trials and integration audits.

### Verification
1. ✓ A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note. — "Dated results and per-cell hashes: docs/agents/research/model-task-tiers-20261103.md and t170-results-evidence-20261103.json; 18 native complete, blind reviews 7 pass/11 fail, no profile3/3; independent final review aeba3e32. Parent node scripts/gate.mjs pre-merge --base origin/main --include skill-syntax-fixtures at7ea5758:22pass,2documented baseline SKIPs gate-runner/artifact-hygiene (unchanged-origin timeout proof orchestration-gate-baseline-20261103.json); compatibility passed7.3s and model-text-fixtures passed1.2s. No coverage claimed for two skipped suites."
2. ✓ A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md. — "models-and-usage.md text-task row and dated evidence retain configured defaults; independently accepted guideD468150E. Requested cheap Codex2/3 is not model qualification; served identity/cost unknown. Pre-push7/7 and pushhook7/7 passed; deploy --no-agy installed50skills;7ea5758 pushed."
3. ✓ Settings changed for the spike restored or recorded; sandbox folders removed. — "Independently audited cleanup8222d67:6exactKiroV2sessions absent after successful deletion,7600nontarget ID/source pairs unchanged;6executionCWDs alreadyabsent. Immutable protocol restored byte-exactD49E, fresh private-key-absent7/7 tests passed. Promoted reports/evidence/audits; retain private keys/raw/reviews/listings and owned verification checkouts through remaining trials170-172 and integration audit, indexed in t170-private-artifact-index.json; no unrelated data deleted."

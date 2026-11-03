---
id: "168"
title: "Spike: cheap vs default models as reviewers catching planted defects"
status: done
blocked_by: ["174", "199"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note."
  - "A recommendation for this task class: the cheapest tier that met the bar, or \"keep the default\", folded into the Which model for what table in models-and-usage.md."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
---

# Spike: cheap vs default models as reviewers catching planted defects

## What to build

Give cheap and default tiers the same diffs to review, each with planted defects: an off-by-one, a missed requirement, a destructive step and an untested branch. Run each reviewer in a separate context with only the ticket and the diff. Compare tiers within each provider using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what), with one cheap or fast tier against the default per provider that is available: Anthropic, OpenAI, Kiro, Google. Use fixed task fixtures so runs are comparable. Record pass rate, defects found or missed, wall time, and usage spent from the provider's usage check. Never move work between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Which planted defects does each tier catch, and is a cheap reviewer ever good enough to gate a merge?

## Integration status (2026-11-03)

Results and independent audit are integrated: 14/23 attempts met strict JSON;
secondary blind scoring found the seeded defect in all 22 nonempty responses,
with nine unsupported claims and five duplicates. Current defaults are retained.
Exact Kiro sessions and empty working directories were removed; private evidence
is retained for the remaining trials. Accepted source is integrated and pushed.

Final pre-merge at `c917c8b`: 21 checks passed, with two documented baseline
skips (gate-runner and artifact-hygiene timed out on unchanged `origin/main`
`0604d8d`). Ticket compatibility passed without an override; review fixtures
passed in 3.7s. Pre-push and the push hook each passed all seven checks.
Skipped assertions remain unverified. The
[verification receipt](../docs/agents/research/evidence/orchestration-gate-baseline-20261103.json)
preserves the earlier failures, baseline proof and current outcomes.

## Acceptance criteria

- [x] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [x] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [x] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

Freeze diffs and answer keys; score defect recall and false positives separately. Keep the reviewer blind to tier labels where supported, and do not let the producer grade its own review. A successful tier result supports a recommendation only for the measured task/defect set.

## Resolution (2026-11-03)

done: published the bounded reviewer-tier comparison, blind-score summary and independent audit; keep current defaults for automated reviews. Semantic recall on four toy cases does not establish production reliability. Verification:21 pre-merge passes and2 baseline-supported skips, all pre-push checks passed. Exact native sessions and temporary workdirs removed; private evidence retained through169-172. No Google call, provider fallback or settings change.

### Verification
1. ✓ A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note. — "Final report model-tier-review-20261103-results.md and sanitized evidence cover23 attempts:14 strict JSON,22 nonempty responses with seeded defect and changed-line citation in secondary blind scoring,9 unsupported claims and5 duplicates. Independent auditd45c9d39 accepted sourcec632aafd and cleanup1f68547; original raw and blind-score hashes preserved. Eight Google cells blocked and one Claude cheap cell omitted; prior unintended-turn usage unknown, not a verified aggregate budget."
2. ✓ A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md. — "The Which model for what table and dated review section retain configured defaults. No cheaper profile completed all4 strict cases; requested Claude haiku served Sonnet5.5, Codex/Kiro actual identities unknown. Root shared guidance independently accepted3b2cb932/64ee3dfe. Final code pre-mergec917c8b:21 pass,2 explicit unchanged-origin baseline skips(gate-runner/artifact-hygiene); tkt compatibility passed. Pre-push7/7 and scoped metadata gates passed; accepted source pushed."
3. ✓ Settings changed for the spike restored or recorded; sandbox folders removed. — "No global model, effort or permission configuration changed. All8 captured Kiro V2 sessions deleted and absent,7599 non-target sessions preserved. All23 recursively verified empty temp CWDs recycled and absent. Cleanup receipts independently audited; private raw/scoring/key/ledger148 files7219659B retained through169-172 handoff. No raw responses, map or session IDs promoted."

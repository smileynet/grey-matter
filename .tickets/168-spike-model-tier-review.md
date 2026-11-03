---
id: "168"
title: "Spike: cheap vs default models as reviewers catching planted defects"
status: in_progress
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
is retained for the remaining trials. Closure awaits repository gates: artifact
hygiene exceeded its 120s budget despite isolated assertion passes, and a fresh
full run also timed out in runner fixtures. Parent is continuing independent
work and withholding push/closure; no timeout is treated as a pass.

## Acceptance criteria

- [ ] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [ ] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [ ] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

Freeze diffs and answer keys; score defect recall and false positives separately. Keep the reviewer blind to tier labels where supported, and do not let the producer grade its own review. A successful tier result supports a recommendation only for the measured task/defect set.

---
id: "167"
title: "Spike: cheap vs default models as implementation workers on well-specified tickets"
status: in_progress
blocked_by: ["174", "199"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note."
  - "A recommendation for this task class: the cheapest tier that met the bar, or \"keep the default\", folded into the Which model for what table in models-and-usage.md."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
---

# Spike: cheap vs default models as implementation workers on well-specified tickets

## What to build

Run cheap and default tiers as implementation workers on well-specified tickets: the spike-0 fixture's T1-T4, plus two tickets with a planted trap (an ambiguous name, a test that only passes for the wrong reason). Compare tiers within each provider using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what), with one cheap or fast tier against the default per provider that is available: Anthropic, OpenAI, Kiro, Google. Use fixed task fixtures so runs are comparable. Record pass rate, defects found or missed, wall time, and usage spent from the provider's usage check. Never move work between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Does the cheap tier land small, well-specified tickets as reliably as the default, and where does it fail first?

## Acceptance criteria

- [ ] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [ ] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [ ] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

Keep ordinary well-specified cases separate from deliberately ambiguous/trap cases. Freeze fixture revision, model identity, effort and grading before each comparison; report requested versus observed model separately. Never expose hidden tests or answer keys to workers, and report unavailable usage counters as unknown.

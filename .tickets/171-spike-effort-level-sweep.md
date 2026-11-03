---
id: "171"
title: "Spike: effort levels (low to max) on one model per provider for diagnosis and design tasks"
status: in_progress
blocked_by: ["174", "199"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A results table per available provider with one fixed model, advertised effort level, fixture outcome, time, usage and repeat count."
  - "An evidence-bounded effort recommendation per measured task/model, or keep the current default, recorded in models-and-usage.md without silently changing user settings."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
assignee: "codex"
---

# Spike: effort levels (low to max) on one model per provider for diagnosis and design tasks

## What to build

Hold one model fixed per available provider and sweep its advertised effort
levels on a hard-bug diagnosis fixture and a design question with a known answer.
Use [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what)
to identify supported settings at run time. Keep task, model and harness fixed
within each sweep; record repeat count, quality outcomes, wall time and measured
usage. This compares effort levels, not different model tiers. Never move work
between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Where does extra effort stop paying for itself on each provider, and is the harness default level the right one for orchestration and review?

**Historical question (2026-11-01):** ticket 127 recorded Luna/low for Codex
subagents and a conflicting higher-effort recommendation. Re-read the installed
model catalog and current settings before testing; this ticket does not claim
those earlier settings remain active. Recommend a setting from measured results;
the user has not authorized changing defaults as part of reconciliation.

## Acceptance criteria

- [ ] A results table per available provider records one fixed model, advertised effort level, fixture outcome, time, usage and repeat count; unavailable cells are explicit.
- [ ] An evidence-bounded effort recommendation per measured task/model, or keep the current default, is recorded in models-and-usage.md without silently changing user settings.
- [ ] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

This is a within-model effort sweep, not another cheap-versus-default model comparison. Hold the selected model, fixtures and harness fixed; run only advertised effort levels and record unsupported levels. The earlier Luna/low setting is historical context, not an instruction to change current defaults; any adopted default needs an explicit supported decision.

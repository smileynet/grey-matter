---
id: "172"
title: "Spike: Claude Code fast mode speed, quality and credit cost on orchestrate workers"
status: open
blocked_by: ["174"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A Claude Code fast-mode on/off table holds model, effort and fixtures fixed and records quality, elapsed time, repeat count and measured usage or its explicit absence."
  - "A measured recommendation on fast mode for this worker task is recorded in models-and-usage.md; unsupported entitlement or missing cost attribution remains explicit."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
---

# Spike: Claude Code fast mode speed, quality and credit cost on orchestrate workers

## What to build

Run Claude Code workers with supported fast mode on and off, holding the model,
effort and fixtures fixed. Verify the installed invocation and entitlement first.
Record repeat count, quality outcomes, elapsed time and the provider's actual
usage/cost signals, using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what).
This is an on/off comparison within Claude Code, not a cross-provider tier grid.
Never move work between providers to finish a run
([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** How much faster is it, does quality change, and which usage bucket
is actually billed? Record unknown attribution rather than deriving cost from
wall time or assuming an earlier billing rule remains current.

## Acceptance criteria

- [ ] A Claude Code fast-mode on/off table holds model, effort and fixtures fixed and records quality, elapsed time, repeat count and measured usage or its explicit absence.
- [ ] A measured recommendation on fast mode for this worker task is recorded in models-and-usage.md; unsupported entitlement or missing cost attribution remains explicit.
- [ ] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

This spike is Claude Code fast-mode on/off only, using the same supported model, effort and fixtures; it is not the cross-provider cheap/default matrix copied into the original brief. Confirm entitlement and current billing/usage signals before spending, use no provider fallback, and report missing credit attribution as unknown.

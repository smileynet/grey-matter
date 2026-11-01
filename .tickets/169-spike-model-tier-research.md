---
id: "169"
title: "Spike: fast models for read-only research and codebase exploration fan-out"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: fast models for read-only research and codebase exploration fan-out

## What to build

Run fast tiers on read-only research and exploration: find every caller of a function, summarize a module, answer a question from cited docs. Compare against the default on the same questions. Compare tiers within each provider using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what), with one cheap or fast tier against the default per provider that is available: Anthropic, OpenAI, Kiro, Google. Use fixed task fixtures so runs are comparable. Record pass rate, defects found or missed, wall time, and usage spent from the provider's usage check. Never move work between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Are fast tiers accurate enough for exploration fan-out, judged by recall against a known answer key and citation accuracy?

## Acceptance criteria

- [ ] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [ ] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [ ] Settings changed for the spike restored or recorded; sandbox folders removed.

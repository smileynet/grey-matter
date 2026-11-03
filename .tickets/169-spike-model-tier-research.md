---
id: "169"
title: "Spike: fast models for read-only research and codebase exploration fan-out"
status: done
blocked_by: ["174", "199"]
tags: ["stream:orchestration", "type:research"]
validation_criteria:
  - "A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note."
  - "A recommendation for this task class: the cheapest tier that met the bar, or \"keep the default\", folded into the Which model for what table in models-and-usage.md."
  - "Settings changed for the spike restored or recorded; sandbox folders removed."
---

# Spike: fast models for read-only research and codebase exploration fan-out

## What to build

Run fast tiers on read-only research and exploration: find every caller of a function, summarize a module, answer a question from cited docs. Compare against the default on the same questions. Compare tiers within each provider using [models and usage](../docs/agents/harness-surfaces/models-and-usage.md#which-model-for-what), with one cheap or fast tier against the default per provider that is available: Anthropic, OpenAI, Kiro, Google. Use fixed task fixtures so runs are comparable. Record pass rate, defects found or missed, wall time, and usage spent from the provider's usage check. Never move work between providers to finish a run ([provider switching](../docs/agents/provider-switching.md)).

Prior art to borrow techniques from (not authority): [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#techniques-by-spike).

**Question:** Are fast tiers accurate enough for exploration fan-out, judged by recall against a known answer key and citation accuracy?

## Acceptance criteria

- [x] A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note.
- [x] A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md.
- [x] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

Use a fixed caller/citation answer key and score missing callers, invented callers and unsupported citations separately. A readable summary alone is not accuracy evidence. Keep source access identical across compared tiers.

## Resolution (2026-11-03)

done: published bounded research-profile results and independent audits; keep configured defaults. The study has11 scored passes,2 scored failures and5 unscorable results; unknown served identities and producer-transcribed reviewer traces limit conclusions. Exact native sessions and empty working directories removed, private evidence retained through169-172. Current verification21 pre-merge passes plus2 baseline-supported skips, fresh offline fixtures and all pre-push checks passed. No Google call, retry, provider substitution or settings change.

### Verification
1. ✓ A results table per provider (tier, pass or fail per fixture, time, usage spent), as a dated section in a research note. — "Final model-tier-research-20261102.md records18 native cells:13 valid blind grade receipts(11 pass,2 fail),5 unscorable(2 missing reviewer provenance,3 invalid receipts), with per-cell time/model/native usage. Independent scientific audit5100f56 and final cleanup auditfea43f76 accepted exact source8b67c3e and cleanupb29ac739. Eighteen raw receipts and input hashes matched;16 reviewer traces are producer-transcribed, not platform exports. No model-quality pass is inferred for unscorable cells."
2. ✓ A recommendation for this task class: the cheapest tier that met the bar, or "keep the default", folded into the Which model for what table in models-and-usage.md. — "models-and-usage.md research row and dated section retain configured defaults; exact shared guidanceSHA64ee3dfe independently accepted. Requested Codex cheap profile passed3 toy tasks but served identity is absent; no adoption claim. Parent fixed offline tests using public synthetic inputs without changing grader/controller/historical native bindings. Fresh source fixture11/11 pass; full pre-mergec917c8b21 pass plus2 documented unchanged-origin baseline skips, all pre-push checks passed; metadata pre-merge/pre-push also passed."
3. ✓ Settings changed for the spike restored or recorded; sandbox folders removed. — "No global settings changed. Exact cleanup plan05b777a8:6 captured Kiro V2 sessions deleted/absent and7599 non-target ID/source pairs unchanged, independently verified from recovered exact-hash listing payloads. All18 empty temp CWDs recycled and verified in Recycle Bin. Raw/key/review/protocol/provenance202 files434061B retained through169-172. Audit records a parser incident echoing unrelated listing metadata into a private tool trace; no raw listing/response or IDs were promoted or externally sent."

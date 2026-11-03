---
id: "171"
title: "Spike: effort levels (low to max) on one model per provider for diagnosis and design tasks"
status: done
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

- [x] A results table per available provider records one fixed model, advertised effort level, fixture outcome, time, usage and repeat count; unavailable cells are explicit.
- [x] An evidence-bounded effort recommendation per measured task/model, or keep the current default, is recorded in models-and-usage.md without silently changing user settings.
- [x] Settings changed for the spike restored or recorded; sandbox folders removed.

## Reconciliation (2026-11-02)

This is a within-model effort sweep, not another cheap-versus-default model comparison. Hold the selected model, fixtures and harness fixed; run only advertised effort levels and record unsupported levels. The earlier Luna/low setting is historical context, not an instruction to change current defaults; any adopted default needs an explicit supported decision.

## Resolution (2026-11-03)

done: ran bounded fixed-model effort sweep and documented incomplete quality evidence; keep current defaults. Preserved 1 valid pass and 10 unscorable review receipts without retries, unknown effort/cost and timeout limits. Parent integrated independently accepted code and sanitized final evidence, verified gates, pushed, and audited removal of20emptyworkingdirs. Private evidence retained through remaining model trials and integration audits.

### Verification
1. ✓ A results table per available provider with one fixed model, advertised effort level, fixture outcome, time, usage and repeat count. — "Results table docs/agents/research/model-effort-t171-results.md and evidence/model-effort-t171.json:13nativecalls,11complete2timeouts plus1consumedpre-spawnsetupfailure; requestedfixedmodels/efforts, per-celltime/usage/oneattempt and heldcells explicit.1validblindpass10protocol-unscorable (not model failures), independent audit2049e5f8 exacthashes52native+56reviewfiles/mappingsverified. Sourceparent1ec7cb8 fullpremerge23PASS2documentedbaselineSKIPs gate-runner/artifact-hygiene (orchestration-gate-baseline-20261103.json); compatibility6.7sPASS/model-effort.8sPASS; no coverage claimed for skipped suites."
2. ✓ An evidence-bounded effort recommendation per measured task/model, or keep the current default, recorded in models-and-usage.md without silently changing user settings. — "models-and-usage.md dated effort section retains currentdefaults; single requestedCodexmaxpass lacks servedmodel/actualeffort, actualeffort absentallcompletedcalls; no quality/effort causalclaim. Accepted code-only9340merged, only sanitizedfinaldoc/index/audit promoted; privatec023draft ancestry excluded verified. Prepush7/7+hook7/7PASS,deploy--no-agy50skillsPASS;1ec7cb8pushed."
3. ✓ Settings changed for the spike restored or recorded; sandbox folders removed. — "Independent cleanup audit verifies20/20authorizedemptyworkingdirs identity/containment matchedbeforeOSrecycle and sourcepathsabsentafter. Rawreceipt recordsoriginalpath/identity/operation; RecycleBindestinationIDsnotrecorded. Metadata258b1d8pushed after model-effort-fixturesPASS1.2s,prepush2/2+hook2/2PASS. No settingschanged. Promoted reports/path-freecleanup/index/audit; retain privatekey/rubric/native/reviewer/provenance and owned verification checkouts through remaining170-172trial integration/audits; no unrelated artifacts removed."

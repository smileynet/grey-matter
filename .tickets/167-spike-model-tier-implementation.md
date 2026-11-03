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

## Integration status (2026-11-03)

The results, independent audit, exact-session cleanup and public frozen fixtures
are integrated and pushed. The model guidance retains current defaults. The final
pre-merge run at `c917c8b` passed 21 checks and used two documented baseline skips:
gate-runner and artifact-hygiene reproduced timeouts on unchanged `origin/main`
`0604d8d`. Ticket compatibility passed without a skip. Pre-push passed all seven
checks; the push hook also passed seven. Skipped assertions remain unverified.
The [verification receipt](../docs/agents/research/evidence/orchestration-gate-baseline-20261103.json)
records the baseline, exact scope, failed attempts and current outcomes.

Earlier checks at `d5d5484` selected 22 checks;
19 passed and 3 timed out (gate-runner 123.9s, artifact-hygiene 124.9s,
tkt-usage-compatibility 32.9s). Model-eval passed in 28.2s after its measured
budget update. These earlier timeouts are historical evidence, not passes.

## Historical measurement check-in (2026-11-02; superseded by final results)

Claude's twelve planned cells completed; final independent grading is pending.
The first four Codex cells are infrastructure failures, excluded from model
quality comparisons. The controller invoked the PATH binary whose companion
host is missing, repeating the layout diagnosed in #188 instead of using its
verified complete-package route. Native exit zero concealed embedded error
events. One trace completed a `cua.getState()` inventory call outside the task
workflow; no further computer-use actions appear in those retained traces.
This does not establish that the host was otherwise unchanged.

Codex measurements stopped with no retries or provider substitution. The other
eight Codex cells remain unattempted. Further native measurements are held while
the independent critic reviews controller source, raw events, executable binding
and the fixture byte-restoration change. Private outputs remain unpromoted.
Parent rechecked the two stable executable hashes/versions and the packaged
companion's presence; no global configuration or installation change was made.

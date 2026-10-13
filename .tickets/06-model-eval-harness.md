---
id: "06"
title: "Model-eval harness: track how model changes affect skill handling and leverage"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "A harness exists that runs a fixed set of skills against a model and captures how it handles/leverages them (triggering, instruction-following, over/under-triggering)"
  - "Results are comparable across model versions so drift is visible when a model updates"
  - "Findings feed back into skill wording (e.g. dialing aggressive language, re-checking no-ops) per writing-for-agents"
tags: ["type:decision", "stream:tooling"]
---

# Model-eval harness: track how model changes affect skill handling and leverage

## Context

The `writing-for-agents` review (ticket 03) surfaced one finding from credible
sources that genuinely matters: **version drift.** Anthropic notes newer, smarter
models need *less* prescriptive engineering and can *over-trigger* on aggressive
wording, so the whole skill set's wording is model-relative and should be
re-validated as models change, not frozen. Rather than caveat every skill body, track
drift systematically here.

Backlog (not actionable yet): this is a build task that depends on the skill set being
far enough along to be worth harnessing, and on deciding scope/tooling. Un-park when
the set stabilises or a model update makes drift observable.

## What to build

A repeatable harness that runs a fixed battery of grey-matter skills against a model
and records how the model **handles and leverages** them, so a model update's effect
is visible rather than silently degrading quality. Candidate signals:

- **Triggering**: does a model-invoked skill fire when it should, and stay quiet when
  it should not (over- vs under-triggering, the Anthropic-flagged failure)?
- **Instruction-following**: does the model take the skill's intended process (e.g.
  grilling bounds the frontier; domain-modeling respects the strict ADR gate)?
- **No-op/aggression drift**: are instructions that were load-bearing on an older
  model now no-ops, or is aggressive wording now causing over-steering?

Results must be **comparable across model versions** (fixed inputs, recorded outputs,
a diffable summary) so drift shows up on a model bump. Findings feed back into skill
wording per `writing-for-agents` (dial aggressive language, re-audit no-ops, re-check
leading-word strength).

Open scope questions for when this is picked up: which models/harnesses to target
(the set is harness-portable), how much can be automated vs needs human judgement of
output quality, and whether to piggyback on an existing eval framework.

## Acceptance criteria

- [ ] A harness exists that runs a fixed set of skills against a model and captures how it handles/leverages them (triggering, instruction-following, over/under-triggering)
- [ ] Results are comparable across model versions so drift is visible when a model updates
- [ ] Findings feed back into skill wording (e.g. dialing aggressive language, re-checking no-ops) per writing-for-agents

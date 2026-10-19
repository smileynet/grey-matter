---
id: "16"
title: "Test wizard end-to-end against known and unknown scenarios (post v0.1.0 deploy)"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "wizard run end-to-end (by a human, actually executing the generated script) against KNOWN scenarios: at least one real credential/dashboard setup writing to .env and a gh secret, verifying idempotent re-run and resumability"
  - "wizard run against UNKNOWN/unfamiliar scenarios (a dashboard the agent has not seen) to measure how often it hallucinates click-paths/URLs vs correctly falls back to landmarks + ask-the-user"
  - "Findings recorded: what the landmark-not-clickpath rule and per-stage confirm actually caught, any library bugs surfaced by real execution, and any SKILL.md adjustments needed"
  - "Gated on v0.1.0 of the grey-matter skill set being completed and deployed to a real harness"
tags: ["type:research", "stream:tooling"]
---

# Test wizard end-to-end against known and unknown scenarios (post v0.1.0 deploy)

## What to build

Validate the `wizard` skill by actually using it, once the grey-matter skill set hits
**v0.1.0 and is deployed to a real harness**. Everything about wizard so far is authored
and statically reasoned; its two residual risks (hallucinated click-paths, and whether the
landmark-not-clickpath rule + per-stage confirm actually absorb UI drift) can only be
measured by running real wizards.

### Known scenarios (does the engine work?)

Generate and run (a human executing the script) a wizard for a setup the agent *does* know
well: mint a real credential on a dashboard, write it to `.env` and a `gh` secret, then
re-run to confirm idempotency and resumability (Enter-keeps-current, no clobber). Confirms
the proven sinks and the template library behave as designed under real execution.

### Unknown scenarios (does it fail safely?)

Generate a wizard for an *unfamiliar* dashboard the agent hasn't seen. Measure: does it
hallucinate specific click-paths/URLs, or correctly fall back to landmarks + "ask the user
/ check the docs" per the hard rule? This is the real test of the #1 risk and of whether
the mitigation holds.

### Record

- What the landmark rule and per-stage confirm caught vs missed.
- Any `template.sh` bugs that only surface on real execution (quoting, WSL open, upsert
  edge cases).
- Any SKILL.md wording adjustments the runs justify.

Gated on v0.1.0 completed + deployed; low priority until then.

## Acceptance criteria

- [ ] wizard run end-to-end (human-executed) against KNOWN scenarios: a real credential/dashboard setup writing to `.env` and a `gh` secret, verifying idempotent re-run and resumability
- [ ] wizard run against UNKNOWN/unfamiliar scenarios to measure hallucinated click-paths vs landmark + ask-the-user fallback
- [ ] Findings recorded: what the landmark rule and per-stage confirm caught, library bugs from real execution, SKILL.md adjustments needed
- [ ] Gated on grey-matter v0.1.0 completed and deployed to a real harness

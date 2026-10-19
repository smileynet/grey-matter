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

TBD

## Acceptance criteria

- [ ] TBD

---
id: "277"
title: "Measure Grey Matter Kimi plugin update behavior"
status: open
blocked_by: []
validation_criteria:
  - "test -s docs/agents/research/kimi-plugin-live-update.md"
  - "node --test scripts/kimi-plugin.test.mjs"
tags: ["tooling"]
---
# Intent source

Sam requested follow-up tickets for remaining Kimi plugin limitations on 2026-11-08. Closed ticket 271 explicitly left live update timing unverified.

# What to learn and deliver

Observe the actual personal-plugin update lifecycle for Grey Matter: initial registration and installation, a content change, re-registration, and the point at which a new chat receives the changed skill bytes. Distinguish same-version re-registration from the supported version-change path and record any required reload or restart.

Use a disposable plugin copy for experiments. Do not hand-edit release versions, publish a release, or infer update behavior from registration output alone.

# Evidence to retain

Add `docs/agents/research/kimi-plugin-live-update.md` with package versions, exact operations, observed skill bytes, session/reload state, and remaining uncertainty. Update durable operator guidance with the verified update procedure.

# Acceptance criteria

- Same-version behavior and the supported changed-version path are measured separately.
- A live model invocation or equivalent package-load probe proves which bytes the new session loaded.
- The documentation states the observed timing and does not claim instantaneous updates without evidence.
- Existing package tests still pass.

---
id: "216"
title: "Temp-dir cleanup EPERM on Windows flakes gate checks and crashes probe-critic-model"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Fixture and gate temp removal uses rmSync maxRetries/retryDelay (or one shared helper) and a cleanup failure never turns a passing check into an infrastructure error"
  - "probe-critic-model.mjs reports its result and warns, not crashes, when temp removal hits EPERM"
  - "Five consecutive node scripts/gate.mjs pre-merge --base <sha> runs on Windows show no cleanup-caused failures"
tags: ["kind:bug", "stream:test-verification"]
---

# Temp-dir cleanup EPERM on Windows flakes gate checks and crashes probe-critic-model

## What to build

Intent source: the 2026-11-03 sync on Windows. Temp-directory removal hit `EPERM` (`\\?\C:\Users\...\AppData\Local\Temp\...`) in several places, usually an AV scan or a just-exited child still holding a handle:

- `static-check-fixtures` reported an *infrastructure error* in the gate ("Temporary directory cleanup failed; retained ...\gate-tzu1oj"), yet `node --test scripts/static-checks.test.mjs` passes 12/12 standalone.
- `node scripts/probe-critic-model.mjs` crashed with an uncaught `EPERM` on `rm` of `gm-critic-claude-*` (the gate's critic-model-probe passed the same hour).
- tkt's `deploy-validation-*` fixture hit the same error (intermittent; 1 of 3 isolated reruns passed).

Related: ticket 122 (deployer flake on Windows). Fix: route fixture/gate/probe temp removal through `rmSync(..., { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })` or one shared helper. Treat a final cleanup failure as a warning that names the retained path, never as a check failure or crash.

## Acceptance criteria

- [ ] Fixture and gate temp removal uses rmSync maxRetries/retryDelay (or one shared helper) and a cleanup failure never turns a passing check into an infrastructure error
- [ ] `probe-critic-model.mjs` reports its result and warns, not crashes, when temp removal hits EPERM
- [ ] Five consecutive `node scripts/gate.mjs pre-merge --base <sha>` runs on Windows show no cleanup-caused failures

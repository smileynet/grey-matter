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

TBD

## Acceptance criteria

- [ ] TBD

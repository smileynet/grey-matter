---
id: "276"
title: "Let release development tests use the managed npm wrapper"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "node --test scripts/release-development.test.mjs scripts/release-product.test.mjs"
  - "node scripts/gate.mjs pre-merge"
tags: ["tooling"]
---
# Intent source

Sam requested tickets for the remaining limitations found during the Kimi plugin work on 2026-11-08. Closed ticket 272 recorded that the full development suite stops at the managed npm wrapper.

# Observed problem

`scripts/release-development.mjs` starts `npm ci` with `productEnvironment()`. Under Kimi, the managed npm wrapper requires `KIMI_DESKTOP_RUNTIME_NODE` and `KIMI_DESKTOP_PROCESS_RUNNER`, but the sanitized environment removes them. Nine development tests fail with `exec: : not found`; a standalone npm fixture succeeds with the ambient environment.

# What to build

Make development integration work with both ordinary npm and the managed Kimi wrapper while preserving deliberate environment sanitization. Add a regression fixture that proves the required runtime values are forwarded intentionally without exposing the rest of the ambient environment.

# Out of scope

Release publication, changing the managed wrapper, and broad environment-variable passthrough.

# Acceptance criteria

- A fixture reproduces the managed-wrapper requirement and fails before the compatibility fix.
- Only the explicitly required runtime values are added to the child environment.
- The focused development/product suites and applicable pre-merge gate pass.

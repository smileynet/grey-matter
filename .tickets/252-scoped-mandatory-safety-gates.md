---
id: "252"
title: "Keep mandatory gates scoped to durable safety checks"
status: in_progress
blocked_by: []
tags: ["stream:test-verification"]
---
Intent: owner authorized implementing the mandatory-gate review recommendations. Split native Claude validation and experimental/model-specific scenarios into on-demand suites; preserve cheap safety fixtures; narrow blanket full triggers while retaining unknown-range safety. Acceptance: blocking manifests select durable safety cases; on-demand suites remain runnable; required checks pass; commit, push and local redeploy complete. Related: ticket 175 and ticket 250.

## Acceptance criteria

- [ ] Native installed-tool validation is on-demand; static manifest checks remain blocking.
- [ ] Experimental fixture and model-specific scenarios are separately runnable on-demand; safety cases remain blocking.
- [ ] Known changes select affected checks; unknown ranges and explicit releases retain conservative coverage.
- [ ] Required checks pass and changes are committed, pushed and locally redeployed.

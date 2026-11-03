---
id: "230"
title: "Deployer suite takes 21 min on Windows vs 92s measured and times out its 600s gate"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Per-test timings for deploy.test.mjs and deploy-validation.test.mjs on Windows are recorded with the dominant cost named (subprocess, git, copy or AV)"
  - "node scripts/gate.mjs pre-merge --include deployer finishes inside timeout_s on an idle Windows host, or timeout_s/measured are updated with recorded evidence"
tags: ["kind:bug", "stream:test-verification"]
---

# Deployer suite takes 21 min on Windows vs 92s measured and times out its 600s gate

## What to build

TBD

## Acceptance criteria

- [ ] TBD

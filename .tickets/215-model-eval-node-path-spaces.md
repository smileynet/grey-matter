---
id: "215"
title: "spike-model-eval controller breaks when node.exe lives under a path with spaces"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "The controller npm-test invocation runs node via an argv array (or properly quoted) so 'C:\\Program Files\\nodejs\\node.exe' works"
  - "node --test scripts/spike-model-eval.test.mjs passes on Windows with the default Node install path"
tags: ["kind:bug", "stream:test-verification"]
---

# spike-model-eval controller breaks when node.exe lives under a path with spaces

## What to build

TBD

## Acceptance criteria

- [ ] TBD

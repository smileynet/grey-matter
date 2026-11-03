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

Intent source: the 2026-11-03 sync. `model-eval-fixtures` (`node --test scripts/spike-model-eval.test.mjs`) fails one test on Windows: "controller npm test uses the active Node executable path without inherited secrets" exits 1 with `'C:\Program' is not recognized as an internal or external command`. The controller builds a shell command line from `process.execPath` (`C:\Program Files\nodejs\node.exe`) without quoting.

Fix: invoke node through an argv array with `shell: false` (preferred), or quote the executable for cmd. Keep the "no inherited secrets" property the test asserts.

## Acceptance criteria

- [ ] The controller npm-test invocation runs node via an argv array (or properly quoted) so `C:\Program Files\nodejs\node.exe` works
- [ ] `node --test scripts/spike-model-eval.test.mjs` passes on Windows with the default Node install path

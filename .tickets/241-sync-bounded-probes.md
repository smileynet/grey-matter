---
id: "241"
title: "Stream critic probe results with a deadline per harness"
status: done
blocked_by: []
validation_criteria:
  - "Each completed harness result is printed immediately and a harness shares one total timeout across subprocesses."
  - "Timeouts and missing tools remain report-only host findings with deterministic fixture coverage."
tags: ["stream:tooling", "kind:bug"]
---
# Stream critic probe results with a deadline per harness

## What to build

Intent: the 2026-11-03 sync exposed recovery gaps. Update scripts/probe-critic-model.mjs under the approved sync improvement plan. Preserve ownership checks and real failure reporting.

## Acceptance criteria

- [x] Each completed harness result is printed immediately and a harness shares one total timeout across subprocesses.
- [x] Timeouts and missing tools remain report-only host findings with deterministic fixture coverage.

## Resolution (2026-11-04)

done: stream each critic result immediately and share one timeout budget across its subprocesses; version timeouts remain timed-out evidence, not a crash or missing-model pass. No provider defaults changed. Probe logs retained through final sync verification.

### Verification
1. ✓ Each completed harness result is printed immediately and a harness shares one total timeout across subprocesses. — "node --test scripts/probe-critic-model.test.mjs: 13 passed, 5 Windows-only cases explicitly skipped. Streaming fixture releases the next harness only after the first result arrives."
2. ✓ Timeouts and missing tools remain report-only host findings with deterministic fixture coverage. — "gate.mjs pre-merge --include critic-model-probe passed; deadline and missing-tool fixtures preserve unknown outcomes and never report timed-out refusal as pass."

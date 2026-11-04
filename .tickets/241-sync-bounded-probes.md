---
id: "241"
title: "Stream critic probe results with a deadline per harness"
status: in_progress
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

- [ ] Each completed harness result is printed immediately and a harness shares one total timeout across subprocesses.
- [ ] Timeouts and missing tools remain report-only host findings with deterministic fixture coverage.

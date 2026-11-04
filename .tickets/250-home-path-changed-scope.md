---
id: "250"
title: "Scope the home-path gate to introduced leaks instead of historical evidence"
status: open
blocked_by: []
validation_criteria:
  - "Reproduce and confirm the existing full-tree failure on unchanged historical files before selecting a scoped fix."
  - "Unrelated clean pushes are not blocked by baseline paths; introduced home-path leaks still fail and historical evidence is preserved."
tags: ["stream:tooling", "kind:bug"]
---
## What to build

The all-checks review confirmed that scripts/check-home-path.mjs was introduced after an actual leak (21add82), not as a spike. Keep its purpose. Its always-on full-tree scan currently returns225 findings for unchanged historical data on this Mac, causing unrelated ticket/doc pushes to fail. The scanner walks every tracked file and only allowlists two Windows evidence files. Compare introduced paths or lines against the pushed base instead of requiring historical records to be rewritten. Preserve new-leak detection, failure honesty, and historical evidence. Sources: scripts/check-home-path.mjs, scripts/check-home-path.test.mjs, scripts/gates.json, docs/agents/local-gates.md.

## Acceptance criteria

- [ ] Confirm the baseline scope failure with evidence and select a bounded correction.
- [ ] Regression fixtures show new leaks rejected and unrelated historical evidence preserved without blocking clean changes.

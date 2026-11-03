---
id: "200"
title: "Freeze the complete evaluation seed independently of host tooling"
status: in_progress
blocked_by: ["199"]
priority: high
tags: ["stream:orchestration", "type:fix"]
validation_criteria:
  - "The selected runner produces the original c474646 seed without invoking live tkt or the mutable general fixture generator; full asset and extra-file checks pass."
  - "Independent exact-source review and current repository verification pass, including the full model-evaluation suite."
  - "Seed provenance, historical execution limits and owned artifact disposition are recorded; shared recipe and dashboards reflect the repair."
---

# Freeze the complete evaluation seed independently of host tooling

## What to build

After #199 pinned the dashboard, a host tkt update changed generated AGENTS.md
from 3,326 to 3,426 bytes. The fixture guard correctly stopped setup, but the
selected recipe and its integration test still depended on live tool output.
The parent observed 14/15 tests passing with one setup failure before a model
call. This ticket captures the repair already prepared in an isolated worktree;
creation waited for a green parent gate to avoid tkt auto-pushing the failing tip.

Materialize all fifteen original fixture files from frozen, hash-checked inputs,
keeping tree c474646ea61e037fcdbc1be3d2dc6c0833f5e260. Remove live tkt/generator
dependencies from this selected evaluation path; keep the general generator
unchanged. Reject unexpected files and preserve independent grading and all
historical native execution/source identities.

## Acceptance criteria

- [ ] All fifteen files produce the original tree without live tkt/generator inputs, with asset hashes and extra-file rejection checked.
- [ ] Independent exact-source review and current gates pass, including the complete evaluation tests.
- [ ] Provenance, artifact disposition, selected recipe and both dashboards reflect the repair without claiming new model execution.

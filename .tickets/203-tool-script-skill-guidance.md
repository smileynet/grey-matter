---
id: "203"
title: "Give every tracked tool script task-specific agent skill usage guidance"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "Complete tracked-script inventory classifies all in-scope files and reports genuinely undocumented entrypoints without running them."
  - "All operator scripts have reachable task-specific skill guidance with invocation, authorization, result interpretation and lifecycle; held spike tools remain held."
  - "Coverage checker rejects missing/stale guidance and new unclassified scripts in meaningful fixtures; independent critic and relevant repository checks pass."
tags: ["stream:orchestration","type:chore","epic:outcome-orchestration"]
assignee: "codex"
---
# Give every tracked tool script task-specific agent skill usage guidance

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Inventory tracked executable scripts across scripts/, tools/ when present, and skill-local script directories. Classify operator entrypoints versus imported modules, tests and fixtures explicitly. Every operator entrypoint must have a reachable owning skill/reference describing when to use it, exact invocation/arguments, inputs, mutation/authorization boundaries, output/exit interpretation and verification. Cover historical/native spike tools with explicit experiment holds, not generic permission to run them. Add a small read-only coverage checker and meaningful missing/new-entry regressions; run on demand first. Tests/internal modules need an explicit classified role rather than misleading CLI instructions. Preserve existing guidance and avoid serializing unrelated hand-formatted files.

## Acceptance criteria

- [x] Complete tracked-script inventory classifies all in-scope files and reports genuinely undocumented entrypoints without running them.
- [x] All operator scripts have reachable task-specific skill guidance with invocation, authorization, result interpretation and lifecycle; held spike tools remain held.
- [x] Coverage checker rejects missing/stale guidance and new unclassified scripts in meaningful fixtures; independent critic and relevant repository checks pass.

## Resolution (2026-11-03)

Delivered complete current tool-script classification, task-specific owning skill guidance and a read-only on-demand coverage checker. Independent semantic review corrected factual tool instructions before acceptance. Current inventory141paths; future tools must register. Promoted source and compact evidence, retained raw review/gate output and worktree for this delivery cycle only; unrelated historical data preserved.

### Verification
1. ✓ Complete tracked-script inventory classifies all in-scope files and reports genuinely undocumented entrypoints without running them. — "PASS: integrated checker141/141 paths across tracked script extensions, executable modes, shebangs and nonignored candidates; roles57operator16module51test17fixture. No inventoried operator was run for discovery; source facts independently reviewed."
2. ✓ All operator scripts have reachable task-specific skill guidance with invocation, authorization, result interpretation and lifecycle; held spike tools remain held. — "PASS: revised workerf0c37cbc independently accepted and integrated62b168b renewed after owning-skill pointer/204registration; source-specific commands, authorization, outputs and limits include current builder/fixture and held probes. New205/207/208 scripts require registration when integrated."
3. ✓ Coverage checker rejects missing/stale guidance and new unclassified scripts in meaningful fixtures; independent critic and relevant repository checks pass. — "PASS: 4/4 coverage regressions, syntax50/37 invocation50/19 docs/diff; fully retained premerge4/4, prepush5/5 and deploy --no-agy installed50skills. Worker missingyaml was infrastructure, parent verification passed. Raw review/gate hashes and retention owner in evidence/orchestration-delivery-203-20261103.json; worktree retained through reuse or archive."

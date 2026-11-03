---
id: "203"
title: "Give every tracked tool script task-specific agent skill usage guidance"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Complete tracked-script inventory classifies all in-scope files and reports genuinely undocumented entrypoints without running them."
  - "All operator scripts have reachable task-specific skill guidance with invocation, authorization, result interpretation and lifecycle; held spike tools remain held."
  - "Coverage checker rejects missing/stale guidance and new unclassified scripts in meaningful fixtures; independent critic and relevant repository checks pass."
tags: ["stream:orchestration", "type:chore"]
---
# Give every tracked tool script task-specific agent skill usage guidance

## Intent

User approved [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md) on 2026-11-03 and explicitly requested tickets plus agent skill guidance for all tool scripts.

## What to build

Inventory tracked executable scripts across scripts/, tools/ when present, and skill-local script directories. Classify operator entrypoints versus imported modules, tests and fixtures explicitly. Every operator entrypoint must have a reachable owning skill/reference describing when to use it, exact invocation/arguments, inputs, mutation/authorization boundaries, output/exit interpretation and verification. Cover historical/native spike tools with explicit experiment holds, not generic permission to run them. Add a small read-only coverage checker and meaningful missing/new-entry regressions; run on demand first. Tests/internal modules need an explicit classified role rather than misleading CLI instructions. Preserve existing guidance and avoid serializing unrelated hand-formatted files.

## Acceptance criteria

- [ ] Complete tracked-script inventory classifies all in-scope files and reports genuinely undocumented entrypoints without running them.
- [ ] All operator scripts have reachable task-specific skill guidance with invocation, authorization, result interpretation and lifecycle; held spike tools remain held.
- [ ] Coverage checker rejects missing/stale guidance and new unclassified scripts in meaningful fixtures; independent critic and relevant repository checks pass.


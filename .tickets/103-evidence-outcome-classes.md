---
id: "103"
title: "Standing rules name outcome classes and report what remains unknown"
status: open
blocked_by: []
priority: high
tags: ["kind:enhancement"]
---

# Standing rules name outcome classes and report what remains unknown

## What to build

Intent: recommendations 2 and 12. Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main). Mutate4Go exited 0 with a survivor, and a
missing command was counted as a kill: a green process is not the decision you meant.

Extend `global/AGENTS.md` "Done means evidenced": classify each check's outcome (pass,
assertion failure, skip, infrastructure error, timeout, survivor) and say what remains
unknown. Report a gain that wasn't measured as "not demonstrated here", and count distinct
faults separately from assertions and repeats. Put the reporting half in
`docs/agents/doc-conventions.md` human-facing writing if it doesn't fit the global file.
The global file is 1,173 bytes against the budget `install-agents-md.mjs` enforces; keep
it under budget and redeploy it once.

## Acceptance criteria

- [ ] The global standing rule names the outcome classes and asks for unknowns
- [ ] The reporting guidance covers "not demonstrated here" and counting distinct faults
- [ ] check-repo group 6 (global AGENTS.md budget) passes and the installed copies are refreshed

---
id: "174"
title: "Spike: harbor as the runner for the model-tier and harness spikes, vs a thin runner of our own"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: harbor as the runner for the model-tier and harness spikes, vs a thin runner of our own

## What to build

A one-day trial of [harbor](https://github.com/harbor-framework/harbor), cloned at `.references/harbor`, as the shared runner for tickets 167-172. Port two of the spike-0 fixture tickets into harbor's task layout (instruction, hidden tests, oracle solution; see `.references/harbor-cookbook`). Run them through the Claude Code and Codex adapters on Windows, and try the generic ACP agent against `kiro-cli acp`.

**Question:** does harbor run our fixtures on Windows with the harnesses we use, including Kiro, without its Docker setup costing more than a thin runner over `scripts/spike-orchestrate-fixture.mjs` would? Prior art, not authority: [eval prior art](../docs/agents/research/eval-prior-art-20261101.md#what-grey-matter-should-decide).

## Acceptance criteria

- [ ] Both fixtures run through at least two harness adapters, with their pass or fail and cost recorded, or the blocking failure recorded verbatim.
- [ ] A decision for tickets 167-172 (harbor, or a thin runner of our own), with the reason, added to the eval prior-art note.
- [ ] Any Docker or sandbox state the trial created removed or recorded.

---
id: "91"
title: "Spike: verify critic model and effort pinning through each harness CLI"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "A results matrix covers all seven probes for Claude Code, Codex, Kiro CLI and opencode, with the command, version and evidence line for each cell"
  - "A working spawn recipe per harness and a corrected harness table are committed, and failures have follow-up tickets"
tags: ["stream:tooling", "type:spike"]
---

# Spike: verify critic model and effort pinning through each harness CLI

## What to build

Run the spike in [proposal 14](../docs/agents/proposals/14-critic-model-spike.md): seven probes (pin and
prove, effort, subagent pin, unavailable model, overrides, read-only, output contract) against Claude
Code, Codex, Kiro CLI and opencode, using Claude Opus 5.5 and GPT-6.1 Sol as the ceiling models.
Known starting facts on this machine: Codex 0.147.0's catalog lacks `gpt-6.1-sol`, Kiro CLI 2.16.0's
strongest Claude is Opus 4.5, and opencode lists the ceiling models under its `opencode/` provider.
Evidence stays in `.scratch/`; the committed result is a matrix under `docs/agents/research/`.
Blocks the harness table in proposal 13 and ticket 90's dispatch wiring.

## Acceptance criteria

- [ ] A results matrix covers all seven probes for the four harnesses, each cell with command, version, date and an evidence line.
- [ ] One working spawn recipe per harness (model, effort, read-only, structured output) is recorded.
- [ ] The harness table for `docs/agents/harnesses.md` is corrected from the results and committed.
- [ ] `scripts/probe-critic-model.mjs` covers the passing probes read-only, and `sync` runs it.
- [ ] Each failure has a follow-up ticket.

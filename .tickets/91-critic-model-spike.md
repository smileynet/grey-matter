---
id: "91"
title: "Spike: verify critic model and effort pinning through each harness CLI"
status: done
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
Decided: a harness below the ceiling still runs its critics on its best model, marked below ceiling. Blocks the harness table in proposal 13 and ticket 90's dispatch wiring.

## Acceptance criteria

- [x] A results matrix covers all seven probes for the four harnesses, each cell with command, version, date and an evidence line.
- [x] One working spawn recipe per harness (model, effort, read-only, structured output) is recorded.
- [x] The harness table for `docs/agents/harnesses.md` is corrected from the results and committed.
- [x] `scripts/probe-critic-model.mjs` covers the passing probes read-only, and `sync` runs it.
- [x] Each failure has a follow-up ticket.

## Progress (2026-10-27)

Measured: Kiro CLI, opencode (on the owner's z.ai subscription) and Claude Code's in-session
subagents; see [the results](../docs/agents/research/critic-model-spike-20261027.md). Blocked: Claude
Code CLI (logged out on this host) and Codex (refresh token reused, token file unchanged since
2026-10-21); the owner's refresh did not reach this machine. Remaining after `claude auth login` and
`codex login` here: P1 to P7 for those two, P5 for all, `probe-critic-model.mjs` and the corrected
harness table. Findings already change proposal 13: the model of record comes from the harness,
critics need a time limit, and a CLI flag outranks an agent file.

## Resolution (2026-10-27)

Spike run on randomserver; all four harnesses measured; probe script, harness table and sync step added; gaps filed as ticket 92.

### Verification
1. ✓ A results matrix covers all seven probes for Claude Code, Codex, Kiro CLI and opencode, with the command, version and evidence line for each cell — "docs/agents/research/critic-model-spike-20261027.md: matrix of seven probes across Claude Code (CLI and in-session), Codex 0.164.0, Kiro 2.16.0 and opencode 1.18.21, with command, version and evidence per cell"
2. ✓ A working spawn recipe per harness and a corrected harness table are committed, and failures have follow-up tickets — "docs/agents/harnesses.md#critic-model holds the corrected table and recipes; scripts/probe-critic-model.mjs (check-repo invariant 16, run in sync) reported claude, codex and opencode at ceiling and Kiro unverified below ceiling; failures are ticket 92"

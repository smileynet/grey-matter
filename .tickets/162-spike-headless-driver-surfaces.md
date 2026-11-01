---
id: "162"
title: "Spike: compare headless driver surfaces across harnesses"
status: open
blocked_by: []
tags: ["stream:tooling", "type:research"]
---

# Spike: compare headless driver surfaces across harnesses

## What to build

Compare the headless driver surfaces an outside orchestrator could use: `codex queue`/`exec --json --output-schema`, `kiro-cli chat --output-format stream-json`/`serve`/`acp`, agy paired stream-json input and output, and Claude Code `-p` with stream forwarding. Use [harness surfaces](../docs/agents/harness-surfaces/README.md) for the flags.

**Question:** Which surfaces let one external process dispatch a worker, read its structured result, send it a follow-up and see approvals, on Windows?

Source: [harness experimental features](../docs/agents/research/harness-experimental-features-20261101.md#proposed-spikes) (2026-11-01). Run on the spike-0 fixture (`scripts/spike-orchestrate-fixture.mjs`, ticket 124) in a throwaway checkout; any GitHub repo only with the user's go-ahead.

## Acceptance criteria

- [ ] Results recorded as a dated section in the source research note, each claim marked observed (with the command or transcript excerpt) or documented.
- [ ] The question above answered yes or no, or listed under "couldn't verify" with what was tried.
- [ ] Sandbox folders removed after the run; settings changed for the spike restored or recorded.

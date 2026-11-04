---
id: "166"
title: "Refresh harnesses.md to the installed harness versions (first harness-changelog review)"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Harness overview versions and paths agree with current observed identities or state an explicit evidence limit"
  - "Changed command examples are verified without model calls or bypassing security holds"
  - "Documentation checks and applicable repository gates pass"
tags: ["stream:tooling","epic:outcome-orchestration"]
---

# Refresh harnesses.md to the installed harness versions (first harness-changelog review)

## What to build

Bring [harnesses.md](../docs/agents/harnesses.md) up to the versions recorded in [versions.json](../docs/agents/harness-surfaces/versions.json), working from the proposals in [the first harness-changelog review](../docs/agents/research/harness-changelog-review-20261101.md):

- **Codex:** the install is bun, not an fnm `.ps1` shim, at 0.166.0.
- **Claude Code:** bash examples call `claude.exe`, because the bare `claude` wrapper needs zsh. Version 2.1.316.
- **kiro-cli:** 2.37.0. Point to [kiro.md](../docs/agents/harness-surfaces/kiro.md) for flags rather than the kiro.dev CLI page.
- **agy:** version references settled at 1.4.12.
- **Crush:** installed (0.93.1); its user-level rules path is still unverified.

Each claim changed is re-probed on this machine, not copied from the review.

## Acceptance criteria

- [ ] Every version and binary path in harnesses.md matches versions.json, or says why it differs.
- [ ] Each changed test command was run once and its output read.
- [ ] `node scripts/gate.mjs pre-push` passes.

## Outcome-driven orchestration coordination

Proposal 19 approved. This ticket retains harness-overview version refresh; #206 handles bounded observed reference contradictions. Preserve the Agy execution hold; do not run a broad harness probe to refresh this note.

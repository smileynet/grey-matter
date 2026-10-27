---
id: "93"
title: "Spike: contain Codex critics with an enforced boundary, not the prompt"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "A table of options T1 to T5 against the six adversarial checks, each cell with evidence"
  - "A recommendation and the Codex harness row are updated, with a probe check for the chosen boundary"
tags: ["stream:tooling", "type:spike"]
---

# Spike: contain Codex critics with an enforced boundary, not the prompt

## What to build

Run the spike in [proposal 15](../docs/agents/proposals/15-codex-critic-containment.md): test five containment options for Codex critics (restore the Codex sandbox with the AppArmor profile, a read-only Docker container, tool-surface removal, `--worktree`, and the prompt baseline) against six adversarial checks. T3 and T4 need no privilege and run first; T1 needs the owner to run one `sudo` step and is optional; T2 is the strongest option that needs no `sudo`, with credentials as its main risk. Evidence: [codex-cli-controls](../docs/agents/research/codex-cli-controls-20261027.md).

## Acceptance criteria

- [ ] A table covers the options against the six adversarial checks, each cell with evidence from the filesystem or process, not the critic's words.
- [ ] Setup cost, reversibility, owner steps, per-call overhead and credential exposure are recorded per option.
- [ ] A recommendation is chosen by the proposal's order, and the Codex row in `harnesses.md` and ticket 92's sandbox item are updated.
- [ ] `scripts/probe-critic-model.mjs` checks the chosen boundary, and `sync` reports a regression.

## Progress (2026-10-27)

Run: T3, T4, T5 and an added `-s read-only` option; see
[the results](../docs/agents/research/codex-containment-spike-20261027.md). Docker (T2) postponed and the
AppArmor fix (T1) skipped by the owner. Finding: `-s read-only` is enforced here (patch rejected by
policy, shell fails closed), the bypass flag gives no boundary, no flag removes the patch tool, and
`--worktree` contains relative writes only. Decided by the owner: `-s read-only` with the input in the prompt
is the Codex critic default; otherwise no sandbox. Remaining: T2, optionally T1, and the probe check.

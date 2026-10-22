---
id: "50"
title: "Decommission recall entirely (binary, data, steering, skill, agent refs, AGENTS.md refs)"
status: done
blocked_by: []
validation_criteria:
  - "recall binary, steering, and skill removed from all harness roots"
  - "~/.recall archived or deleted with user confirmation"
  - "No remaining recall references in ~/.kiro agent configs we own; AGENTS.md refs listed for per-repo cleanup"
tags: ["type:chore", "stream:migration"]
---

# Decommission recall entirely (binary, data, steering, skill, agent refs, AGENTS.md refs)

## What to build

Decision D3: decommission recall entirely. Scope (from [proposal 04 § Recall decommission](../docs/agents/proposals/04-crew-research-migration.md)):

- Binary: `~/.cargo/bin/recall` (`cargo uninstall recall`).
- Data: `~/.recall` (2.5 GB). Archive or delete **only after explicit user confirmation**.
- Steering: `~/.kiro/steering/recall-check.md` and `recall-session-start.md`. Skill: `recall` in
  `~/.kiro/skills` and `~/.agents/skills`. (These overlap ticket 49's removal; whichever runs first
  wins, and the other confirms.)
- Agent configs: `~/.kiro/agents/kirocrew-research.json` (ours, so edit it) and
  `AtlasAICapabilities-atlas.json` (AIM-managed, so report rather than edit).
- The 7 `~/code/*/AGENTS.md` files that reference recall: list them for per-repo adoption cleanup.
- crew-research `recall:*` mise tasks: frozen with the repo; note them in its README.

## Acceptance criteria

- [x] recall binary, steering, and skill gone from every harness root.
- [x] ~/.recall archived or deleted with user confirmation.
- [x] No recall reference left in agent configs we own; AGENTS.md refs listed.

## Resolution notes (2026-10-22)

Removed: `~/.cargo/bin/recall` (hand-copied binary, not cargo-registered), `~/.recall` (2.5 GB,
deleted with user confirmation; no archive), `~/.kiro/steering/recall-{check,session-start}.md`,
the `recall` skill from `~/.kiro/skills` and `~/.agents/skills`, and the recall entries in the
three crew-research manifests (so ticket 49's script won't trip over them).

Agent configs: no edits were needed. The matches in `kirocrew-research.json` and
`AtlasAICapabilities-atlas.json` are the English word "recall", not the tool.

Left for per-repo adoption cleanup (these AGENTS.md files still mention recall): archwright,
discord-poc, games-sa-buddy, multimodal-enablement, teach-me. The crew-research and recall repos
are frozen or retired, so no cleanup there.

Hazard: crew-research `mise run tools:deploy` would reinstall recall. Ticket 52's freeze covers it.

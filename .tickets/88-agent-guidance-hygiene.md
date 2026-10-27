---
id: "88"
title: "Managed guidance blocks and a stale/conflict check for agent instructions"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "install-agents-md edits only its managed block and preserves user text in a foreign file"
  - "check-guidance reports dead paths, commands, skills and steering symlinks, and generated-file headers, with fixtures from the 2026-10-27 cutover"
tags: ["stream:tooling", "type:enhancement"]
---

# Managed guidance blocks and a stale/conflict check for agent instructions

## What to build

Implement [proposal 12](../docs/agents/proposals/12-agent-guidance-hygiene.md), in its rollout order:
managed-block install/drift/uninstall in `scripts/install-agents-md.mjs`; a read-only
`scripts/check-guidance.mjs` (deterministic tier first); rule ids, `global/conflict-pairs.json` and
override markers; then wiring into `sync`, `conformance-audit` and `adopt-project`.

Evidence: the 2026-10-27 randomserver cutover. `--force` replaced two crew-generated global files
wholesale, and stale `recall` references, a dead steering symlink and crew-generated steering were
found only by hand. Ticket 82 touches the same installer; land it first or fold it in.

## Acceptance criteria

- [ ] Installer replaces only its marked block; text outside it survives install, update and uninstall.
- [ ] An edited block is refused as drift without `--force`.
- [ ] `check-guidance` reports the cutover fixtures: dead command, dead skill, dead steering symlink, foreign generator header.
- [ ] Judgment-tier findings are reported, never auto-applied.
- [ ] `node scripts/check-repo.mjs` passes.

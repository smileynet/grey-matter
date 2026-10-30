---
id: "88"
title: "Managed guidance blocks and a stale/conflict check for agent instructions"
status: done
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

- [x] Installer replaces only its marked block; text outside it survives install, update and uninstall.
- [x] An edited block is refused as drift without `--force`.
- [x] `check-guidance` reports the cutover fixtures: dead command, dead skill, dead steering symlink, foreign generator header.
- [x] Judgment-tier findings are reported, never auto-applied.
- [x] `node scripts/check-repo.mjs` passes.

## Resolution (2026-10-30)

Implemented proposal 12 in 7d265b7. install-agents-md.mjs now owns only a marked block (rev hash): appends to foreign files, updates in place, refuses hand-edited blocks and generated files without --force, migrates old OWNER_MARK installs; --name/--source install other blocks (init-project's repo pointer). New read-only scripts/check-guidance.mjs: deterministic errors (dead path/command/skill/steering link, generator header, budget, cross-layer duplicate) and judgment findings (contradictions from global/conflict-pairs.json with override markers as info, re-read when a named file changed after the guidance's last commit). Wired into check-repo group 6, sync, conformance-audit, adopt-project, init-project and harnesses.md. Rule ids live in conflict-pairs.json rather than global/AGENTS.md to keep the always-on file lean (recorded in the proposal). Real install migrated this host's four legacy files (each identical to source before migration); check-guidance on this host reports one finding: optional ~/.spellbook/config.yaml named in the spellbook steering file, left for the owner.

### Verification
1. ✓ install-agents-md edits only its managed block and preserves user text in a foreign file — "node --test scripts/install-agents-md.test.mjs: 10/10 pass, covering foreign-file text surviving install, update and uninstall, drift refusal with diff and --force overwriting only the block, generated-file refusal, legacy migration, empty-file removal"
2. ✓ check-guidance reports dead paths, commands, skills and steering symlinks, and generated-file headers, with fixtures from the 2026-10-27 cutover — "node --test scripts/check-guidance.test.mjs: 6/6 pass; cutover fixtures report dead command recall (inline and fenced), dead skill wayfinder, dead steering symlink frontier-work.md, crew generator header, plus judgment contradiction and override info with no file edited; disabling the dead-link rule turns the suite red; node scripts/check-repo.mjs: all 16 groups pass"

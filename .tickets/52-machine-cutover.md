---
id: "52"
title: "Machine cutover: uninstall crew-research, install grey-matter skills + global AGENTS.md, verify, freeze crew deploys"
status: open
blocked_by: ["45", "46", "47", "48", "49", "50", "51"]
validation_criteria:
  - "Fresh kiro-cli and codex sessions list grey-matter skills; the 34 non-crew skills are intact; global AGENTS.md injected"
  - "In one .memory/ repo the agent finds CONTEXT.md via the shim"
  - "crew-research README/AGENTS.md says never run init (would undo cutover); snapshot retained"
tags: ["type:chore", "stream:migration"]
---

# Machine cutover: uninstall crew-research, install grey-matter skills + global AGENTS.md, verify, freeze crew deploys

## What to build

The final global swap, after 45–51 land. Sequence ([proposal 04 § Cutover](../docs/agents/proposals/04-crew-research-migration.md)):

1. Snapshot, then run the ticket 49 script (crew-research uninstall) and the ticket 50 steps.
2. `node scripts/install-skills.mjs`, plus the global AGENTS.md install (ticket 45).
3. Verify in fresh kiro-cli and codex sessions.
4. Freeze crew-research: add a README/AGENTS.md note that its `init` would undo the cutover.

Rollback: restore the snapshot, or run `mise run init -- --global --tier full` in crew-research.

## Acceptance criteria

- [ ] Fresh kiro-cli and codex sessions list grey-matter skills; non-crew skills intact; global AGENTS.md injected.
- [ ] Shim verified in one .memory/ repo.
- [ ] crew-research marked frozen; snapshot retained.

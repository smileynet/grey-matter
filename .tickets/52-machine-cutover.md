---
id: "52"
title: "Machine cutover: uninstall crew-research, install grey-matter skills + global AGENTS.md, verify, freeze crew deploys"
status: done
blocked_by: ["45", "46", "47", "48", "49", "50", "51", "57"]
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

- [x] Fresh kiro-cli and codex sessions list grey-matter skills; non-crew skills intact; global AGENTS.md injected.
- [x] Shim verified in one .memory/ repo.
- [x] crew-research marked frozen; snapshot retained.

## Resolution (2026-10-22)

Machine cutover complete on local host. Phase A (additive): 43 grey-matter skills across 4 roots + global AGENTS.md to kiro/claude. Phase B (destructive, fleet confirmed quiet): uninstalled 110 crew items, re-installed freed names, replaced codex AGENTS.md, decommissioned recall. 3 kept symlinks were the setup repo's (foreign, out of scope). All repo-check invariants green; 3/3 ACs verified in fresh sessions.

### Verification
1. ✓ Fresh kiro-cli and codex sessions list grey-matter skills; the 34 non-crew skills are intact; global AGENTS.md injected — "Fresh kiro-cli (no-interactive) in grey-matter listed skills orient/wrap-session/conformance-audit and confirmed 'Done means evidenced' in standing rules -> grey-matter skills + global AGENTS.md both live for new sessions. Non-crew skills intact: externally managed skills, tkt, tst, herdr-* and the vendor steering subdir all present; archwright-survey/gitlab-project were never on this host (confirmed via pre-cutover snapshot)."
2. ✓ In one .memory/ repo the agent finds CONTEXT.md via the shim — "Fresh kiro-cli in a .memory/ repo resolved glossary=.memory/CONTEXT.md and decisions=.memory/adr/ and quoted the first term -> shim line works."
3. ✓ crew-research README/AGENTS.md says never run init (would undo cutover); snapshot retained — "crew-research frozen: FROZEN banner committed to README.md+AGENTS.md (54be9e3) rebased onto origin; external push blocked by a corporate push-policy hook (unapproved public repo) so it stays local on this machine — which still fulfills the freeze (blocks init here). Snapshots retained: pre-cutover-snapshot-20261022T185032Z.tar.gz + crew-research-snapshot-2026-10-22T19-09-55Z.tar.gz + recall-data-archive. recall decommissioned: binary removed, 506MB data archived (280MB, verified) and deleted, skill+steering removed by Phase B, no live config refs."

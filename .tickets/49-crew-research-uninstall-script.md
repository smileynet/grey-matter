---
id: "49"
title: "Manifest-scoped crew-research uninstall script (dry-run, do-not-touch list)"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "Removes only dirs listed in .crew-skills / .crew-skills-codex / .crew-skills-crush and only the crew-owned steering files"
  - "Dry-run output proves the 34 non-crew skills and non-crew steering are untouched"
  - "Snapshot step precedes removal; restore documented"
tags: ["type:enhancement", "stream:migration"]
---

# Manifest-scoped crew-research uninstall script (dry-run, do-not-touch list)

## What to build

crew-research has no uninstall command; its July incident deleted 13 archwright skills through
a tier-based prune. Write a script (`scripts/uninstall-crew-research.mjs`, or a one-shot under
`scripts/`) that:

1. Snapshots `~/.kiro/skills`, `~/.kiro/steering`, `~/.agents/skills`, and `~/.codex/AGENTS.md`
   to a dated tarball.
2. Removes **only** the dirs listed in `~/.kiro/.crew-skills`,
   `~/.agents/skills/.crew-skills-codex`, and `.crew-skills-crush`, then the manifests and
   `~/.kiro/.crew-tier`.
3. Removes only the 10 crew-owned steering files (see proposal 04) and the generated
   `~/.codex/AGENTS.md` (verify its auto-generated header first).
4. Defaults to `--dry-run`, and diffs against the do-not-touch list: the 34 non-crew skills,
   `archwright-conventions.md`, `amazon-builder/*`, and `references/environment-gotchas.md`.

Context: [proposal 04 § What's deployed today](../docs/agents/proposals/04-crew-research-migration.md).

## Acceptance criteria

- [ ] Dry-run lists exactly the manifest-named skills and crew steering files.
- [ ] Do-not-touch set provably untouched (test with a throwaway root).
- [ ] Snapshot is taken before any removal; restore steps documented.

---
id: "84"
title: "Resync this host after the install-skills cutover: deploy.mjs redeploy, tkt skill pack, tkt 0.4.0"
status: open
blocked_by: []
validation_criteria:
  - "deploy.mjs audit shows no duplicate or root-escaping skills"
  - "A fresh Kiro session lists the grey-matter and tkt-* skills and tkt --version is 0.4.0"
tags: ["stream:migration", "type:chore"]
---

# Resync this host after the install-skills cutover: deploy.mjs redeploy, tkt skill pack, tkt 0.4.0

Resync this host (local macOS; dev-dsk is migrated separately) after the 2026-10-22
cutover, which used the legacy `install-skills.mjs`.

## What was wrong (L1, `node scripts/deploy.mjs audit`, 16 findings before)

- Codex saw all 43 grey-matter skills twice (`~/.codex/skills` + `~/.agents/skills`).
- Every installed `wrap-session` copy had 3 resource links escaping its root
  (`../../../docs/agents/...`), fixed upstream in `bca38f7`.
- Pulling tkt past its skills split left `~/.{kiro,codex,claude}/skills/tkt` as dead
  crew-era symlinks into `~/code/tkt/skills/tkt` (see ticket 85).
- tkt binary was 0.3.1 (a48557f, built from the local checkout); its `lint --dry-run`
  wrote files. An uncommitted tkt WIP note documenting that bug is saved as
  `~/.local/share/grey-matter/tkt-wip-lint-dry-run-caveat-2026-10-15.patch`.

## What to build

Snapshot, `node scripts/deploy.mjs`, remove the dead tkt links, `node tools/deploy.mjs`
in tkt, `cargo install tkt --version 0.4.0 --locked`, then verify.

## Acceptance criteria

- [ ] deploy.mjs audit shows no duplicate or root-escaping skills
- [ ] A fresh Kiro session lists the grey-matter and tkt-* skills; `tkt --version` is 0.4.0

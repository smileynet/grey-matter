---
id: "84"
title: "Resync this host after the install-skills cutover: deploy.mjs redeploy, tkt skill pack, tkt 0.4.0"
status: done
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

- [x] deploy.mjs audit shows no duplicate or root-escaping skills
- [x] A fresh Kiro session lists the grey-matter and tkt-* skills; `tkt --version` is 0.4.0

## Resolution (2026-10-26)

Redeployed grey-matter with deploy.mjs (47 skills; removed ~/.agents/skills duplicates), removed 3 dead crew-era tkt symlinks, deployed tkt's 4-skill pack, upgraded tkt 0.3.1 -> 0.4.0 release. Follow-ups: 85 (engine should catch dead legacy links), 87 (sa-system-setup shadows).

### Verification
1. ✓ deploy.mjs audit shows no duplicate or root-escaping skills — "node scripts/deploy.mjs audit: 16 findings -> 3, all 'unowned' foreign skills (AIM/Amazon/sa-system-setup); Codex duplicate set (43 skills via ~/.codex/skills + ~/.agents/skills) gone, ~/.agents/skills empty; 0 root-escaping resources. deploy.mjs check OK for grey-matter (47 skills) and tkt (4 skills). Snapshot: ~/.local/share/grey-matter/pre-redeploy-snapshot-20261026T225833Z.tar.gz"
2. ✓ A fresh Kiro session lists the grey-matter and tkt-* skills and tkt --version is 0.4.0 — "Fresh kiro-cli --no-interactive: lists tkt-core/tkt-orient/tkt-reconcile/tkt-work, no 'tkt' skill, orient/wrap-session/reconcile-tickets present, 'Done means evidenced' in standing rules. tkt --version = 0.4.0 (crates.io, repo smileynet/tkt). tkt validate passes in grey-matter, unity-robotics, herdr-flock, tkt. Skill tkt usage checked against tkt <cmd> --help: 0 real drift (10 hits, all prose/parser false positives). lint --dry-run left a non-normalized ticket unchanged, so the saved WIP caveat is obsolete."

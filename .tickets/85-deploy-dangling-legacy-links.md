---
id: "85"
title: "deploy.mjs leaves dead legacy symlinks when a pack drops a skill (tkt's 'tkt' after the tkt-core split)"
status: done
blocked_by: []
validation_criteria:
  - "A fixture with a dangling legacy link into the pack is detected and reported (or removed when provably the pack's own)"
  - "node scripts/check-repo.mjs passes and the engine is synchronized into tkt"
tags: ["stream:tooling", "type:enhancement"]
---

# deploy.mjs leaves dead legacy symlinks when a pack drops a skill (tkt's 'tkt' after the tkt-core split)

## Observed (2026-10-26, this host)

crew-research deployed tkt's skill as symlinks: `~/.{kiro,codex,claude}/skills/tkt ->
~/code/tkt/skills/tkt`. tkt then split that skill into `tkt-core`/`tkt-orient`/
`tkt-reconcile`/`tkt-work` and deleted `skills/tkt/`. After `git pull`, all three links
dangled and new sessions had no tkt skill. `node tools/deploy.mjs install` (the vendored
engine) installed the four new skills but neither reported nor removed the dead links;
`audit` listed them only as "unowned". Fixed on this host by hand (ticket 84).

Not verified: whether `39d8bdf` ("migrate legacy installer links before plugin upgrades")
covers the bare-root path; it did not here.

## What to build

Suggestion: in `install`/`audit`, flag a dangling symlink whose target is inside this
pack's checkout (provably the pack's own legacy deploy) and remove it on install; keep
refusing anything else. Synchronize the engine into tkt.

## Acceptance criteria

- [x] A fixture with a dangling legacy link into the pack is detected (and removed when provably the pack's own)
- [x] `node scripts/check-repo.mjs` passes and the engine is synchronized into tkt

## Resolution (2026-10-29)

deploy.mjs 1.7.0 sweeps each skill root it touches, both roots it installs into and known roots it releases: a symlink whose target is missing and resolves inside this pack's checkout (resolved and real path) is removed and logged as 'remove dead link NAME -> TARGET' (reported only under --dry-run). Live links and dead links pointing elsewhere are left alone. This covers the observed case: links to ~/code/tkt/skills/tkt after the four-skill split. Engine synced into tkt (2fc44f4); grey 1ec9e4f; changelog Fixed entries in both. This host has no dead links left (fixed by hand in ticket 84), and both real deploys ran clean. Artifacts: only test temp homes (removed by the tests); gate logs deleted.

### Verification
1. ✓ A fixture with a dangling legacy link into the pack is detected and reported (or removed when provably the pack's own) — "deploy.test.mjs 'install removes dead links into this pack's checkout, in used and unused roots, and keeps every other link' failed before the change and passes now; fixture covers a dead link in an installed root and in a released root, a dead foreign link and a live link into the pack; dry run removes nothing"
2. ✓ node scripts/check-repo.mjs passes and the engine is synchronized into tkt — "grey node scripts/check-repo.mjs all 16 groups ok with engines byte-identical (e7d166b4); deploy.test.mjs 45/45; tkt mise run check rc=0 (39 node tests, fmt, clippy, cargo test) and deploy-validation plus migrate-legacy 8/8"

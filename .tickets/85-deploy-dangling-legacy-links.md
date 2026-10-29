---
id: "85"
title: "deploy.mjs leaves dead legacy symlinks when a pack drops a skill (tkt's 'tkt' after the tkt-core split)"
status: in_progress
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

- [ ] A fixture with a dangling legacy link into the pack is detected (and removed when provably the pack's own)
- [ ] `node scripts/check-repo.mjs` passes and the engine is synchronized into tkt

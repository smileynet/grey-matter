---
id: "64"
title: "One deployer across projects (proposal 08): deploy.mjs, plugin.json as the pack manifest, vendored into tkt"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Proposal 08's three decisions are recorded (vendor vs depend, tkt on Node, portfolio list location)"
  - "grey-matter deploys through deploy.mjs, reading .claude-plugin/plugin.json; no harness sees a skill twice (OpenCode overlap covered by a test); build-agy-plugin.mjs retired"
  - "tkt deploys through a vendored tools/deploy.mjs; deploy-skills.sh is a wrapper; tests/deploy_skills.rs passes against it"
  - "deploy.mjs audit lists unowned dirs and cross-pack name collisions on this machine (the crew-research leftovers and testing-guide appear)"
tags: ["stream:tooling"]
---

# One deployer across projects (proposal 08): deploy.mjs, plugin.json as the pack manifest, vendored into tkt

## What to build

Proposal 08 ([docs/agents/proposals/08-unified-deploy.md](../docs/agents/proposals/08-unified-deploy.md)).
Each project that ships skills has its own deploy code: grey-matter's `install-skills.mjs` and
`build-agy-plugin.mjs`, tkt's `deploy-skills.sh`, godot-helper's `propagate-skills`. The copies
drift. The dual-deploy guard was written twice, and the bash copy shipped with a silent-exit bug
that tests caught. The fix is one dependency-free `deploy.mjs` that reads each project's
`.claude-plugin/plugin.json` (deploy-only settings go under `metadata.deploy`) and owns a single
harness table. From that table it makes sure no harness sees a skill twice, counting plugins too.
Projects vendor it at `tools/deploy.mjs`, and grey-matter checks the copies for drift.

Start by recording the three decisions at the end of the proposal, then build phases 1-3.

## Decisions (2026-10-23, accepted by the user)

1. **Vendor, don't depend.** Each project keeps a copy at `tools/deploy.mjs` with a version
   header, and grey-matter checks those copies for drift. tkt never needs a grey-matter checkout.
2. **tkt takes on Node for maintainer deploys.** `deploy-skills.sh` becomes a wrapper and the
   bash-4 requirement goes away. tkt CLI and plugin users need neither.
3. **The portfolio list lives in grey-matter,** not `~/.config`.

Phase 1 waits for the in-flight Codex plugin work in this checkout (`.codex-plugin/`, a Codex
guard in `install-skills.mjs`) to be committed. deploy.mjs folds that guard in.

## Acceptance criteria

- [x] Proposal 08's three decisions are recorded (vendor vs depend, tkt on Node, portfolio list location)
- [ ] grey-matter deploys through deploy.mjs, reading .claude-plugin/plugin.json; no harness sees a skill twice (OpenCode overlap covered by a test); build-agy-plugin.mjs retired
- [ ] tkt deploys through a vendored tools/deploy.mjs; deploy-skills.sh is a wrapper; tests/deploy_skills.rs passes against it
- [ ] deploy.mjs audit lists unowned dirs and cross-pack name collisions on this machine (the crew-research leftovers and testing-guide appear)

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

## Acceptance criteria

- [ ] Proposal 08's three decisions are recorded (vendor vs depend, tkt on Node, portfolio list location)
- [ ] grey-matter deploys through deploy.mjs, reading .claude-plugin/plugin.json; no harness sees a skill twice (OpenCode overlap covered by a test); build-agy-plugin.mjs retired
- [ ] tkt deploys through a vendored tools/deploy.mjs; deploy-skills.sh is a wrapper; tests/deploy_skills.rs passes against it
- [ ] deploy.mjs audit lists unowned dirs and cross-pack name collisions on this machine (the crew-research leftovers and testing-guide appear)

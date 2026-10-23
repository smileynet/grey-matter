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

TBD

## Acceptance criteria

- [ ] TBD

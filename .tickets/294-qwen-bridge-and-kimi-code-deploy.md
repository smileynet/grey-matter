---
id: "294"
title: "Add Qwen QWEN.md qualified-name bridge, promote Kimi Code CLI in deploy/install-agents-md, and trim long skill description"
status: open
blocked_by: []
validation_criteria:
  - "deploy.mjs qwen build emits QWEN.md bridge with contextFileName in staged qwen-extension.json (unit-tested)"
  - "deploy.mjs HARNESSES() and install-agents-md.mjs manage kimi-code (~/.kimi-code/skills and ~/.kimi-code/AGENTS.md) with duplicate protection (unit-tested)"
  - "repository-artifact-hygiene SKILL.md description is <= 500 chars with trigger front-loaded"
tags: ["stream:tooling", "kind:enhancement"]
---

# Add Qwen QWEN.md qualified-name bridge, promote Kimi Code CLI in deploy/install-agents-md, and trim long skill description

## What to build

Describe the change, why it is needed, and link its source (--spec or a #NN reference).

## Acceptance criteria

- [ ] Define an observable result and how to verify it.

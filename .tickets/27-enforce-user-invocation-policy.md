---
id: "27"
title: "Honor user-invoked skill policy in every target harness"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Every skill with disable-model-invocation true has an agents/openai.yaml sidecar with policy.allow_implicit_invocation false"
  - "Every Codex user-only skill is absent from the implicit-invocation catalog"
  - "Skill indexes classify invocation mode consistently with frontmatter"
tags: ["type:chore", "kind:bug", "stream:tooling"]
---

# Honor user-invoked skill policy in every target harness

## What to build

TBD

## Acceptance criteria

- [ ] TBD

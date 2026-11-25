---
id: "293"
title: "Fix check-guidance plugin roots, Kimi multiline description, DSH syntax keys, and model/research drift"
status: in_progress
blocked_by: []
validation_criteria:
  - "check-guidance discovers ~/.kimi-code/skills, linked Qwen extensions, and installed DSH bundles (unit-tested)"
  - "build-kimi-plugin handles YAML block-scalar descriptions without returning literal > or |"
  - "check-skill-syntax rejects DSH-forbidden camelCase invocation keys (unit-tested)"
  - "models-and-usage.md and harness-model-optimization-20261125.md match OpenCode v2.4.1, GPT-6.2/Gemini 4, and DSH bundle object schema"
tags: ["stream:tooling", "kind:bug"]
---

# Fix check-guidance plugin roots, Kimi multiline description, DSH syntax keys, and model/research drift

## What to build

Describe the change, why it is needed, and link its source (--spec or a #NN reference).

## Acceptance criteria

- [ ] Define an observable result and how to verify it.

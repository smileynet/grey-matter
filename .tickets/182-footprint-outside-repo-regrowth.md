---
id: "182"
title: "Detect footprint growth outside repository scratch"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Synthetic agent-home and runner-temp fixtures are reported as separate read-only families with active-state protections and explicit partial coverage."
  - "Paired snapshot fixtures flag regrowth only when prior cleanup is recorded; ordinary growth is distinguished from regrowth."
  - "Summary fixtures report free-space change and elapsed-time rate from valid same-volume samples; absent or invalid history is explicitly unavailable."
  - "A disposable checkout fixture proves tracked LFS payloads are not materialized or copied by the documented test-checkout pattern."
tags: ["stream:tooling"]
---

# Detect footprint growth outside repository scratch

## What to build

TBD

## Acceptance criteria

- [ ] TBD

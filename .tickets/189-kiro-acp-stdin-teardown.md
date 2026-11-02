---
id: "189"
title: "Diagnose: Kiro V3 ACP relay times out after stdin closes"
status: open
blocked_by: ["162"]
validation_criteria:
  - "The EOF teardown failure is reproduced or marked obsolete, separating successful prompt/cancel/load responses from process settlement."
  - "A supported shutdown sequence, fixed version or bounded workaround is verified without discarding sessions or treating a live descendant as settled."
  - "Owned processes, sessions and fixtures have recorded disposition; required checks pass and the driver guidance states the remaining limit."
tags: ["stream:orchestration", "kind:bug"]
---

# Diagnose: Kiro V3 ACP relay times out after stdin closes

## What to build

TBD

## Acceptance criteria

- [ ] TBD

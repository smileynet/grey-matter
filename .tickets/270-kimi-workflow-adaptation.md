---
id: "270"
title: "Adapt grey-matter workflow behavior for Kimi"
status: open
blocked_by: ["269"]
validation_criteria:
  - "The Kimi package exposes deliberate entry points for user-invoked workflows without weakening model invocation for skills that other skills call."
  - "Kimi orchestration and research guidance use sequential in-session execution unless the user explicitly authorizes delegated agents."
  - "Tracker-dependent workflows check and clearly report missing tkt CLI or tkt-core prerequisites."
  - "Focused invocation and behavior checks pass without changing existing harness behavior."
tags: ["triage:ready-for-agent", "kind:enhancement", "stream:tooling"]
---
## What to build

A Kimi user can deliberately start grey-matter workflows while model-invoked skills remain discoverable. Orchestration and research preserve user authorization by running sequentially unless delegation is explicitly requested, and tracker-dependent workflows clearly report missing tkt CLI or tkt-core prerequisites instead of improvising.

## Acceptance criteria

- [ ] The Kimi package exposes deliberate entry points for user-invoked workflows without weakening model invocation for skills that other skills call.
- [ ] Kimi orchestration and research guidance use sequential in-session execution unless the user explicitly authorizes delegated agents.
- [ ] Tracker-dependent workflows check and clearly report missing tkt CLI or tkt-core prerequisites.
- [ ] Focused invocation and behavior checks pass without changing existing harness behavior.
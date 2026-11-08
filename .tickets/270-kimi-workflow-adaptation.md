---
id: "270"
title: "Adapt grey-matter workflow behavior for Kimi"
status: done
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

- [x] The Kimi package exposes deliberate entry points for user-invoked workflows without weakening model invocation for skills that other skills call.
- [x] Kimi orchestration and research guidance use sequential in-session execution unless the user explicitly authorizes delegated agents.
- [x] Tracker-dependent workflows check and clearly report missing tkt CLI or tkt-core prerequisites.
- [x] Focused invocation and behavior checks pass without changing existing harness behavior.

## Resolution (2026-11-08)

done: generated Kimi commands from user-invoked frontmatter, added plugin-wide tkt prerequisites, and added Kimi-specific sequential orchestration/research boundaries while preserving other harness branches. Kept the rebuilt generated package for ticket 271; command-format scratch is not shipped.

### Verification
1. ✓ The Kimi package exposes deliberate entry points for user-invoked workflows without weakening model invocation for skills that other skills call. — "Built package exposes 19 generated commands matching all user-invoked skills; package test confirms model-invoked tdd needs no user-only shim and every command carries name plus arguments."
2. ✓ Kimi orchestration and research guidance use sequential in-session execution unless the user explicitly authorizes delegated agents. — "Packaged harness-kimi.md requires sequential execution without explicit delegation; research runs in-session on Kimi and research-audit refuses self-audit when independent delegation is unauthorized."
3. ✓ Tracker-dependent workflows check and clearly report missing tkt CLI or tkt-core prerequisites. — "Kimi skillInstructions require tkt --version and tkt-core before ticket workflows, with an explicit stop and no hand-edited ticket state; package test asserts both prerequisites."
4. ✓ Focused invocation and behavior checks pass without changing existing harness behavior. — "Three Kimi package tests and invocation-policy passed; docs-consistency passed; pre-merge passed kimi-plugin-package and ticket-graph; pre-push passed plugin-manifest, skill-syntax, invocation-policy, doc-links, home-path, and gates-coverage. Kimi validation remained 0 errors with 2 catalog-only override warnings."

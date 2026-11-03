---
id: "210"
title: "Qualify existing-agent Codex notification preparation"
status: in_progress
blocked_by: ["208"]
priority: medium
validation_criteria:
  - "Exact target and durable once-only preparation pass focused tests and independent source review"
  - "Owned existing-agent native receipt and correlated completion evidence with explicit limits"
  - "Skill guidance inventory gates deployment and artifact disposition verified"
tags: ["stream:orchestration", "type:chore"]
parent: "179"
assignee: "codex"
---
# Qualify existing-agent Codex notification preparation

## Intent

Bounded implementation child of #179 for the approved proposal 19 delivery. Reuse #208's local spool; do not claim that this qualifies other harnesses or completes #179.

## What to build

Prepare a fixed collaboration.followup_task action for one independently selected existing Codex agent. Persist a once-only intent before returning it, reject ambiguous replay, and keep native results separate from local state. The parent performs a bounded canary against its own worker, retaining exact-target native receipt and correlated completion evidence. Update owning skill, harness/role references and the complete tool inventory. No user conversation, provider switch, model-setting change or Agy action.

## Acceptance criteria

- [ ] Exact target/version/generation and accepted-record binding, durable once-only preparation and fail-closed unsupported/ambiguous inputs have focused regression coverage and independent exact-commit acceptance.
- [ ] Parent-owned existing-agent canary retains actual native invocation/receipt and correlated completion, duplicate suppression and precise untested boundaries; local acceptance alone cannot pass.
- [ ] Skill/catalog guidance, required current repository gates, deployment and artifact retention are verified; broader #179 remains explicitly partial.

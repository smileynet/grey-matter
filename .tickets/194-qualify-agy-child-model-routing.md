---
id: "194"
title: "Qualify agy child model routing before relying on per-role tiers"
status: in_progress
blocked_by: ["157"]
validation_criteria:
  - "Record request controls and independently interpretable native model evidence, or explicitly leave served identity unverified."
  - "Document a supported per-role setup or a bounded limitation; update the orchestration comparison."
tags: ["stream:orchestration", "type:research"]
---

# Qualify agy child model routing before relying on per-role tiers

## What to build

Follow up the [dated #157 probe](../docs/agents/research/harness-experimental-features-20261101.md#ticket-157-native-agy-workflows-2026-11-02). Workflow children requested through custom frontmatter `flash` and `pro`, and explicit workflow `model="pro"`, contained the same Flash Tiered labels in opaque `gen_metadata` blobs. An inherit control contained the parent's Argon Medium label. These labels have no verified public field contract: neither served model nor ignored configuration is established.

Inspect a supported native response/model field or first-party descriptor; compare custom `invoke_subagent` against workflow-created main agents, with explicit override and inherit controls. Keep requested configuration, route metadata and served identity separate. A worker naming its own model is not evidence. If the installed release cannot expose this, record that limit rather than reverse-engineering an unsupported pin claim.

Use a disposable local fixture and session-only settings. No production work should depend on per-role cost/capability tiers until this is qualified. This is a limitation of the agy comparison arm, not a blocker for unrelated harness trials. Native model-control histories from #157 are retained only through this diagnosis; their IDs and ownership are in its receipt.

## Acceptance criteria

- [ ] Record exact requests, native observations and the evidence contract (or its absence).
- [ ] Publish the supported setup or explicit limitation, refresh the comparison and dispose of retained probe histories.

---
id: "210"
title: "Qualify existing-agent Codex notification preparation"
status: done
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

- [x] Exact target/version/generation and accepted-record binding, durable once-only preparation and fail-closed unsupported/ambiguous inputs have focused regression coverage and independent exact-commit acceptance.
- [x] Parent-owned existing-agent canary retains actual native invocation/receipt and correlated completion, duplicate suppression and precise untested boundaries; local acceptance alone cannot pass.
- [x] Skill/catalog guidance, required current repository gates, deployment and artifact retention are verified; broader #179 remains explicitly partial.

## Resolution (2026-11-03)

done: bounded existing-agent Codex notification preparation and native receipt/completion evidence delivered in c474931. Native call output alone is not receipt; opaque argument bytes and local generation/version metadata limits retained. No global setting/model default changes; broader179 is not complete.

### Verification
1. ✓ Exact target and durable once-only preparation pass focused tests and independent source review — "PASS: native-notification.test.mjs8/8 parent and critic on exacta4110cc, strict trailing-arg refusal and once-only intent/exacttarget guards; accepted source unchanged in pushed c474931."
2. ✓ Owned existing-agent native receipt and correlated completion evidence with explicit limits — "PASS boundedcase: one existing idle owned Codex agent followup, native report and correlated completion; replay2records unchanged and duplicate preparation refused. Independent critic verified5original platform records. Opaque native arguments, busy/crash/otherharness cases unqualified."
3. ✓ Skill guidance inventory gates deployment and artifact disposition verified — "PASS: owning skill, Codex/role references and all136current scripts covered; current pre-merge2/2,pre-push5/5, deploy50 and pushc474931. Raw/runtime ownership and retention in orchestration-delivery-210-20261103.json; broad179 remains partial."

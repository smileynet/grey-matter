---
id: "201"
title: "Deferred: research and resolve Kiro ACP shutdown after other work"
status: backlog
blocked_by: ["189"]
priority: low
validation_criteria:
  - "Root-cause findings distinguish primary evidence from hypotheses and justify any new experiment."
  - "Any shutdown remedy is independently qualified against completed/cancelled/reload and descendant evidence, or its remaining limit is explicit."
  - "Workflow guidance, plan and dashboards are current; checks and artifact disposition are recorded."
tags: ["stream:orchestration", "type:research"]
---
# Research and resolve Kiro ACP shutdown after other work

## Intent and scheduling

The user asked on 2026-11-03 to close #189 with its known limitation and workflow workaround, then defer deeper investigation until other work is finished. This low-priority backlog ticket is intentionally outside the current execution cycle. Reopen for scheduling after higher-priority work; do not run unchanged model probes periodically.

## What to investigate

Start from the [accepted diagnostic report](../docs/agents/research/kiro-acp-shutdown-20261102.md), [raw evidence index](../docs/agents/research/evidence/kiro-acp-shutdown-20261102.json), and [release check](../docs/agents/research/evidence/kiro-acp-shutdown-release-check-20261103.json). On Kiro CLI 2.37.1 / KAS 0.66.70, completed and cancelled model-bearing sessions returned their native terminal responses, but EOF produced `the v3 engine did not exit within 5 seconds after ACP stdin closed` and exit 1, including after successful session/close. Owned descendants were absent at final polling in those runs; this does not qualify graceful shutdown generally.

Research primary upstream lifecycle documentation and available local code/logs to locate the engine/relay shutdown boundary and distinguish supported behavior from hypotheses. Check for a material version change or newly supported shutdown sequence before a model-bearing retest. Do not patch installed packages or global harness configuration. If a new bounded experiment is justified without an upstream change, record its distinguishing hypothesis and parent preflight first rather than repeating the existing cells. Never switch providers on limits.

Qualify any candidate with isolated owned processes, completed-turn and cancelled-permission cases, preserved session reload, exact exit/error classification, bounded descendant observation and retained raw evidence. Idle-only success is insufficient. Session deletion destroys durable state and is not a shutdown remedy. Keep task acceptance separate from teardown; do not retry successful work merely because this known teardown signature returned exit 1. See the [current workflow procedure](../skills/engineering/orchestrate/references/harness-kiro.md#v3-acp-shutdown-workaround).

## Retention ownership

Parent orchestration integration retains ownership of the four #189 model-bearing sessions and their raw files indexed in the diagnostic receipt, plus the private wrong-checkout review provenance. Keep them for this follow-up's root-cause comparison until a qualifying retest/resolution records recovery and an explicit disposition. Closing #189 does not release them. The original #162 session is outside this ticket's cleanup scope. Unknown ownership remains protected.

## Acceptance criteria

- [ ] Dated primary-source/local evidence identifies a supported remedy or narrows the root cause with observed facts separated from hypotheses; unchanged probes are not counted as new proof.
- [ ] A justified candidate receives isolated completed/cancelled/reload/descendant checks and independent review of the exact final commit and raw evidence; unavailable or unsuccessful qualification stays explicit.
- [ ] Current workflow guidance and both dashboards reflect the result, required repository checks are classified, and retained artifacts have an owner and explicit disposition.

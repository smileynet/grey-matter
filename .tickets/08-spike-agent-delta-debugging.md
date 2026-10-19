---
id: "08"
title: "Spike: agent-driven delta debugging (ddmin bisection) vs linear cut in diagnosing-bugs"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "A written finding on whether an agent should bisect (ddmin-style) rather than linearly cut when minimising a repro, with the tradeoff and a recommendation"
  - "Decision reflected in diagnosing-bugs Phase 2 wording (or explicitly deferred)"
tags: ["type:research", "stream:skills-review"]
spec: "spike-agent-delta-debugging"
---

# Spike: agent-driven delta debugging (ddmin bisection) vs linear cut in diagnosing-bugs

## What to build

TBD

## Acceptance criteria

- [x] TBD

## Resolution (2026-10-14)

Decided: keep linear minimisation as default, add bisect (ddmin) for large inputs + git bisect for commit axis, gated on re-asserting the original symptom. Applied to diagnosing-bugs Phase 2; finding at docs/agents/research/spike-agent-delta-debugging.md.

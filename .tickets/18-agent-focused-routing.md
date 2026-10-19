---
id: "18"
title: "Test an agent-focused routing skill (adapt the router or create a separate agent-router)"
status: backlog
blocked_by: ["17"]
priority: low
validation_criteria:
  - "A test of whether the model self-routes well from the router map when it is unsure which skill applies (measured against real prompts, not assumed)"
  - "A decision: the single router serves both human discovery and agent self-routing, OR a separate leaner agent-router exists optimized for model invocation (lower context cost, trigger-shaped)"
  - "If split, the agent-router and human router stay in sync (same underlying skill inventory, one source of truth)"
tags: ["type:research", "stream:skills-review"]
---

# Test an agent-focused routing skill (adapt the router or create a separate agent-router)

## What to build

Test whether a single router serves both human discovery and **agent self-routing**, or
whether a separate leaner agent-router is warranted.

The main router (currently `ask-matt`, renamed per ticket 17) is being made
model-invokable so the agent can consult the map when it is unsure which skill applies.
But a dense human-orientation map and a lean agent-routing index have different optimal
shapes: the human version is a narrative map (flows, on-ramps, lanes); an agent version
would be trigger-shaped (symptom -> skill) and minimal to keep per-session context cost
low.

### Investigate

- Does the model actually self-route well from the human-facing map, measured against
  real "which skill do I use for X" prompts, not assumed?
- Is the always-loaded context cost of a model-invokable dense router acceptable, or does
  it argue for a leaner agent-router description?
- If split, how do the two stay in sync (one skill inventory as the source of truth; the
  agent-router generated from or linted against the same set as the human router).

### Decide

Adapt the single router to serve both, OR create a separate agent-router. Blocked by
ticket 17 (the naming/grouping/maintenance strategy sets the shape this builds on).

## Acceptance criteria

- [ ] A test of whether the model self-routes well from the router map against real prompts, not assumed
- [ ] A decision: single router serves both, OR a separate leaner agent-router optimized for model invocation (lower context cost, trigger-shaped)
- [ ] If split, the agent-router and human router stay in sync (one skill inventory as source of truth)

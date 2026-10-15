---
id: "09"
title: "Spike: shell-invoked fresh agent (kiro-cli/codex/claude) vs subagent for fresh-context tasks"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "A written finding on when to use a shell-invoked harness CLI (kiro-cli/codex/claude -p) for a fresh-context read vs a subagent, with tradeoffs (isolation, cost, portability, output capture)"
  - "Decision reflected where fresh-context reads are specified (retro step 2, and any similar), or explicitly deferred"
tags: ["type:research", "stream:tooling"]
---

# Spike: shell-invoked fresh agent (kiro-cli/codex/claude) vs subagent for fresh-context tasks

## Context

`retro` (and potentially other skills) needs a **fresh-context** read of a session to
avoid self-retrospective bias. We chose **subagents** as the default now. The
alternative is a **shell-invoked fresh agent**: prompt the harness CLI as a subprocess
(`kiro-cli`, `codex exec`, `claude -p`, etc.), which gives a genuinely clean process and
context, not just a child agent inside the same session.

Backlog: not blocking; subagents work today. Spike when it matters whether "fresh" needs
to be a separate *process* (true isolation) rather than a subagent (fresh context, same
harness).

## What to investigate

- **When a subprocess beats a subagent** for a fresh-context task: true process/context
  isolation, no inherited session state, running a *different* harness than the current
  one.
- **Costs and friction**: capturing the subprocess's output back into the calling agent,
  non-interactive invocation flags per CLI, auth/environment, cross-platform (Windows
  runs these under their native shells), token/latency cost.
- **Portability**: the three target harnesses (kiro-cli, codex, Claude Code) each have a
  non-interactive mode; confirm the invocation shape for each and whether a skill can
  stay harness-neutral or must branch.
- **Recommendation**: a rule for when a skill should reach for a shell-invoked fresh
  agent vs a subagent, and update retro step 2 (and any similar fresh-context step)
  accordingly, or record that subagents suffice and close.

## Acceptance criteria

- [ ] A written finding on when to use a shell-invoked harness CLI (kiro-cli/codex/claude -p) for a fresh-context read vs a subagent, with tradeoffs (isolation, cost, portability, output capture)
- [ ] Decision reflected where fresh-context reads are specified (retro step 2, and any similar), or explicitly deferred

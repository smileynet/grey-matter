---
id: "149"
title: "reconcile-tickets runs a priority review over workstreams, queue and blockers"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Review flags inversions and stuck tickets"
  - "Facts come from tool output"
tags: ["stream:tooling", "type:enhancement"]
---

# reconcile-tickets runs a priority review over workstreams, queue and blockers

## Origin

Field report from philippines-trip, 2026-11-01 (prioritization review, location planning and a Codex worktree takeover). Sam asked for these to be filed.

## What happened

A prioritization review needed the same ad-hoc script three times to group tickets by workstream with queue position, priority and unfinished blockers. Reading tickets by hand produced two wrong claims (a ticket said to have every criterion ticked; another said to be permanently blocked).

## Acceptance criteria

- [ ] reconcile-tickets gains a priority-review step that reports: priority/queue inversions, tickets queued before their prerequisites, open tickets stuck behind backlog ones, missing priorities, and open tickets whose criteria are all ticked.
- [ ] The step quotes tool output (tkt query, or a project script such as philippines-trip #204) rather than hand-read ticket facts.
- [ ] Related: #118.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain priority/queue review ownership. Respect the new explicit outcome contract and scope revisions; planned order is separate from structural dependencies, and #201 remains deferred.

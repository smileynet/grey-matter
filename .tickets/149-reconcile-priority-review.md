---
id: "149"
title: "reconcile-tickets runs a priority review over workstreams, queue and blockers"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "Review flags inversions and stuck tickets"
  - "Facts come from tool output"
tags: ["stream:tooling","kind:enhancement","epic:outcome-orchestration"]
assignee: "codex"
---

# reconcile-tickets runs a priority review over workstreams, queue and blockers

## Origin

Field report from philippines-trip, 2026-11-01 (prioritization review, location planning and a Codex worktree takeover). Sam asked for these to be filed.

## What happened

A prioritization review needed the same ad-hoc script three times to group tickets by workstream with queue position, priority and unfinished blockers. Reading tickets by hand produced two wrong claims (a ticket said to have every criterion ticked; another said to be permanently blocked).

## Acceptance criteria

- [x] reconcile-tickets gains a priority-review step that reports: priority/queue inversions, tickets queued before their prerequisites, open tickets stuck behind backlog ones, missing priorities, and open tickets whose criteria are all ticked.
- [x] The step quotes tool output (tkt query, or a project script such as philippines-trip #204) rather than hand-read ticket facts.
- [x] Related: #118.

- [x] A fixture containing tagged, untagged and unrelated tickets admits only the declared workstream and reports excluded context separately.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain priority/queue review ownership. Respect the new explicit outcome contract and scope revisions; planned order is separate from structural dependencies, and #201 remains deferred.

## Accepted orchestration retro amendment (2026-11-04)

Sam approved applying and implementing these retro proposals after #179. Verify
exact tag membership when selecting an execution queue; scoped tkt queries also
include untagged tickets. Retain excluded tickets as visible context rather than
silently admitting them or hiding external blockers. Query full-board facts without
changing the owner's stored context.

## Resolution (2026-11-04)

done: fact-based reconciliation now reviews exact-scope queue membership and ordering/blocker/criteria facts without changing tickets or adopted order. Excluded tickets stay visible as context; missing evidence is not silently normalized into a pass. Source/guidance/independent full-criteria review promoted through docs/agents/research/retro-amendments-delivery-20261104.md. New parent-owned batch logs/packets kept through wrap disposition; reused worktree evidence and private171 preserved. No automatic queue reset, global hook or model/provider change.

### Verification
1. ✓ Review flags inversions and stuck tickets — "Read-only priority-review operator flags open/backlog prerequisites, queue-before-prerequisite, missing priorities, fully checked review criteria and open-ticket priority inversions as advisories. Exact tag membership is distinct from excluded context, out-of-scope queue IDs and external/unknown blockers; malformed data and duplicate queue IDs fail. Six focused fixtures PASS with no skips; adopted queue is never rewritten."
2. ✓ Facts come from tool output — "Actual installed/source CLI on current full native query matched30 epic members and219 excluded rows, with2 priority advisories and no external/unknown blockers; native full-query comparison independently matches. Counter handles original/amendment criteria and ignores fenced examples; counts remain advisory, tkt close authoritative. Exact independent98ac700/d239371 accepted; current syntax/docs/catalog153, actual prepush5 and deployed50skillsPASS. Durable report/review docs/agents/research/retro-amendments-delivery-20261104.md."

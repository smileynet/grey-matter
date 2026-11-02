---
id: "116"
title: "Derive current delivery summaries from scoped evidence records"
status: in_progress
blocked_by: []
validation_criteria:
  - "Worked records distinguish distributed availability from pending installation/account/accessibility/retention observations for the same build and audience."
  - "A seeded current-summary mismatch fails and repaired state passes; dated historical summaries remain valid."
  - "A custom execution queue is preserved despite different raw frontier sorting; no false dependency is introduced."
  - "Guidance reuses an existing registry when present and applicable fixtures plus `node scripts/gate.mjs pre-merge` pass."
tags: ["stream:test-verification"]
priority: medium
---

# Derive current delivery summaries from scoped evidence records


## Intent

Sam requested a shared improvement after multiple documents described obsolete builds as current while newer distributed builds and pending physical pilots existed. Appending another current paragraph did not remove the contradiction.

## What to build

Extend existing delivery-dashboard/reconcile guidance with a scoped current-readiness record or adapter to an adopter's existing registry. Define current identity by product/platform/build/channel/effective audience and separately record installation, account, retention and accessibility observations with evidence path/date, ownership and relevant inputs. Availability must not imply installation or human acceptance.

Generate current summaries from that record and preserve dated historical evidence. Detect mismatches structurally; do not scan for words such as pending or rewrite historical reports as current. Respect the project's explicit execution policy while dependencies remain structural truth; a raw `tkt ready` listing is not authority to override an adopted queue. Keep real dependencies separate from preferred execution order.

Coordinate with #118 for dashboard order and #106 for verification attempts; the Philippines Trip #79 owns its concrete readiness schema. This ticket supplies an adoptable contract and worked example, not a second registry in every adopter. Read `skills/productivity/delivery-dashboard`, `skills/meta/reconcile-tickets` and their references before selecting the smallest shared owner.

## Acceptance criteria

- [ ] Worked records distinguish distributed availability from pending installation/account/accessibility/retention observations for the same build and audience.
- [ ] A seeded current-summary mismatch fails and repaired state passes; dated historical summaries remain valid.
- [ ] A custom execution queue is preserved despite different raw frontier sorting; no false dependency is introduced.
- [ ] Guidance reuses an existing registry when present and applicable fixtures plus `node scripts/gate.mjs pre-merge` pass.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: reuse the existing readiness-record/registry boundary and demonstrate a mismatched current
summary failing while dated history remains valid. Coordinate #106 attempts, #115 preservation
evidence and #118 queue semantics without implementing the separate dashboard queue feature or
inventing dependency edges.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

The first worker draft e2f478d was not accepted as complete: the critic correctly found that a stale ticket-snapshot test did not prove active-build/current-summary identity consistency. Worker added the opt-in stateless compareReadinessIdentity public API in ebbb5b5, then d3485b0 covered extra fields on both sides. Root found an existing regression had been removed and an unrelated history-array assertion was tautological; worker restored the original coverage and removed that assertion in 8fb63d7. Renewed critic Spec/Standards and data-modeling review accepted the final boundary: exact canonical product/platform/build/channel/effectiveAudience IDs, malformed/missing/extra inputs fail closed, no state/registry persistence or renderer coupling. Worker dashboard fixtures passed 35/35; root merged and forced main pre-merge 4/4 (ticket-graph 0.3 s, syntax fixtures 0.3 s, guidance 1.0 s, dashboard-contract 1.5 s), then pre-push 6/6 passed. No actual adopter readiness, provider/device/account/retention/accessibility state was validated. Adopter truth/projection remains external; dated history is outside this optional identity API. A,B,C frontier versus adopted B,A,C queue is documented without false dependencies.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

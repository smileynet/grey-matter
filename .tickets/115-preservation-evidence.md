---
id: "115"
title: "Require positive scoped evidence for preservation claims"
status: in_progress
blocked_by: []
validation_criteria:
  - "Worked examples correctly classify healthy service plus empty inventory as service-only evidence and nonempty matched observations as scoped preservation evidence."
  - "Fixtures or behavioral review reject zero bytes/files, missing baseline, scope mismatch and changed identity/hash; valid unchanged observations pass."
  - "Guidance states observation limits and preserves authorization boundaries without forcing simulator/device tests for worker-only assertions."
  - "Applicable fixtures and `node scripts/gate.mjs pre-merge` pass."
tags: ["stream:test-verification"]
priority: medium
---

# Require positive scoped evidence for preservation claims


## Intent

Sam requested this follow-up after an initial worker smoke selected a completed job with zero retained files. The operator corrected the sample to four files with matching prior observations before the meaningful monitoring window. Final deployment proof was valid; this ticket addresses the recovered verification gap, not an observed data loss.

## What to build

In existing test/verification guidance, distinguish service health, inventory success and byte preservation. A preservation claim needs an explicitly selected nonempty fixture, positive total bytes, matching expected coverage and fresh before/after paths, resource identities and checksums. Bind the observations to the relevant source/configuration, manager version, job and root. Missing observations, malformed or duplicate identities, changed content or zero coverage must not pass. Do not require inode semantics on providers that lack them; name and test the provider's actual identity contract.

Require preflight fixture selection before an operation whose preservation is being evaluated. Two observations prove only the selected resources at those instants; they do not prove continuity, staging exclusion, installed-device retention, all-copy erasure or deletion authority. Keep synthetic tests and live evidence distinct. Cheapest faithful environment and cadence belong to #119; stateful ownership belongs to #104. Add shared guidance to an existing owner/reference; do not invent an unrelated deployment skill solely for this incident.

The source project's #68 now has a bounded worker capture/verify validator with 12 fixture tests; broader coordination remains open. Its #88 owns reusable reporting. Study the contract rather than copy its private SSH configuration or make this pack depend on that project.

## Acceptance criteria

- [ ] Worked examples correctly classify healthy service plus empty inventory as service-only evidence and nonempty matched observations as scoped preservation evidence.
- [ ] Fixtures or behavioral review reject zero bytes/files, missing baseline, scope mismatch and changed identity/hash; valid unchanged observations pass.
- [ ] Guidance states observation limits and preserves authorization boundaries without forcing simulator/device tests for worker-only assertions.
- [ ] Applicable fixtures and `node scripts/gate.mjs pre-merge` pass.

## Workstream reconciliation 2026-11-02

Scope: `stream:test-verification`; execution order and completion requirements are in the
[workstream plan](../docs/plan.md#test-optimization-and-verification).

Next: qualify preservation claims with nonempty matching before/after resources, rejecting zero
coverage, missing baseline and identity/hash mismatch. #104 owns stateful contracts, #119
environment selection and #113 portable bundle hashes; these related tickets are ordering/context,
not newly invented blockers.

Status remains open. This reconciliation adds no implementation or fresh host-validation claim;
verify the ticket's premises against current source and run its acceptance checks when picked up.

## Delegated implementation 2026-11-02

Worker commit de12779 extended only the existing environment ladder's evidence owner. Critic Spec and Standards review accepted positive preselected coverage, provider-specific identity/checksums and two-observation scope limits. Zero bytes/files, absent baseline, missing or extra paths, scope/root mismatch and changed identity/hash were reviewed as guidance scenarios, not a live provider experiment. Worker docs consistency passed and syntax fixtures passed 10/10. Root merged and forced main pre-merge 3/3 commands (ticket-graph 0.4 s, syntax fixtures 0.4 s, guidance 1.3 s), then pre-push 2/2 selected checks passed. No private provider, SSH, device or deletion authority was used or inferred.

Delivery dashboard: [current status](../docs/status.html). The shared renderer is unchanged;
strict source/data checks and critic source review pass. Actual laptop/phone visual review
remains pending because browser policy blocked local-file access; human review was requested.
[Observation limits](../docs/agents/research/evidence/dashboard-ui-20261102.json) preserve that boundary.
Root owns merge, deployment and native ticket closure. Worker worktrees are recycled after
integration; local commit history and this evidence remain in Git. The current deployment
package is retained until the next deployment.

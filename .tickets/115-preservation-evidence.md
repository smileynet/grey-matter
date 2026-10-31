---
id: "115"
title: "Require positive scoped evidence for preservation claims"
status: open
blocked_by: []
validation_criteria:
  - "Behavioral scenarios verify the reported session failure and corrected outcome"
  - "Guidance has one maintained owner with scoped implementation and evidence limits"
  - "Applicable fixtures and repository consistency gate pass"
tags: ["stream:tooling"]
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
- [ ] Applicable fixtures and `node scripts/check-repo.mjs` pass.

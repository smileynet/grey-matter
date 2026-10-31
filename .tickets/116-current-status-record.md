---
id: "116"
title: "Derive current delivery summaries from scoped evidence records"
status: open
blocked_by: []
validation_criteria:
  - "Behavioral scenarios verify the reported session failure and corrected outcome"
  - "Guidance has one maintained owner with scoped implementation and evidence limits"
  - "Applicable fixtures and repository consistency gate pass"
tags: ["stream:tooling"]
---

# Derive current delivery summaries from scoped evidence records


## Intent

Sam requested a shared improvement after multiple documents described obsolete builds as current while newer distributed builds and pending physical pilots existed. Appending another current paragraph did not remove the contradiction.

## What to build

Extend existing delivery-dashboard/reconcile guidance with a scoped current-readiness record or adapter to an adopter's existing registry. Define current identity by product/platform/build/channel/effective audience and separately record installation, account, retention and accessibility observations with evidence path/date, ownership and relevant inputs. Availability must not imply installation or human acceptance.

Generate current summaries from that record and preserve dated historical evidence. Detect mismatches structurally; do not scan for words such as pending or rewrite historical reports as current. Respect the project's explicit execution policy while dependencies remain structural truth; a raw `tkt ready` listing is not authority to override an adopted queue. Keep real dependencies separate from preferred execution order.

Coordinate with #112 for dashboard order and #106 for verification attempts; the Philippines Trip #79 owns its concrete readiness schema. This ticket supplies an adoptable contract and worked example, not a second registry in every adopter. Read `skills/productivity/delivery-dashboard`, `skills/meta/reconcile-tickets` and their references before selecting the smallest shared owner.

## Acceptance criteria

- [ ] Worked records distinguish distributed availability from pending installation/account/accessibility/retention observations for the same build and audience.
- [ ] A seeded current-summary mismatch fails and repaired state passes; dated historical summaries remain valid.
- [ ] A custom execution queue is preserved despite different raw frontier sorting; no false dependency is introduced.
- [ ] Guidance reuses an existing registry when present and applicable fixtures plus `node scripts/check-repo.mjs` pass.

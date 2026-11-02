---
id: "150"
title: "Add an optional product map (jobs, workflows, feature status) to the delivery dashboard"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "The delivery-dashboard contract defines an optional product map: user jobs, their workflows (steps), and features with status (built, in flight, needs work, planned, deferred), where each was verified, and linked tickets."
  - "The template renders it as a tab with by-job and by-status views, needs work first, with filters and accessible status colours in light and dark."
  - "check-dashboard validates the schema: known statuses, an issue for needs-work rows, and tickets that exist on the board."
---

# Add an optional product map (jobs, workflows, feature status) to the delivery dashboard

## Intent source

The tagalog-helper owner asked on 2026-11-01 to break that app down by learner jobs-to-be-done, UX workflows, and built, in-flight, needs-work, planned and deferred features. It shipped as a Product map tab: tagalog-helper commit `f919c5c`, data in `docs/product-map.json`, validated in `scripts/update_delivery_dashboard.mjs`.

## Lessons to carry over

- Every status needs a "verified where" tag (phone, simulator, web, tests, unconfirmed). Without it, "built" mixed Simulator-only and phone-accepted work, which the critic flagged.
- Delivery steps (getting it onto the device, releases) are owner work, not user jobs. Keep them in a separate strip.
- The by-status board should lead with needs work and in flight, and fold built and deferred.
- Light-mode status colours need darker values to reach 4.5:1 at small sizes.

## Acceptance criteria

- [ ] Contract section and schema documented; template tab renders a sample map.
- [ ] Checker validates the schema and fails a seeded bad status or missing issue.
- [ ] `node scripts/gate.mjs pre-merge` passes.

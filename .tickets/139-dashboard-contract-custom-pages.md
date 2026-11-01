---
id: "139"
title: "Validate the delivery-dashboard contract on custom dashboard pages"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "check-dashboard.mjs validates the contract against a custom page through a documented data hook, not only the shipped template."
  - "The contract checks: Needs you first, at most five recent entries open, older entries in a searchable history, a plan tab of unfinished work, and completed tickets only in history."
  - "A migration note explains how a custom dashboard either adopts the template or exposes the data hook."
---

# Validate the delivery-dashboard contract on custom dashboard pages

## Intent source

tagalog-helper session, 2026-10-31/11-01. The owner asked to restructure that project's custom dashboard (`docs/portrait-store-loop-review.html` + `docs/delivery-dashboard.js`), then to file grey-matter follow-ups.

## What happened

The project's dashboard predates the skill template and drifted from the contract in `skills/productivity/delivery-dashboard/references/dashboard-contract.md`:
- every ticket, open and closed, sat in one list;
- the plan was prose above the diagram;
- there was no "Needs you" box;
- every entry was expanded.

The skill's `check-dashboard.mjs` only understands the template's `gm-*` blocks, so it could not detect any of this. The fix was done by hand, in tagalog-helper commits `63c9797` and `f919c5c`.

## What to build

A data hook (for example `window.deliveryDashboard` or a JSON file the page declares) that `check-dashboard.mjs` can validate the contract against, whatever the renderer. Keep the template as the default for new projects.

## Acceptance criteria

- [ ] The checker passes on the template and on a fixture custom page exposing the hook, and fails each contract rule on a seeded fixture.
- [ ] The skill documents the hook and the migration choice.
- [ ] `node scripts/check-repo.mjs` passes.

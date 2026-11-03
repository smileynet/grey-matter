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
  - "Post-closure checks compare the complete authoritative board with maintained current-looking plan and dashboard projections before publication"
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
- [ ] `node scripts/gate.mjs pre-merge` passes.

## Outcome-driven orchestration coordination

Proposal 19 approved. Retain custom-dashboard contract ownership; #205 publication preflight should accept existing supported receipt inputs without forcing custom pages into the shipped renderer.

## Accepted post-closure consistency follow-up — 2026-11-03

Sam requested filing the Tagalog Helper retrospective follow-ups. Extend this existing
dashboard data-hook/contract scope: source ticket 213 closed successfully while its
maintained Markdown plan retained an earlier status until explicit repair. Source ticket
92 subsequently added a read-only comparison across the full board, maintained plan and
generated dashboard. Independent review also caught authored presentation data overriding
ticket facts and scoped tracker queries omitting work; the source implementation now
rejects both. This context is self-contained and needs no private project data.

After closure and explicit refresh, compare the complete authoritative board with all
maintained current-looking projections before publication. Reuse existing tracker and
project comparison commands, or a small documented custom-page adapter. Check status and
coverage plus stale generated data/body identities. Keep authoring fields from overriding
authoritative ticket facts. Reject active tracker contexts without silently clearing the
owner's context; the existing snapshot helper already owns that full-board boundary.

Preserve authored execution order, notes, separately namespaced historical branch views
and the project's choice to retain or retire a Markdown plan. Keep the close → explicit
sync → refresh → publication sequence possible: do not install a blanket hook requiring
the future dashboard refresh inside the tracker's earlier closure commit. A successful
refresh or valid review receipt alone does not establish ticket-projection freshness.
Closed #116 supplies current-build/readiness identity and #205 supplies publication
source/receipt integrity; this addition covers the remaining ticket/plan projection gap.

- [ ] Seeded closed-ticket/stale-plan, missing-row and stale-generated-data scenarios fail; explicitly refreshed template and supported custom projections pass.
- [ ] Authored ticket-fact overrides and scoped board queries cannot produce a passing full-board verdict.
- [ ] Checks preserve authored ordering and historical namespaces, report drift without automatic repair, and support the tracker's close-before-refresh workflow.
- [ ] Delivery/reconciliation guidance points to the maintained comparison owner and names coverage limits; applicable fixtures and repository gates pass.

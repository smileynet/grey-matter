---
id: "139"
title: "Validate the delivery-dashboard contract on custom dashboard pages"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "check-dashboard.mjs validates the contract against a custom page through a documented data hook, not only the shipped template."
  - "The contract checks: Needs you first, at most five recent entries open, older entries in a searchable history, a plan tab of unfinished work, and completed tickets only in history."
  - "A migration note explains how a custom dashboard either adopts the template or exposes the data hook."
  - "Post-closure checks compare the complete authoritative board with maintained current-looking plan and dashboard projections before publication"
tags: ["stream:tooling","epic:outcome-orchestration"]
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

- [ ] Seeded closed-ticket/stale-plan, missing-row and stale-generated-data scenarios fail; explicitly refreshed template and supported custom projections pass.
- [ ] Authored ticket-fact overrides and scoped board queries cannot produce a passing full-board verdict.
- [ ] Checks preserve authored ordering and historical namespaces, report drift without automatic repair, and support the tracker's close-before-refresh workflow.
- [ ] Delivery/reconciliation guidance points to the maintained comparison owner and names coverage limits; applicable fixtures and repository gates pass.
- [x] A non-rendering change preserves an accepted receipt; a rendering-input change invalidates affected acceptance.
- [x] Guidance identifies affected views and preserves acceptance for unchanged independently scoped views.

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


## Accepted orchestration retro amendment (2026-11-04)

Sam approved applying and implementing these retro proposals after #179. After
upstream reconciliation, compare declared rendering inputs before renewing review.
Reuse a current accepted receipt for unchanged sources and captures; changed inputs
require affected checks, captures and renewed review. Reuse existing receipt IDs,
not another hash system. This does not waive required visual acceptance or prove
freshness of the whole board.


## Note — 2026-11-04

By: codex

<!-- tkt-note:v1 64320-1793818218521580200 -->
Accepted retro amendment delivered in 2569dfb: read-only receipt inspect compares existing identity, declared source/capture membership and scope; current accepted independent view reusable, changed/shared input invalidates affected receipts. Exact independent review accepted; receipt fixtures19/19 PASS, publication regressions10/10 PASS, parent premerge3/3 and actual prepush6/6 PASS. Real effort receipt remained current; separate changed status page correctly returned stale with only docs/status.html changed. This is scoped evidence, not browser or whole-board proof. Amendment AC8-9 checked. Original custom data-hook, whole-board projection and related AC1-7 remain unmet/pending; ticket returned open, never falsely closed. No global hooks, new hash system or partial-manifest waiver. New raw check/review logs retained parent-owned through accepted-amendment batch/wrap disposition; tracked source and guidance promoted.

## Note — 2026-11-04

By: codex

<!-- tkt-note:v1 61056-1793820136037938100 -->
Verification bookkeeping correction: native edit --ac only addresses the canonical Acceptance criteria section; the earlier note said amendment8-9 checked before those extra-section bytes changed. The accepted requirements are now centralized in that section: original7 remain unchecked, only the two evidenced receipt-comparison amendment criteria are checked. No original requirement was waived or status closed. Proof remains2569dfb plus docs/agents/research/retro-amendments-delivery-20261104.md; tracker display now matches actual bytes.

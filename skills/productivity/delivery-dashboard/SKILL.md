---
name: delivery-dashboard
description: "Keep one dark, blue status dashboard current after every closed ticket: what the person can now do, what needs their input, recent entries at a glance, a searchable history and a Plan tab of every ticket. Use after closing a ticket or finishing other work worth surfacing, when asked for a status, progress or plan view, to collect project decisions (including grill-session questions), or to update the dashboard."
---

# Delivery Dashboard

The tracked helpers' roles and operator boundaries are indexed in
[the tool-script catalog](../../engineering/orchestrate/references/tool-scripts.md).

One durable HTML page, updated after each closed ticket, that lets the owner see what changed for
them, where you need them and what comes next. Write for that reader. The process behind the work
stays out of the way, under folds and links.

1. **Find or create the dashboard.** Read the existing one and the work just finished. If none
   exists, copy the blank [template](assets/dashboard-template.html) to one committed `docs/`
   path (for example `docs/status.html`), set the project name in `gm-config`, and record the
   path on the originating ticket and in `AGENTS.md` so the next task finds it. Edit only the
   `gm-config` and `gm-entries` blocks by hand; `gm-tickets` is generated (step 5) and the
   renderer stays as shipped so every project's dashboard behaves alike. For a first entry, read
   the finished [worked example](assets/dashboard-example.html) and its
   [walkthrough](references/worked-example.md) to see the voice and shapes expected.

2. **Add one entry per closed ticket, newest first.** Lead with the feature in the person's
   terms: what they can now do, see or decide, in plain words. Name the ticket in `tickets`; the
   page shows it under Details only. Then, in this order of importance:
   - **Asks.** Anything you need from them becomes an `asks` item with a recommendation, an
     impact and options, so they can answer in a word. Mark answered asks `answered`; never
     delete them. Do not ask the user to review the dashboard, test screen sizes, confirm
     its appearance or provide feedback. The user gives dashboard feedback when needed.
     Unavailable visual checks belong in `details` as limitations, not in `asks`.
   - **One visual, required on a ticket entry.** Show the feature: a live screenshot of shipped
     work, a mock of partial work, a wireframe of planned work. A ticket with nothing the person
     can see (tooling, tests, release work) gets a `steps` visual of where it moved the plan. See
     the visual table in the [contract](references/dashboard-contract.md#visuals-that-earn-their-place).
   - **Fidelity.** Label anything that is not live with its rung.

   | Rung | What the visual represents |
   | --- | --- |
   | **Wireframe** | Nothing built yet; a sketch of the intended experience. |
   | **Mocked** | Partially built; real layout with representative or stubbed data. |
   | **Live** | Shipped; real data or the actual working experience. |

   Move a visual up the ladder only when its evidence supports the new label. Work worth
   surfacing that had no ticket gets an entry too, without `tickets`.
   When an entry summarizes release or pilot readiness, follow the contract's
   [current delivery readiness guidance](references/dashboard-contract.md#current-delivery-readiness).

3. **Collect project decisions.** When planning, design or a grill session needs the user's
   judgment, add a decision to `gm-config.decisions` immediately, even before a ticket closes.
   Follow the [decision contract](references/dashboard-contract.md#project-decisions): radio
   options with the recommendation selected, its reason, and an open text box for another answer
   or context. Needs you links to the same decision. The bottom button copies all pending answers
   for the user to paste into chat, with selectable text when copying is unavailable. Selections
   are drafts; record an answer only after the user submits it in chat, and retain answered history.

4. **Keep the sausage out of sight.** Headline, summary and the three visible changes carry no
   ticket numbers, commit hashes, file paths, tool names, test counts or refactoring talk. Put
   evidence, commands and detail under `details` and `links`. Reuse the wording discipline of
   [changelog](../../meta/changelog/SKILL.md) for user value.

5. **Refresh the Plan tab.** Run `node <this skill's directory>/scripts/snapshot-tickets.mjs
   <file>`. It rewrites only `gm-tickets` from the full tkt board, including Git body identities,
   so the Plan tab lists every ticket, open work first, with progress and what comes next. It
   refuses while a tkt tag context is set, because a scoped snapshot would hide tickets. The
   shipped Plan separates current unfinished work from explicitly labelled, searchable ticket
   history; terminal tickets remain inspectable but outside current execution flow. The flow starts with all remaining work,
   including deferred tickets; tag-based work-stream views and completed context are optional.
   Configure them through `gm-config.ticketFlow` per the [flow contract](references/dashboard-contract.md#remaining-ticket-flow).
   Set `ticketFlow: false` when a graph does not help the owner's task; keep every ticket in the list.
   If the project has an explicit execution queue, preserve and link to it; the snapshot's frontier
   and dependency graph do not replace that queue or justify adding artificial blockers.
   The snapshot projects ticket IDs from `docs/plan.md`'s ordered tables, keeping each ID's first
   position across status changes. For a project that opts into serial or parallel execution,
   configure `gm-config.executionPolicy.mode` and use the read-only checker gate before a claim
   and after each tracker status change; the default is `off`.

6. **Let the page roll.** The overview shows up to five newest entries; the "All entries" tab
   keeps every entry, including the overview entries, as a collapsed row with search and filters.
   Do not delete or merge old entries to shorten the page. The template does the rolling; the
   changelog still owns release-level history.

7. **Check, open and hand back.** Before selecting UI checks, establish which preview,
   browser, capture and interaction surfaces are permitted and available. Choose checks
   from those capabilities; record blocked or unavailable checks with their limits and
   leave them unverified. Do not try another route to bypass a blocked protocol. Before
   closing UI work, inspect the actual laptop/phone rendering when a permitted surface
   is available and bind required critic acceptance to its source and captures.
   For visual critics, preflight [Playwright or the harness browser and image reader](../../engineering/code-review/references/visual-critics.md).
   For repeated critic review, apply the [shared round budget and reassessment](../../engineering/retro/references/convergence.md#critic-review-budget). If a
   capture or review required by the project or ticket is unavailable, leave that
   acceptance pending; a human report may be recorded separately but does not substitute
   for tool-observed rendering. A routine status/content update does not create a new
   owner-review gate. Record unavailable checks as evidence limits in `details`; keep
   feedback-during-use preferences and answered asks intact. See the receipt's
   [scope examples](references/review-receipt.md#evidence-limits-and-required-acceptance).
   When recording acceptance, use [review receipts](references/review-receipt.md); a
   rendering-input change requires affected checks, new captures and renewed acceptance.
   After reconciliation, use the receipt's [input comparison](references/review-receipt.md#reconcile-before-renewing-review)
   to identify affected declared views and reuse current acceptance for unchanged independent views.
   Closure-only metadata may change only through the receipt's explicit projections. Run
   `node <this skill's directory>/scripts/check-dashboard.mjs <file>` and fix
   every error; clear warnings that are real. Exercise decision selection, text retention across
   tabs, copied output and clipboard fallback. Then open all tabs at phone and laptop width and
   read the page as the owner would. Follow one dependency chain, distinguish its real prerequisite
   arrows from the numbered suggested sequence, exercise graph zoom and internal scrolling by
   keyboard, and compare visible nodes and status counts with the board. Check that selected streams
   do not hide remaining work elsewhere. Read [report-format.md](../../../docs/agents/report-format.md)
   for the HTML rules, and use
   [repository-artifact-hygiene](../../meta/repository-artifact-hygiene/SKILL.md) before adding
   media. Open the page using
   [report-format's open/refresh contract](../../../docs/agents/report-format.md#html-rules) and
   give a direct link. Finish when the page reflects the closed ticket, any ask is visible in
   "Needs you", the Plan tab matches the board, and the checker passes. After closure and explicit
   plan sync, run the full comparison before publication:
   node <skill directory>/scripts/check-dashboard.mjs <file> --repo <project-root> --strict.
   This compares the full tracker board, maintained plan and generated dashboard without repair;
   it rejects active tracker context, fact overrides, status/coverage drift and changed ticket
   bodies. Do not add a closure hook: retain close → sync → refresh → publication.
   With `executionPolicy.mode: "serial"`, the full comparison rejects more than one in-progress
   ticket. Before a claim, add `--claim ID`; in parallel mode also add `--agent OWNER`. The gate
   checks sequence, real prerequisites and planning gates. It is advice, not a reservation: run
   the native tracker claim immediately afterward and rerun the comparison after any state change.
   Parallel mode requires every active ticket to have a distinct native `assignee`; `agents` lists
   helper eligibility and never count as ownership. Check again after claiming.

Before an authorized Site publication, use the read-only
[publication preflight](references/publication-preflight.md). The parent supplies the
expected identity separately from the worker packet. A failed or stale preflight stops
publication; this helper neither authorizes nor performs it. Confirm delivery from actual
deployment output.

The full field list, writing rules, accessibility and size limits are in the
[dashboard contract](references/dashboard-contract.md). Use this for the evolving status view;
use changelog for release history and the implementation workflows for building the work.

## Custom dashboards

Copy the shipped template and edit its data blocks, or keep a custom renderer that exposes the
documented gm-dashboard-contract JSON hook. The checker's structure and limits are in the
custom-page comparison contract in references/dashboard-contract.md. The hook validates data
semantics, not the custom page's visible rendering or interaction. The standard snapshot command
only rewrites gm-tickets; custom pages can refresh hook ticket facts with the documented
authoritativeProjection adapter, preserving authored Plan ID order. Include --repo for a
full-board publication verdict.

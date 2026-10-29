---
name: delivery-dashboard
description: "Keep one dark, blue status dashboard current after every closed ticket: what the person can now do, what needs their input, recent entries at a glance, a searchable history and a Plan tab of every ticket. Use after closing a ticket or finishing other work worth surfacing, when asked for a status, progress or plan view, or to update the dashboard."
---

# Delivery Dashboard

One durable HTML page, updated after each closed ticket, that lets the owner see what changed for
them, where you need them and what comes next. Write for that reader. The process behind the work
stays out of the way, under folds and links.

1. **Find or create the dashboard.** Read the existing one and the work just finished. If none
   exists, copy the blank [template](assets/dashboard-template.html) to one committed `docs/`
   path (for example `docs/status.html`), set the project name in `gm-config`, and record the
   path on the originating ticket and in `AGENTS.md` so the next task finds it. Edit only the
   `gm-config` and `gm-entries` blocks by hand; `gm-tickets` is generated (step 4) and the
   renderer stays as shipped so every project's dashboard behaves alike. For a first entry, read
   the finished [worked example](assets/dashboard-example.html) and its
   [walkthrough](references/worked-example.md) to see the voice and shapes expected.

2. **Add one entry per closed ticket, newest first.** Lead with the feature in the person's
   terms: what they can now do, see or decide, in plain words. Name the ticket in `tickets`; the
   page shows it under Details only. Then, in this order of importance:
   - **Asks.** Anything you need from them becomes an `asks` item with a recommendation, an
     impact and options, so they can answer in a word. Mark answered asks `answered`; never
     delete them.
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

3. **Keep the sausage out of sight.** Headline, summary and the three visible changes carry no
   ticket numbers, commit hashes, file paths, tool names, test counts or refactoring talk. Put
   evidence, commands and detail under `details` and `links`. Reuse the wording discipline of
   [changelog](../../meta/changelog/SKILL.md) for user value.

4. **Refresh the Plan tab.** Run `node <this skill's directory>/scripts/snapshot-tickets.mjs
   <file>`. It rewrites only `gm-tickets` from the tkt board, so the Plan tab lists every ticket,
   open work first, with progress and what comes next. It refuses while a tkt tag context is set,
   because a scoped snapshot would hide tickets.

5. **Let the page roll.** The overview shows the newest entry in full and the next four as
   collapsed rows; the "All entries" tab keeps every entry as a collapsed row with search and
   filters. Do not delete or merge old entries to shorten the page. The template does the rolling;
   the changelog still owns release-level history.

6. **Check, open and hand back.** Run
   `node <this skill's directory>/scripts/check-dashboard.mjs <file>` and fix
   every error; clear warnings that are real. Then open all three tabs at phone and laptop width and
   read the page as the owner would. Read [report-format.md](../../../docs/agents/report-format.md)
   for the HTML rules, and use
   [repository-artifact-hygiene](../../meta/repository-artifact-hygiene/SKILL.md) before adding
   media. Open the page using
   [report-format's open/refresh contract](../../../docs/agents/report-format.md#html-rules) and
   give a direct link. Finish when the page reflects the closed ticket, any ask is visible in
   "Needs you", the Plan tab matches the board, and the checker passes.

The full field list, writing rules, accessibility and size limits are in the
[dashboard contract](references/dashboard-contract.md). Use this for the evolving status view;
use changelog for release history and the implementation workflows for building the work.

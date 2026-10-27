# Status dashboards: prior art in three projects (2026-10-27)

Question: which dashboard and report practices in `tagalog-helper`, `clvgm-extract` and
`philippines-trip` should shape grey-matter's status dashboard? Evidence is the committed
files of each repo, read from fresh shallow clones on 2026-10-27 (they were not on the machine
that did this review). Prior art is prior art, not authority; none of the three fully complies
with the contract in [dashboard-contract](../../../skills/productivity/delivery-dashboard/references/dashboard-contract.md).

## What each project does

| Project | Artifact | Worth adopting | Gap |
| --- | --- | --- | --- |
| tagalog-helper | `scripts/ticket_dashboard.mjs` makes a per-ticket page; `docs/ux-review.html` (9.5 MB) is the evolving review; `scripts/check_review_dashboard.mjs` is a gate check | Leads with a plain-language "what you can now do" and a "look for" list; folds evidence (resolution, commits) under `<details>`; marks non-UI work honestly instead of faking a demo; ticket 115 reorganized the review around learner jobs (JTBD) with reference material in expandable groups; the gate runs the dashboard's own JS and asserts section order, counts and https-only links | Per-ticket snapshots live in gitignored `.scratch`, so there is no cross-task history or search; images embedded as base64 make the main page 9.5 MB; live-app iframe needs a dev server |
| philippines-trip | `docs/proposal-dashboard.html` (15.8 MB, about 117 KB without media), `docs/entry-review.html` | ARIA tabs (`role=tab`, arrow keys, `aria-selected`), `type=search` with filters, hash routing, `aria-live` status text, "Saved in this browser" feedback, a markdown export of the owner's feedback with a proposal version; a repair note shows a dashboard link that does not open is a failed delivery (LAN server down) | Light paper theme; 15.8 MB single file; notes saved in `localStorage` that the agent cannot read back |
| clvgm-extract | No status dashboard. Two small design pages and markdown run reports (`docs/runs/*.md`) | `portrait-scenes` states "My preference:" up front and offers controls to compare variants; run reports open with Outcome then Interpretation; `light-dark()` colour tokens | Status lives in `PLAN.md` and run reports; nothing persistent or glanceable; generated timestamps in the report body |

Other findings that matter:

- tagalog-helper's `AGENTS.md` already says "dashboards first" and "label captured, simulated and
  live experiences accurately". That is the fidelity ladder in other words.
- Its `live-review-walkthrough` skill sends a fresh critic over UI copy and theme before a
  proposal is presented. A copy critic for dashboard headlines is a candidate follow-up.
- Size is the common failure. Three of the largest files are 9.5, 15.8 and 1.1 MB because media
  was embedded.

## What the new contract took, and what it left

Adopted: outcome-first headlines; evidence folded away; honest fidelity labels; ARIA tabs, search,
filters and hash routing; a "Saved/Copied" confirmation; the owner's feedback leaving the browser
as pasteable text; a gate check that executes the page's own logic; recommendation stated first.

Left out, with reasons:

| Idea | Why not |
| --- | --- |
| Live iframe of the running app | Needs a dev server and breaks offline opening; a link under "Try it" does the job |
| Notes stored in `localStorage` | The agent cannot read them; the reply button prepares text to paste into chat instead |
| Per-ticket generated pages | No history; the single entries block is the record |
| Light or paper theme | The owner asked for dark with blue tones; a second theme doubles checking |
| Tabs per concern | Area filters keep two views; see [ADR 0004](../../adr/0004-delivery-dashboard-keeps-a-searchable-history.md) |

## Follow-ups

Adopting the template in the three projects is a per-repo job for `adopt-project`; it is tracked
in ticket 89. Order by value: tagalog-helper (largest evolving dashboard), philippines-trip, then
clvgm-extract (no dashboard yet).

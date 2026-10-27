# 0004 — delivery-dashboard keeps every entry: a short overview over a searchable history

**Status:** accepted (2026-10-27). Amends [0003](./0003-spike-options-and-delivery-dashboard-boundaries.md)
on one point: the dashboard's history no longer rolls off.

## Context

0003 made the dashboard a relevant-now surface: tabs by concern, a short rolling history, and the
changelog as the only archive. In use, the owner asked for something different. They want a status
page updated after every task, short enough to read at a glance, with the older record still
reviewable and searchable in the same place. Three prior-art projects (see
[the prior-art review](../agents/research/status-dashboard-prior-art-20261027.md)) show the
failure modes of the old shape: dashboards with no memory of earlier tasks, or one page that kept
everything and grew to 9 to 16 MB.

## Decision

- The page has two views. **Overview** shows what needs the owner, the latest entry in full, and
  the next four as collapsed rows. **All entries** lists every entry as a collapsed row with
  search and filters.
- Entries are append-only structured data in one JSON block. A shipped template renders them, so
  the rolling is mechanical, not something an agent re-implements per project.
- Tabs by concern are replaced by area filters. Two views keep the page easy to hold in your head.
- A checker (`check-dashboard.mjs`, repo invariant 15) enforces the contract: required fields,
  headline length, asks that carry a recommendation, no remote or bloated media.
- The changelog still owns release-level user value. The dashboard is the per-task record, and
  both draw their wording from the `changelog` skill.

## Why

- **Glanceable and whole.** Rolling the overview to five entries bounds reading time. Keeping the
  history means "what did we decide about X" has an answer without opening git.
- **Data, not hand-edited HTML.** Prior art hand-grew dashboards and each drifted. One template
  with a data block makes updates small, reviewable diffs and keeps every project consistent.
- **Asks are first-class.** The owner's cost is attention. Putting what needs them first, with a
  recommendation, turns the dashboard into a decision surface.

## Considered

- *Keep tabs by concern with rolling history (0003):* rejected; it loses the record the owner wants
  and asks agents to curate tabs on every task.
- *One growing page with everything expanded:* rejected; this is how prior art reached 16 MB.
- *Per-task generated pages (as in tagalog-helper):* rejected as the primary shape; no
  cross-task view, and snapshots lived in a gitignored folder. Its "lead with the user-facing
  feature" idea is kept.

# Dashboard contract

What the status dashboard shows, how its data is shaped, and the rules the checker enforces.
The page is [dashboard-template.html](../assets/dashboard-template.html): copy it, then edit only
the `gm-config` and `gm-entries` JSON blocks; `scripts/snapshot-tickets.mjs` writes the third,
`gm-tickets`. A finished example with commentary is in
[worked-example.md](worked-example.md). Do not rewrite the renderer per project. A change the template needs goes
back into the template, so every project's dashboard behaves alike.

## The reader and the job

The reader is the person who owns the work. They open the page to learn three things, in this
order, in under a minute:

1. **Do you need something from me?** The "Needs you" panel is first and always present.
2. **What can I do or see now that I could not before?** The latest entry, in outcome terms.
3. **What happened recently?** Four earlier entries as one-line rows.
4. **What comes next?** The Plan tab: every ticket, open work first.

Everything else (evidence, files, commits, test output, process) is reachable but folded away.

## Page anatomy

| Part | Rule |
| --- | --- |
| Needs you | Every open ask across all entries, newest first. Empty state says nothing is needed. |
| Latest | The newest entry in full: headline, summary, up to 3 changes, one visual, a try link. |
| Earlier | The next four entries as collapsed rows (date, headline, type, "Needs you" marker). |
| All entries tab | Every entry as a collapsed row, with search, type and area filters, "Needs you" filter, expand and collapse all, and a live count. |
| Plan tab | Every ticket from the snapshot. Progress (done of total, a bar by state with a legend), "What comes next" (open and in-progress work in layers: a ticket sits one layer after its deepest unfinished blocker), then all tickets grouped Ready (frontier order), In progress, Blocked, Backlog and Done (collapsed), with search and state filters. A ticket row shows what it waits on, what it unblocks and the entries that delivered it. |

The overview never grows past five entries (`recentCount`). Older entries are not deleted: they
drop out of the overview and stay in the history tab, so the at-a-glance view stays short and the
record stays whole. The changelog still owns release-level, durable value language.

## Entry fields

One entry per closed ticket, plus any other finished work worth surfacing, newest first in the
`gm-entries` block.

| Field | Required | Rule |
| --- | --- | --- |
| `id`, `date` | yes | Unique id; `YYYY-MM-DD`. |
| `kind` | yes | `shipped`, `progress`, `decision`, `blocked` or `learning`. Pair it with the visible chip text, never colour alone. |
| `title` | yes | An outcome headline, 90 characters at most: what the person can now do or decide. |
| `summary` | yes | One or two sentences, 280 characters at most. |
| `changes` | no | At most three short bullets of what changed in their experience. |
| `visual` | with `tickets` | One visual: `image`, `compare`, `progress`, `steps` or `metrics`. Required on a ticket entry. |
| `fidelity` | no | `wireframe`, `mocked` or `live`; shown for anything not live. |
| `try` | no | One link or command to see or use the result. |
| `asks` | no | Questions for the person; see below. |
| `links`, `details` | no | Everything else, folded under "Details and links". |
| `workstreams` | no | Short area names that become filters. Use two or more areas or none. |
| `tickets` | no | Ids of the tickets the entry delivers, such as `["88"]`. Shown under Details and linked from the Plan tab, never in the headline. |

## Ticket snapshot

`gm-tickets` holds `{generated, frontier, tickets}`: the snapshot time, the ids `tkt ready`
returns in order, and each ticket's `id`, `title`, `status`, `priority`, `blocked_by` and `tags`
from `tkt query`. Regenerate it after every ticket change rather than editing it; the page stays
offline, so it shows the board as of `generated`. A blocker missing from the snapshot counts as
unfinished, so a broken edge never hides work.

## Asks

Each open ask is answerable in one line and carries a recommendation, so the person can approve
in a word. Fields: `question` (140 characters at most), `recommendation` (one of the `options`),
`impact` (what it unblocks or decides), two or more `options`. The page offers a button per option
that prepares a reply to paste into the chat. When the person answers, set `status` to `answered`
and add `answer`; the entry keeps the record. An ask that is no longer relevant is answered with
"No longer needed", not deleted.

## Write for the person, not for the process

- **Headline = outcome.** "You can now review words by topic", not "Added topic filter component".
- **Keep the sausage out.** No ticket numbers, commit hashes, file paths, tool or framework names,
  test counts or refactoring talk in the headline, summary or changes. They belong under Details.
  The checker warns on the common ones.
- **Say where it needs you.** If nothing needs the person, say so in the empty state; do not pad.
- **Be honest about fidelity.** A wireframe or mock is labelled, and a live claim cites evidence in
  Details. Planned work is never worded as done.
- **Low load.** One headline, at most three bullets, one visual, one primary action per entry.
  Vocabulary follows the project glossary. Follow the
  [human-facing writing guidance](../../../../docs/agents/doc-conventions.md#human-facing-writing).

## Visuals that earn their place

Pick the visual that answers the person's question fastest:

| Question | Visual |
| --- | --- |
| How far along is it? | `progress` (done of total) |
| Where are we in the journey? | `steps` (done, now, next) |
| Did the change help? | `metrics` (2 to 4 tiles) or `compare` (before and after) |
| What does it look like? | `image` of a real capture, labelled with its fidelity |

Use real screenshots of the running thing for live work. Store media as separate files next to the
dashboard and link them with relative paths; never embed base64 in the page. Prior art that
embedded media grew to 9 to 16 MB and became slow to open and impossible to diff. Follow
[repository-artifact-hygiene](../../../meta/repository-artifact-hygiene/SKILL.md) for retention.

## Look and accessibility

- Dark theme with blue tones, set through `color-scheme: dark` and the CSS variables at the top of
  the template. Amber is reserved for things that need the person; red only for blocked.
- Status is always text plus a glyph, never colour alone. Body text keeps at least 4.5:1 contrast.
- Tabs, search, filters and rows work by keyboard; targets are at least 44 px; reduced-motion safe.
- Readable at phone width. No horizontal scroll in the body.
- Works offline from a fresh copy: no CDN, no remote fonts or scripts, no remote images.
  Entry text is rendered as text, never as HTML.

## Checker

```
node <skill directory>/scripts/check-dashboard.mjs <dashboard.html> [--strict]
```

Errors: invalid JSON or fields, duplicate ids, over-long headlines, missing alt text, open asks
without a recommendation or options, a ticket entry without a visual, a malformed ticket snapshot
or a frontier naming a ticket that is not open, relative links that do not resolve, remote
resources, more than 50 KB of embedded media, a file over 400 KB, or broken overview, history or
plan selection. Warnings (failures under `--strict`): template examples left in; ticket numbers,
hashes, file paths or refactoring talk in headlines; a snapshot older than the newest entry; and
ticket ids or blockers missing from the snapshot. Passing proves the contract, not the experience: open the
page, check each tab at phone and laptop width, and read it as the person would.

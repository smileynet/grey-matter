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
| Plan tab | The optional remaining-ticket flow comes first, followed by every ticket from the snapshot. Progress (done of total, a bar by state with a legend), "What comes next" (open and in-progress work in layers: a ticket sits one layer after its deepest unfinished blocker), then all tickets grouped Ready (frontier order), In progress, Blocked and Backlog. An explicit **Ticket history** heading separates the collapsed Done and Cancelled groups. Search and state filters cover both current work and history. A ticket row shows what it waits on, what it unblocks and the entries that delivered it. |

The overview never grows past five entries (`recentCount`, configurable from 1 to 5). Older
entries drop out of the overview but remain in the searchable All entries history alongside the
overview entries; the record stays whole. The changelog still owns release-level, durable value
language.

## Project decisions

Store project choices in `gm-config.decisions` (optional array, default empty). Add questions as
soon as they need user judgment, including during grill sessions; a delivery entry is not required.
Needs you links to each pending card in the Decisions tab. Keep legacy entry asks for existing
records; new project decisions live here once rather than being duplicated in entry asks.

Each decision has a unique DOM-safe `id` (letters, digits, underscore or hyphen), `question`
(at most 140 characters), `context` explaining the impact, `status` (`open` or `answered`),
`options` (at least two objects with unique DOM-safe `id`, `label` and `detail` tradeoff),
`recommended` (one option id), and `reason` explaining that recommendation. Optional `tickets`
links related work. An answered decision also requires `answer` recording the submitted outcome.

Render each open question with a heading fully inside its card, followed by muted impact context,
then a labelled radio group. Put the recommendation reason beside its option, and the optional
text answer after the choices. Keep answered history below pending questions and the copy action.
Use mutually exclusive radio buttons with the
recommended option selected and labelled Recommended. Include an open text box labelled
Additional context or another answer. Draft controls retain values when switching tabs, but reload
starts from recommendations. At the bottom, Copy answers for chat exports every pending question,
selected option and any entered text as one readable message. Show successful-copy feedback;
when clipboard access fails, show and select the message for manual copying. Defaults, local edits
and copying never mark a decision answered. Update the source only after submission in chat;
preserve answered decisions with outcomes in collapsed history. Empty state shows no pending asks.

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

## Remaining ticket flow

The shared template keeps an offline, interactive dependency flow in the Plan tab. By default it
shows every non-terminal ticket, including backlog, and every edge between those visible tickets.
Cancelled tickets are terminal but are not done: the full list keeps a distinct
Cancelled group and state filter. Done/cancelled context is opt-in in the flow;
cancelled prerequisites remain unsatisfied. Counts and legend distinguish both.
Counts account for prerequisite eligibility, active work, waiting work, deferred work and completed
context separately. "Prerequisites met" describes the graph, not game/device access or participant
availability; keep those project facts outside the shared renderer.

`gm-config.ticketFlow` may be `false` to omit the flow, or an object:

```json
{
  "enabled": true,
  "defaultScope": "all",
  "groupBy": "workstreams",
  "scopes": [
    {"id": "build", "label": "Build work", "tags": ["build", "verification"]}
  ]
}
```

`all` is reserved for all remaining work. Scope tags match any listed tag. Scope ids are unique;
labels and tag lists are nonempty. A configured stream with no visible remaining work falls back
to all remaining work with a notice. A narrowed view always reports unfinished tickets outside it,
so completed context cannot silently imply the project is finished. Deferred work is included
initially and has its own toggle; completed context is opt-in. The complete searchable ticket list
remains below regardless of graph scope or whether the flow is enabled.

`groupBy` is `dependencies` (default) or `workstreams`. Workstream lanes follow
the configured scope order; a ticket matching several scopes belongs to the first,
and unmatched tickets remain in Other work. Cross-stream dependency edges remain
visible. The arrangement control can switch back to dependency depth. These are
display choices, not ticket sorting or scheduling overrides.

The flow reads left to right. Columns are steps: a ticket sits one step after its deepest
visible prerequisite. Work-stream mode stacks the streams as horizontal lanes over the
same steps. Each line runs from one prerequisite to the ticket it unlocks; there is no
shared rail, and a ticket is placed level with its prerequisites to keep lines short. A
compact card shows id, state pill, title (two lines), how many unfinished tickets it
transitively unlocks and what it still needs. Colour follows state: green can start, cyan
in progress, amber planning gate, slate waiting (queued work is not drawn as failure),
dashed deferred. Lines leaving startable work are green; the longest remaining chain of
unfinished tickets is cyan. Above the graph, "Start here" lists in-progress work and then
up to four startable tickets ranked by what they unlock, and "Longest remaining chain"
names that chain; both select and scroll to the ticket. Hover or focus previews a ticket's
chain; selection highlights it and fades the rest.

For an unresolved planning gate, add one `gate:decision` or `gate:evidence` tag to
the ticket and explain the specific missing decision or observation under
`## Planning gate` in its body. The snapshot derives `{kind, reason}` from that
source; never infer decision gates from a generic needs-info tag or from backlog.
The graph shows gates separately from lifecycle and ticket dependencies. An open
ticket with no unfinished dependency but a gate is not counted as Unblocked.
Dependency-blocked tickets retain their gate badge; selecting downstream work
lists upstream planning gates. Backlog stays Deferred even if a gate is resolved.
Remove the gate tag and explanation when it is resolved, then refresh the snapshot.
Gates record work constraints; they are not dashboard-feedback requests.

Selecting a ticket highlights its transitive prerequisites and dependents, lists unfinished and
completed prerequisites (including missing snapshot references), and links to its ticket row.
The readable prerequisite list and glyph/text states supplement arrows and colour. The diagram
scrolls internally on small screens; the document must not overflow. Inspect a whole chain at
laptop/phone widths; DOM membership alone does not prove that its path is understandable.

When changing this renderer, run both the ordinary contract fixtures and the explicit local browser
gate: `node --test scripts/delivery-dashboard-browser.test.mjs`, with local `PLAYWRIGHT_MODULE` and
`CHROME_BIN` set when not using the Node installation's Playwright and system Chromium. Browser
tools are test prerequisites, not dashboard runtime resources; no CDN or network fallback is used.

`gm-tickets` holds `{generated, frontier, tickets}`: the snapshot time, the ids `tkt ready`
returns in order, and each ticket's `id`, `title`, `status`, `priority`, `blocked_by` and `tags`
from `tkt query`, plus optional `gate: {kind, reason}` derived from ticket tags/body and
`body_id`, the Git blob identity computed from the current ticket file bytes, including valid
uncommitted edits (not the Git HEAD version). This catches body changes without a separate
receipt or freshness registry.
For CLI versions that omit tags in query output, the snapshot helper fills missing
tags from the same ticket files' inline/block tag lists without changing CLI-provided tags. Regenerate it after every ticket change rather than editing it; the page stays
offline, so it shows the board as of `generated`. A blocker missing from the snapshot counts as
unfinished, so a broken edge never hides work.

## Current delivery readiness

The ticket snapshot is a board view, not a product-delivery readiness registry. If an adopter
already tracks release or pilot readiness, derive the current dashboard summary from that record
and link its identity/evidence; do not create a second registry. Bind the current record to
product, platform, build, channel and effective audience. For that same identity, keep distribution
availability separate from installation, account access, retention and accessibility
observations. Each observation needs its evidence path (or an explicit none yet), date, owner and
relevant inputs. Availability to an audience does not prove anyone installed the build, can access
an account, retains the update or can use it accessibly.
Choose observation scope and evidence reuse using the
[test environment ladder](../../../../docs/agents/test-environment-ladder.md); release verification
paths follow the existing [numbered attempt guidance](../../../../docs/agents/release-preparation.md#verify-a-prepared-identity).
If no readiness record applies, report that missing source and keep unobserved states unverified;
do not invent a second global registry to make the summary look complete.

An adopter with an existing readiness source may project its active record and current summary
reference into exactly five canonical, nonempty stable string IDs: `product`, `platform`, `build`,
`channel` and `effectiveAudience`. The optional
`scripts/readiness-identity.mjs` `compareReadinessIdentity(activeIdentity, currentSummaryIdentity)`
helper rejects missing, malformed or extra fields and requires exact equality for every ID,
including the audience ID. Use an adapter for the adopter's schema; the helper stores no state and
does not discover, validate or establish the truth of either record. It proves identity consistency
only, not distribution availability, installation, account access, retention, accessibility or
learner outcomes. No readiness source means no helper call is required.

**Worked record (illustrative fields, not a required schema or real delivery evidence):**

Identity: Trailhead / iOS / build 2.4.0 / stable / 20-person beta cohort; record ID
`trailhead/ios/2.4.0/stable/beta20`.

| Observation | State and evidence | Owner and relevant inputs |
| --- | --- | --- |
| Distribution availability | Available; `release/2.4.0/stable.json`, observed 2026-11-02 | Release lead; build digest, stable channel, cohort |
| Installation | Pending; evidence none, as of 2026-11-02 | Pilot lead; selected devices and installed build |
| Account access | Pending; evidence none, as of 2026-11-02 | Account owner; enrolled cohort and build |
| Retention | Pending; evidence none, as of 2026-11-02 | Test owner; prior install, update path and observation interval |
| Accessibility | Pending; evidence none, as of 2026-11-02 | Accessibility reviewer; OS version and assistive technology |

Derived summary: “Build 2.4.0 is available to the beta cohort; installation, account access,
retention and accessibility remain unverified.” Keep any historical build summary dated in the
entry history. Check the current summary's record ID (or native equivalent/normalized identity)
against the active record structurally: a summary reference to `trailhead/ios/2.3.0/stable/beta20`
while the registry's current record is `trailhead/ios/2.4.0/stable/beta20` fails; correcting the
reference to the active record passes without rewriting the dated 2.3.0 history. Do not search
summary prose for words such as “pending.” Use the adopter registry's checker/fixture when present;
otherwise an adapter may use the optional comparison helper above or record a manual comparison,
identifying which was done. Neither helper tests nor a manual comparison establish real delivery
readiness. `check-dashboard.mjs` checks ticket-snapshot freshness against the newest entry date and,
with `--repo`, ticket/plan/dashboard projection consistency. It does not verify an external
readiness registry.

The Plan tab's default order follows `gm-tickets.frontier`. If a project maintains a different
execution queue, preserve and link to that queue; the graph represents ticket status and actual
dependencies, not preferred order. Never add a `blocked_by` edge solely to force the queue.

## Custom pages and projection comparison

An adopter can either copy the shipped template and edit its `gm-config` and `gm-entries` blocks,
or keep a custom renderer and declare an `application/json` script with
`id="gm-dashboard-contract"`. The version 1 hook declares `viewOrder`, `needsYouAskIds`,
`entries`, `overviewEntryIds`, `historyEntryIds`, `historySearchable`, `tickets`, and
`plan: {currentIds, historyIds}`. `viewOrder` must be `needs-you`, `overview`, `history`, `plan`;
the checker derives open asks from entries, limits the overview to the newest five, requires
searchable history to contain every entry (including entries also shown in the overview), and
partitions the complete ticket snapshot into unfinished
current work and terminal history. Preserve authored ticket order within both lists. Done and
cancelled tickets remain inspectable in history; they cannot appear in current execution flow, and
unfinished tickets cannot be hidden in history. The hook describes data semantics and cannot prove
the custom page visibly renders or behaves as declared.

The ordinary `snapshot-tickets.mjs` command rewrites only the template's `gm-tickets` block.
For a custom hook, a small project-owned refresh adapter can reuse its exported
`authoritativeProjection(projectRoot)` read seam:

```js
import { authoritativeProjection } from "./snapshot-tickets.mjs";

contract.tickets = { generated: new Date().toISOString(), ...authoritativeProjection(projectRoot) };
const safeJson = JSON.stringify(contract).replace(/</g, "\\u003c");
html = html.replace(contractBlock, (whole, open, body, close) => open + safeJson + close);
```

The adapter refreshes only tracker-owned ticket facts. Keep authored current/history ID order,
reclassify IDs when statuses change, and place newly discovered tickets in the intended order;
the checker rejects missing or misclassified rows. The refreshed custom fixture exercises this
adapter shape. The full check must still run with `--repo`.

After closure and explicit plan sync, run the same comparison owner for either renderer before
publication:

```sh
node <skill directory>/scripts/check-dashboard.mjs <dashboard.html> --repo <project-root> --strict
```

With `--repo`, the checker queries `tkt query --all-context`, compares the complete ticket set,
typed facts, frontier and Git body identities with the dashboard snapshot, and runs read-only
`tkt sync-plan --check --strict --brief` against the maintained Markdown plan. It rejects active
tag context without clearing it, snapshot omissions/additions, authored fact overrides, stale bodies
or statuses, and plan status/coverage drift. Explicitly sync the plan and refresh with
`snapshot-tickets.mjs` as needed; comparison never repairs either projection or adds a closure hook.
This preserves close → sync → refresh → publication. It proves ticket/plan/dashboard projection
consistency, not visual rendering, external readiness or the truth of authored prose/order. The
custom data hook alone is not a full-board verdict; publication checks must include `--repo`.

## Asks

Use asks for decisions or inputs needed to advance the user's work. Do not solicit
dashboard reviews, screen-size checks, appearance approval or feedback. The user
provides dashboard feedback when needed. Record unavailable visual checks under
Details without turning them into a user task.

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
| What order should I read these in? | `steps` with `mode: "sequence"`, a caption, and items with labels only |
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
node <skill directory>/scripts/check-dashboard.mjs <dashboard.html> [--repo <project-root>] [--strict]
```

Errors: invalid JSON or fields, duplicate ids, over-long headlines, missing alt text, open asks
without a recommendation or options, a ticket entry without a visual, a malformed ticket snapshot
or a frontier naming a ticket that is not open, relative links that do not resolve, remote
resources, more than 50 KB of embedded media, a file over 400 KB, or broken overview, history or
plan selection. With `--repo`, it also fails on incomplete or stale ticket facts/identities and
maintained-plan status/coverage drift. Warnings (failures under `--strict`): template examples left in; ticket numbers,
hashes, file paths or refactoring talk in headlines; a snapshot older than the newest entry; and
ticket ids or blockers missing from the snapshot. Passing proves the contract, not the experience: open the
page, check each tab at phone and laptop width, and read it as the person would.

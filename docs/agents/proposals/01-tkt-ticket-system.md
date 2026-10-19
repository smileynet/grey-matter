# Proposal: tkt as the ticket system for grey-matter

Status: draft for review
Ticket: 01 (adapt-tkt-ticket-system)
Date: 2026-10-10

## Summary

Adopt `tkt` (the git-native `.tickets/` CLI already initialized in this repo) as
the single tracker for all grey-matter work: per-skill review notes, the
game-centric lens track, and any future implementation. `tkt`'s core model
(markdown-per-ticket, flat `blocked_by` edges, a computed "ready" frontier,
acceptance/validation criteria, and free-form tags) is an almost exact match for
the tracer-bullet / dependency-ordered-task pattern the upstream skills assume.

The gaps are all secondary and well-understood. This proposal records how we map
the upstream skills' tracker expectations onto `tkt`, the conventions we'll
follow, and the short list of `tkt` features we'd want but don't have (with
concrete workarounds so none of them block us).

## Why tkt (fit assessment)

The upstream `mattpocock/skills` are prompt-driven and resolve all tracker
behavior through a per-repo config doc (`docs/agents/issue-tracker.md`), seeded
by `setup-matt-pocock-skills` from a GitHub / GitLab / local-markdown template.
Their **local-markdown** tracker (`.scratch/<feature>/issues/NN-slug.md`, a
`Status:` line, a `Blocked by:` text line, a frontier scan) is the closest
analog to `tkt`, and `tkt` is strictly better at it: it computes the frontier,
validates the DAG, and manages the lifecycle instead of leaving it to prose.

What the skills actually need from a tracker, and whether tkt has it:

| Skill need | Upstream mechanism | tkt |
| --- | --- | --- |
| One ticket per unit of work | file per ticket | `.tickets/NN-slug.md` (yes) |
| Blocking edges | native links or `Blocked by:` text | `blocked_by` (yes) |
| "Frontier" of ready work | manual scan / native dep summary | `tkt ready` computed (yes, better) |
| Acceptance criteria | checkbox list in body | `validation_criteria` + AC checkboxes (yes) |
| Fetch a ticket by ref | read file / `gh issue view` | read `.tickets/NN-*.md` or `tkt query` (yes) |
| Grouping / provenance | sub-issues / `Part of #n` | tags + tracking ticket (workaround, see Gaps) |
| Triage state machine | labels | tags, no one-state invariant (workaround) |
| Claim / WIP | assignee | `claim` -> `in_progress` (adequate solo) |
| DAG hygiene | (none) | `tkt validate` cycle + dangling checks (yes, better) |

Prior art confirms the shape: git-native, file-per-ticket personal trackers are
well-trodden (Dstask is "Taskwarrior that syncs via git"; git-bug and Fossil keep
tickets in git), and Taskwarrior models dependencies as a flat `depends`
attribute with a computed `next`/`blocked` split, exactly tkt's `blocked_by` +
`ready`. Even GitHub ran on labels + checklists for years before shipping native
sub-issues in 2024, so a flat tracker with disciplined conventions is a
legitimate baseline, not a defect.

## How grey-matter uses tkt

### Ticket shape

A `tkt` ticket is a unit of **work with a verifiable done state**, not a place to
store reference material. Reference lives in committed docs the ticket points at.

- **Split into a ticket** when the piece is independently verifiable (its own
  acceptance criteria) and could be the next frontier item (the tracer-bullet
  test).
- **Point at a doc** when the detail is explanatory. Review notes, lens analyses,
  and research findings are committed under `docs/` and referenced from the
  ticket via its `--spec` field or a body link, not pasted into the ticket.

Physical layout:

- Tickets: `.tickets/NN-slug.md` (managed by `tkt`).
- Per-skill review notes: `docs/agents/skill-reviews/<skill>.md` (+ an index).
- Lens docs: `docs/agents/lenses/`.
- Research findings: `docs/agents/research/`.
- Conventions (this family): `docs/agents/proposals/` and a short `docs/agents/tkt-conventions.md`.

### Tag vocabulary

Keep it small, on two axes (mirrors GitHub's recommended two-axis label design
and todo.txt `+project` / `@context`):

- **type**: `epic`, `review`, `lens`, `research`, `decision`, `chore`.
- **stream / area**: `skills-review`, `game-lens`, `tooling`. Plus bucket tags
  when useful on per-skill tickets: `engineering`, `productivity`, `in-progress`,
  `misc`.

Use `tkt context <tag>` to scope a working session so new tickets auto-inherit
the stream tag.

### Dependency edges and the frontier

- Sequence work with `blocked_by`; let `tkt ready` pick the next item (it sorts by
  priority then lowest id).
- The three existing tickets already model this: 03 (per-skill walkthrough) is
  `blocked_by` 01 (this proposal), 02 (lenses) is independent.
- Per-skill review tickets, when we fan them out, hang off an **epic tracking
  ticket** (see Gaps - parent/child) rather than off 03 directly, so the epic
  closes only when all skill reviews are done.

### Spec / doc linkage

- A ticket references its originating or output doc with `--spec <slug>` where the
  slug maps to a file under `docs/` (we document the mapping in
  `docs/agents/tkt-conventions.md`), or a plain body link when `--spec` is too narrow.
- Reviews and lens docs are the source of truth; the ticket is the work record.

### Lifecycle

`tkt ready` -> `tkt claim <id>` -> work -> `tkt close <id> --check-all
--resolution "..."`. Never hand-edit status to `done` (skips close gates). Use
`--status backlog` only for deliberately deferred work.

## Gaps: tkt features we'd want, with workarounds

None of these block adoption; each has a concrete workaround and a real use case
drawn from the upstream skills.

1. **No native sub-issues / parent-child.**
   Use case: `wayfinder`'s map↔ticket relation and `to-tickets` making each slice
   a sub-issue of its source; and our own "review every skill" epic over ~36
   per-skill tickets.
   Workaround (proven: Taskwarrior's end-of-project sentinel, GitHub's pre-2024
   tracking-issue era): a `type:epic` tag for grouping **plus** an epic tracking
   ticket that is `blocked_by` all its children. The epic closes automatically
   only when every child is done, giving rollup via the existing frontier logic.
   Cost: `blocked_by` is overloaded to mean "contains"; the `type:epic` tag keeps
   it distinguishable.

2. **4-value status can't hold triage roles.**
   Use case: the `triage` state machine (`needs-triage`, `needs-info`,
   `ready-for-agent`, `ready-for-human`, `wontfix`) and category roles
   (`bug`, `enhancement`).
   Workaround: triage roles are an **orthogonal axis**, so represent them as tags,
   not status. An issue can be `open` and tagged `needs-info` at once. Note the
   loss: tkt won't enforce "exactly one state role at a time"; that stays a
   discipline, not a constraint. Also note `tkt ready` (no open blockers) is NOT
   the same as the `ready-for-agent` tag (fully specified brief); keep both.

3. **No arbitrary label system (only tags).**
   The triage, category, and `wayfinder:*` type vocabularies all collapse into
   flat tags with no dimensional constraints. Acceptable for a solo repo; we keep
   the vocabulary small and documented.

4. **No assignee / atomic claim.**
   Use case: `wayfinder` claims a ticket by assignment so concurrent sessions skip
   it. Solo + serial agent runs have no claim contention, so `claim` ->
   `in_progress` (which drops the ticket off `tkt ready`) is a sufficient soft
   lock. Revisit only if we run parallel background agents.

5. **PR-as-request-surface / PR-as-close flags.**
   Use case: `triage` and `implement-spec` read a tracker flag for whether PRs are
   a request surface / how work closes. grey-matter is mostly docs with a solo
   author, so default: PRs are not a request surface, and tickets close via
   `tkt close`, not via merged PRs. Record this in `docs/agents/tkt-conventions.md`.

6. **Unused tkt capabilities to keep in mind.** `backlog` status (deferred work,
   no triage-role analog) and `validation_criteria` with evidence are extra
   capabilities the upstream skills don't use; we adopt `validation_criteria` as
   our acceptance-criteria mechanism and reserve `backlog` for parked work.

### Would-genuinely-help upstream (feature requests, not blockers)

If `tkt` were to grow features, in priority order for our use: (a) a first-class
`parent`/`epic` edge distinct from `blocked_by`, with progress rollup; (b) a
second status-like axis (or validated tag namespaces) to hold a triage role with
a one-value invariant; (c) a `tkt ready --tag ready-for-agent` filter so the
computed frontier and the triage "agent-grabbable" tag compose in one query.

## Decisions this proposal records

1. tkt is the tracker for all grey-matter work; no GitHub Issues, no `.scratch/`.
2. Tickets are work records; reference lives in committed `docs/` files linked via
   `--spec` or a body link.
3. Tag vocabulary: a small `type:` axis and a `stream/area` axis (listed above).
4. Epics are modeled as a `type:epic` tracking ticket `blocked_by` its children.
5. Triage roles, if we use them, are tags on an orthogonal axis to `status`.
6. Solo/serial model: `claim` -> `in_progress` is the WIP lock; no assignees.
7. PRs are not a request surface; tickets close via `tkt close`.

## Follow-ups (to satisfy ticket 01 ACs)

- [ ] Commit `docs/agents/tkt-conventions.md` (the operational short-form of this proposal).
- [ ] Confirm the tag vocabulary with the user and adjust.
- [ ] When starting ticket 03, create the `type:epic` tracking ticket for the
      per-skill review and fan out child tickets under it.

## Sources

Prior art and best practices were researched against: git-bug data model, Fossil
ticket system, Taskwarrior dependencies/urgency (and its end-of-project sentinel
pattern for project-level deps), Dstask, todo.txt, and GitHub's sub-issues
announcement and docs; plus GitHub Spec Kit, Kiro specs, and BMAD for
spec-driven agent workflow expectations. Upstream tracker assumptions were read
directly from the `mattpocock/skills` SKILL.md and `setup-matt-pocock-skills`
seed templates in `d:\code\skills`. Content from external sources was rephrased
for compliance with licensing restrictions.

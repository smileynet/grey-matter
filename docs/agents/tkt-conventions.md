# tkt conventions for grey-matter

How we create, tag, link, and close tickets in this repo. This is the operational
short form; the reasoning lives in `docs/agents/proposals/01-*`, `01b-*`, `01c-*`, and the
vocabulary lives in [`GLOSSARY.md`](../GLOSSARY.md).

Two of the conventions below are **interim**: they describe how we work *today*,
before the native tkt features (tkt tickets 192-199) land. Each interim rule names
its native replacement. Migration is tracked by grey-matter ticket 04.

## Ticket shape

A ticket is a unit of **work with a verifiable done state**, not a store for
reference material.

- **Make it a ticket** when the piece is independently verifiable (its own
  acceptance criteria) and could be the next frontier item.
- **Point at a doc** when the detail is explanatory. Review notes, lens analyses,
  and research findings live in committed docs; the ticket references them with
  `--spec <spec-slug>` or a body link.

Physical layout:
- Tickets: `.tickets/NN-slug.md` (managed by `tkt`).
- Per-skill review notes: `docs/agents/skill-reviews/<skill>.md` (+ an index).
- Lens docs: `docs/agents/lenses/`.
- Research findings: `docs/agents/research/`.
- Proposals / conventions: `docs/agents/proposals/`, this file, `GLOSSARY.md`.

## Lifecycle

`tkt ready` (pick the frontier top) -> `tkt claim <id>` (-> in_progress) -> work ->
`tkt close <id> --check-all --resolution "..."`.

- Never hand-edit a ticket's status to `done` (skips the close gates).
- Use `--status backlog` only for deliberately parked work.
- grey-matter's `.tickets/config.toml` has push enabled, so `new`/`claim`/`close`
  commit and push.

## Tag vocabulary (namespaced)

All label-shaped vocabularies are namespaced tags. Keep the set small; a new tag
value should be a deliberate addition to this table.

| Axis | Prefix | Values | Cardinality |
| --- | --- | --- | --- |
| Work type | `type:` | epic, review, lens, research, decision, chore | 0..1 |
| Triage disposition | `triage:` | needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix | 0..1 |
| Category | `kind:` | bug, enhancement | 0..1 |
| Epic grouping | `epic:` | `<epic-slug>` | 0..n |
| Stream / area | `stream:` | skills-review, game-lens, tooling | 0..1 |
| Wayfinder | `wayfinder:` | map, research, prototype, grilling, task | 0..1 |

Use `tkt context stream:<name>` to scope a working session so new tickets inherit
the stream tag.

> **Interim.** The single-select cardinalities (0..1) above are a *discipline*
> today: tkt does not yet enforce them. Once tkt tickets **193** and **198** land,
> declare these as `[labels.*]` namespaces in `.tickets/config.toml` and
> `tkt validate` enforces them. Native replacement for an external lint script.

## Dependencies and the frontier

- Sequence work with `blocked_by`; let `tkt ready` surface the next item (it sorts
  by priority then lowest id).
- `tkt validate` guarantees no cycles and no dangling edges.

## Epics (parent / child)

An epic groups child tickets and is done when they are.

> **Interim.** Until tkt ticket **192** (and 195-197) land a native `parent`
> field, model an epic as a ticket tagged `type:epic` whose `blocked_by` lists its
> children, with each child also tagged `epic:<slug>` for grouping. The epic
> closes once every child is done.
>
> **Native (after 192-197):** set `--parent <epic-id>` on each child. The parent
> auto-reaches `done` when its children are done and never appears on the frontier.
> Drop the `type:epic`/`epic:` tagging and the overloaded `blocked_by` edge then.

## Claiming / WIP

`tkt claim <id>` moves a ticket to `in_progress`, which drops it off the frontier,
a sufficient soft lock for a solo, serial workflow. No assignee today.

> **Native (after tkt ticket 194):** `tkt claim` also sets an `assignee`, and the
> frontier skips tickets assigned to another identity. Needed only if we run
> parallel agents.

## PRs

PRs are **not** a request surface here. Tickets close via `tkt close`, never via a
merged PR. (Only the `triage` skill reads this flag; default off.)

## Verbiage

Use the canonical terms in [`GLOSSARY.md`](../GLOSSARY.md). The two binding
homonym rulings: say **frontier** (never bare "ready") for computed-ready work and
the full **`triage:ready-for-agent`** for the asserted label; **spec** is the
requirements document, the tkt pointer field is the **spec-slug**.

---
name: reconcile-tickets
description: "End-of-session ticket pass: make every open ticket current, capture all untracked work as tickets, and set ordering so the frontier surfaces the right next picks. Use when wrapping up a session, auditing ticket health, or asking 'is everything captured?'."
---

# Reconcile Tickets

An end-of-session sweep of the ticket board: every planned item tracked, every open ticket
current, and the ordering set so the frontier's top picks are the right ones. Pairs with
`retro` at session end, reconcile-tickets grooms the **board**, retro grooms the
**environment**.

This repo tracks work with **tkt**, and the `tkt` tool ships its own skill (`tkt-core`) that
owns the command surface and the ticket-quality standard, and is updated as the tool evolves.
**Don't re-spell tkt's commands or ticket standards here; defer to it.**

## Use the tkt-core skill, don't duplicate it

First, **call the Skill tool with `tkt-core`**. It is the source of truth for: the command
surface (`new`/`claim`/`close`/`ready`/`edit`/`query`/`validate`), the ticket format, and
the ticket-quality standard (intent source, context, behavioral outcome, testable ACs,
ordering). Everything below is the grey-matter-specific *judgment* layer on top of that,
what to reconcile and how to order, not how tkt works.

(tkt is a setup prerequisite for this repo; `init-project` verifies the tool and its skill
are installed. If the `tkt-core` skill isn't reachable, stop and have the user run
`init-project` / install tkt rather than improvising commands. The `docs/plan.md` markdown
fallback is reserved for a future no-tkt optionality path, not the live path.)

## Process

### 1. Gather session context

Read the open/in-progress tickets (`tkt ready`, `tkt query`) and the session's decisions,
discoveries, and stated priorities. If the session was scoped to a work stream
(`tkt context`), note it. Build the map: what's planned, what's tracked, what's stale,
which stream each ticket belongs to.

### 2. Audit each open ticket for drift

For every open/in_progress ticket, fix real drift in place (or close/park if it's no
longer relevant):

- **Missing `blocked_by`** - work genuinely can't start without another ticket, but no
  edge is declared. (Don't manually clear a *stale* `blocked_by` when a dep closes, `tkt
  ready` ignores done blockers; the history is useful.)
- **Vague ACs** - "properly"/"correctly" instead of testable conditions. Sharpen to the
  tkt quality bar.
- **Dead context** - moved file paths, superseded ADRs, changed specs.
- **Superseded work** - the plan moved and this ticket no longer reflects what's needed
  (close with a resolution, or rewrite).
- **Scope creep** - a ticket that grew during the session but was never split.
- **Missing/wrong tag** - no work-stream tag, or the wrong one, in a multi-stream repo.

### 3. Capture untracked work

For gate changes, apply [tooling proportionality](../../../docs/agents/local-gates.md#changing-a-gate-is-a-reversible-tooling-change)
before creating follow-up tickets.

Scan the session for work with no ticket: decisions needing implementation, issues found,
follow-ups from closed tickets, anything discussed-but-not-filed. File each as a ticket to
the tkt quality bar (from the `tkt-core` skill). **Default new tickets to `open`** (frontier-
eligible); reserve `backlog` for work deliberately deferred out of this cycle. Tag with its
stream at creation. Dedupe first: extend an existing ticket rather than file a near-
duplicate (`tkt query`).

### 4. Keep ticket fields and project order distinct

Keep the ticket fields distinct (the `tkt-core` skill defines each; this is how grey-matter
applies them). A project-owned execution queue is separate from these fields:

- **`blocked_by`** - structural only: A must finish before B *can* start. "We'd rather do
  A first" is not a blocker, that's priority.
- **priority** - contextual weight that breaks ties on the frontier; it does **not** let a
  later high-priority ticket jump an in-progress thread.
- **work-stream tag** - which parallel thread the ticket belongs to.

An adopted execution queue is preferred work order from the project's maintained plan. Preserve
it when it differs from raw `tkt ready` sorting; use the frontier to check status and eligibility,
not to silently replace the adopted order. Never add `blocked_by` just to encode that preference.

### 5. Preserve the adopted plan

When the project maintains an explicit execution queue, that queue controls preferred order and
`tkt ready` remains the structural frontier. Otherwise, **`tkt ready` is the plan**. Reconcile
`blocked_by`, priority and tags without changing the adopted queue or turning preferences into
dependencies. For a project using the frontier as its execution order, sanity-check with the
ordering rubric below; when a queue is adopted, keep its order and use the frontier to verify
state and real blockers, not to reorder it.

Scenario: the adopted queue lists B, then A, then C, while raw `tkt ready` sorts A, B, C. Keep
the adopted order, leave independent tickets unblocked, and add `blocked_by` only for an actual
prerequisite.

1. **Finish current threads first** - an in-progress ticket and the open tickets
   continuing its stream come before starting a new thread.
2. **Earlier (lower-id) tickets first** within a thread and between equal threads.
3. **Blockers override position** - a real `blocked_by` moves a ticket later regardless of
   id.
4. **Explicit user instruction overrides all** - if the user said "do X before Y this
   session", that wins; record why so next session knows it was deliberate.
5. **Priority is weight, not order** - it breaks ties and signals importance; it doesn't
   entitle a later ticket to jump an in-progress thread.

### 6. Verify and report

### Priority and queue review

Use authoritative `tkt query -o json` output for ticket facts. Query the full board with
`--all-context` so an active tag context cannot hide tickets, then select exact workstream
membership from each ticket's `tags` array. A scoped query may include untagged tickets:
do not treat those as members. Report untagged and unrelated tickets separately as excluded
context, and surface blockers outside the selected workstream as external blockers.

For the selected workstream, compare the stored priority and explicit/adopted queue with
structural eligibility and `blocked_by` facts. Report open-ticket priority/queue inversions
as advisory comparisons only; an adopted queue remains the owner's preferred order. Exclude
backlog, in-progress, done and cancelled tickets from this inversion comparison. Report queued
tickets before unfinished prerequisites, open tickets behind backlog prerequisites,
missing priorities, and open tickets whose acceptance criteria are all checked. Quote the
relevant query output (or a project script's output) for each finding; ticket prose alone
is not evidence. An adopted queue is planned order, not a dependency graph: preserve it and
report actual blockers separately. This review is read-only; do not edit ticket state or
rewrite the queue as a side effect.

For a deterministic report, run [the priority-review helper](scripts/priority-review.mjs)
from the target repository root with `node "<absolute directory containing this loaded SKILL.md>/scripts/priority-review.mjs" "<exact-tag>" "<queue-id,...>"`.
It queries all tickets with `tkt query --all-context -o json`, selects exact tag membership,
and reads only the ticket AC checkbox counts from matching `.tickets` files. Supply an adopted
queue explicitly when the project has one; omit the last argument when there is no maintained
queue. Preserve the JSON output as the evidence in the session report. This command is
read-only and prints JSON containing included IDs, excluded IDs with tags, out-of-scope queue
entries, external and unknown blockers, and findings. It exits 0 on a completed report and
nonzero on invalid query data, missing ticket files, or a failed query. Acceptance-criteria
counts come from checkbox lists in the ticket body sections and are a review signal;
`tkt close --check-all` remains the closure authority. The supplied queue is reviewed as
planned order and is never written back. Keep the shell working directory at the target
repository root; the helper path comes from the installed skill.

Run `tkt validate --brief` (no cycles or dangling edges), then `tkt ready` to inspect the
current structural frontier. If an adopted queue differs, report its order separately and
preserve it; do not replace it with the raw frontier sort. Present tickets created or updated,
the adopted queue when present, and what the frontier shows about eligibility and blockers.

Before counting residual tickets as delivery blockers, compare the requested outcome and its
required acceptance with observed behavior and evidence. Keep unmet or unverified required
acceptance on its owning ticket; never relabel it as a follow-up, weaken its criteria, or close
the ticket to clear the frontier. Independent follow-ups keep their own criteria, status and
activation conditions, but do not block a delivered outcome without a real prerequisite.
Report delivered behavior, required acceptance still unmet or unverified, and independent
follow-ups separately. **Scenario:** optional Mac validation remains unrun after the core
acceptance is evidenced, so report it as an independent follow-up; if the original acceptance
requires that validation, keep it unmet or unverified on the core ticket.

## Does not

- Pick the single next ticket to execute (that's just working the frontier, `tkt ready`).
- Decompose a spec into a ticket set from scratch (that's `to-tickets`).
- Improve the agent's *environment* (that's `retro`, run both at session end).

Pairs with `orient` across the session boundary: reconcile-tickets sets the frontier
ordering at session end; `orient` reads that order at the next session's start.

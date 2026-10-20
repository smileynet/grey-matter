---
name: reconcile-tickets
description: "End-of-session ticket pass: make every open ticket current, capture all untracked work as tickets, and set ordering so the frontier surfaces the right next picks. Use when wrapping up a session, auditing ticket health, or asking 'is everything captured?'."
disable-model-invocation: true
---

# Reconcile Tickets

An end-of-session sweep of the ticket board: every planned item tracked, every open ticket
current, and the ordering set so the frontier's top picks are the right ones. Pairs with
`retro` at session end, reconcile-tickets grooms the **board**, retro grooms the
**environment**.

This repo tracks work with **tkt**, and the `tkt` tool ships its own skill that owns the
command surface and the ticket-quality standard, and is updated as the tool evolves.
**Don't re-spell tkt's commands or ticket standards here; defer to it.**

## Use the tkt skill, don't duplicate it

First, **call the Skill tool with `tkt`**. It is the source of truth for: the command
surface (`new`/`claim`/`close`/`ready`/`edit`/`query`/`validate`), the ticket format, and
the ticket-quality standard (intent source, context, behavioral outcome, testable ACs,
ordering). Everything below is the grey-matter-specific *judgment* layer on top of that,
what to reconcile and how to order, not how tkt works.

(tkt is a setup prerequisite for this repo; `init-project` verifies the tool and its skill
are installed. If the `tkt` skill isn't reachable, stop and have the user run
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

Scan the session for work with no ticket: decisions needing implementation, issues found,
follow-ups from closed tickets, anything discussed-but-not-filed. File each as a ticket to
the tkt quality bar (from the `tkt` skill). **Default new tickets to `open`** (frontier-
eligible); reserve `backlog` for work deliberately deferred out of this cycle. Tag with its
stream at creation. Dedupe first: extend an existing ticket rather than file a near-
duplicate (`tkt query`).

### 4. Set the three ordering axes

Keep them distinct (the `tkt` skill defines each; this is how grey-matter applies them):

- **`blocked_by`** - structural only: A must finish before B *can* start. "We'd rather do
  A first" is not a blocker, that's priority.
- **priority** - contextual weight that breaks ties on the frontier; it does **not** let a
  later high-priority ticket jump an in-progress thread.
- **work-stream tag** - which parallel thread the ticket belongs to.

### 5. The frontier is the plan

grey-matter has no separate plan doc, **`tkt ready` is the plan**. So "re-organize the
plan" here means: set `blocked_by`, priority, and tags so the frontier's top picks match
the agreed priorities. Sanity-check with the ordering rubric:

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

`tkt validate --brief` (no cycles, no dangling edges), then `tkt ready` (the frontier's
first picks match the rubric). Present: tickets created, tickets updated, what the frontier
now surfaces and why.

## Does not

- Pick the single next ticket to execute (that's just working the frontier, `tkt ready`).
- Decompose a spec into a ticket set from scratch (that's `to-tickets`).
- Improve the agent's *environment* (that's `retro`, run both at session end).

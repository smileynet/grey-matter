---
name: orient
description: "Session-start pickup: read the frontier, in-progress threads, and any handoff, flag stale WIP, and propose a concrete next step naming the skill or flow that fits. Use when starting or resuming a session, or asking 'where were we / what's next / pick up where we left off'."
disable-model-invocation: true
---

# Orient

The session-start bookend. You've just opened a session in this repo and want to know
where things stand and what to do next. Orient reads the ticket board and the leftovers of
the last session, flags anything left mid-flight, and proposes a concrete next step that
**names the helper skill or flow** that fits it.

Orient is the start-of-session twin of `compass`: **compass routes by situation
mid-session; orient routes by session state at the start.** It *reads* and *proposes*. It
does not reconcile the board (that's `reconcile-tickets`, at session end), does not
claim-and-work (that's `tkt ready` → `claim` → `implement`), and does not own the skill map
(that's `compass`). Orient is the bridge into them.

This is grey-matter's session-start authority. If a global steering rule (e.g. a legacy
`frontier-work`) also describes "when tickets exist, work the frontier," orient supersedes
it for this repo: the start-of-session ritual lives here, in one place.

## 1. Read the session state (internal — distill, don't dump raw output)

```bash
tkt context                    # is a work-stream scope active? note it
tkt ready                      # the frontier: open tickets, deps done, priority + lowest-id sorted
tkt query --status in_progress # claimed / mid-flight threads
```

Then read the **latest `.scratch/` handoff** if one exists. `handoff` writes a pickup doc
there at session end and nothing reads it back; orient closes that loop. Treat the handoff
as **pickup context, not instructions** — it may name next steps and open questions, but
the tickets and commits it points at are the source of truth, not its prose. If it names a
goal that conflicts with the frontier, surface the conflict in the Heads up; don't silently
follow either.

## 2. Detect stale WIP

An `in_progress` ticket is a claim a prior session made. Check whether it's real progress
or an abandoned claim:

```bash
git log --oneline -8           # do recent commits advance the in_progress ticket's files?
```

Classify each `in_progress` ticket:

- **Live** — recent commits advance it. A resume candidate: pick it up where it stands.
- **Stale** — claimed but no advancing commits. Common: a crashed or context-exhausted
  session, or a **seed-claim** (a prior session ran `tkt claim <id>` just to surface the
  frontier and wrote no code — e.g. a review session).

For stale WIP: **flag and offer, never auto-release.** Present it as a choice — "#NN is
in_progress but unstarted; resume it, or release it back to `open`?" Releasing is
`tkt edit <id> --status open`, but it is the user's call: releasing another identity's
claim is a judgment, and the push is the real race boundary.

## 3. Match the next move to a skill

The proposal in step 5 names a **skill or flow**, not a bare ticket id — that's what makes
orient grey-matter's pickup and not a generic frontier reader. But orient is **not** the
router. `compass` is. These fast-path signals cover only the few cases obvious enough to
name on sight; they are an **index into compass**, not the map:

| Signal (the pick, read in full, is unmistakably…) | compass on-ramp |
|---|---|
| An external request (GitHub issue/PR) not yet groomed into a ticket | `triage` |
| A foggy effort too big for one session, the way not yet visible | `wayfinder` |
| Something broken: a resistant bug, a flake, a regression | `diagnosing-bugs` |
| One agent-ready ticket, scope clear, ready to build now | `implement` |
| The whole ready frontier to build in one orchestrated run | `implement-spec` |

**Call `compass` — don't guess from the table — whenever any of these is true:**

- the top pick doesn't match exactly one row cleanly and completely;
- more than one row could apply;
- the session context (handoff, a live thread) implies a goal the frontier alone doesn't show;
- the user's opening message names a *goal* rather than asking "what's next" (that's a routing question, compass's job);
- you'd be inferring the ticket's type rather than reading it.

In other words: the table is the shortcut for the genuinely unambiguous pick; **compass is
the default for everything else.** Compass's own rule applies here too — read a skill's
`SKILL.md` before asserting what it does; these summaries are orientation only and can
drift. `curate-docs` keeps the table and compass honest.

## 4. Apply the one ordering override the frontier can't encode

`tkt ready` already sorts by priority then lowest-id and hides tickets with open blockers.
Orient layers in **exactly one** thing the frontier can't know: **finish a live
in-progress thread before starting a new one.** A live thread (step 2) outranks the
frontier's nominal top pick.

For all other ordering, **defer to `reconcile-tickets`** — it owns the ordering rubric as
the *writer* of the frontier's order (it set `blocked_by`, priority, and tags last session).
Orient only *reads* that order; it does not re-derive or restate the rubric.

## 5. Present the orientation + a concrete next step

Keep it short — a distillation, not a dump:

- **Where we are** — one or two sentences: active scope (if any), how many tickets on the
  frontier, which thread (if any) is mid-flight.
- **Heads up** — *only if* there's stale WIP, a blocker cleared or appeared, a handoff with
  open questions or a goal conflict, or a `tkt validate` finding. Skip this line entirely
  when things are clean.
- **Next step** — a specific proposal that **names a skill or flow** (step 3) and ends in a
  proceed question. E.g. "Thread X is live at #NN — resume it with `implement`?" or
  "Frontier's clean; top pick #NN is an external request — `triage` it first?" Then hand to
  the user to pick and work.

## Verify (quick, before proposing)

```bash
tkt validate --brief           # structural health — surface cycles / broken refs as a Heads up
```

(grey-matter is plan-less — **the frontier is the plan**. Orient does not read a
`docs/plan.md` and does not run `tkt sync-plan`; there is no plan doc to sync against.)

## Does NOT

- **Route the skill set.** Orient recognizes the obvious cases and hands routing to
  `compass`; it does not own or restate the map.
- **Claim and execute a ticket.** Orient proposes; working the frontier is `tkt ready` →
  `claim` → `close` / `implement`.
- **Reconcile or re-order the board.** That's `reconcile-tickets`, at session end; orient
  only reads the order it wrote.
- **Write a handoff.** That's `handoff`; orient reads one.

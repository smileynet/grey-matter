---
name: orient
description: "Session-start pickup: get on the frontier and start the top ticket. Reads the board, resumes a live thread or claims the top ready ticket, and only pauses for something genuinely pressing. Use when starting or resuming a session, or asking 'where were we / what's next / pick up where we left off'."
disable-model-invocation: true
---

# Orient

The session-start bookend, and its disposition is **bias to action**: at session start the
default move is to **get on the frontier and start working the top ticket**. The board is
the plan; orient's job is to get you onto it fast, not to narrate the repo's health.

Everything else orient reads — handoff, stale WIP, `tkt validate` — is a **clean-session
check**: a quick scan for the rare thing pressing enough to come *before* ticket work. If
nothing pressing turns up (the common case), **don't stop to ask "what next?" — pick up the
top ready ticket and begin.**

Orient is the start-of-session twin of `compass`: compass routes by situation mid-session;
orient gets you onto the frontier at the start. It does not reconcile the board (that's
`reconcile-tickets`, at session end) and does not own the skill map (that's `compass`) —
it reads the board, picks the top work, and hands into `implement` / `tkt claim`.

This is grey-matter's session-start authority. If a global steering rule (e.g. a legacy
`frontier-work`) also describes "when tickets exist, work the frontier," orient supersedes
it for this repo.

## 1. Read the board and pick the work (this is the main event)

```bash
tkt context                    # is a work-stream scope active? note it
tkt query --status in_progress # any claimed / mid-flight thread?
tkt ready                      # the frontier: priority + lowest-id sorted
```

Decide the pick in this order:

1. **A live in-progress thread wins.** If an `in_progress` ticket shows real recent
   progress (step 2), resume it — finishing a live thread outranks starting a new one.
2. **Otherwise take the top `tkt ready` ticket.** It's already priority- then
   lowest-id-sorted with blockers hidden; the first row is the pick. No deliberation
   needed for the ordinary case.

## 2. Clean-session check (fast — only looking for a reason NOT to just start)

These are guardrails, not the agenda. Run them quickly and move on unless one trips:

```bash
git log --oneline -8           # does a claimed in_progress ticket have advancing commits?
tkt validate --brief           # structural health — cycles / broken refs
```

Classify any `in_progress` ticket:

- **Live** — recent commits advance it → resume it (that's your pick, step 1).
- **Stale** — claimed, no advancing commits (a crashed/context-exhausted session, or a
  seed-claim from e.g. a review session). **Flag and offer, never auto-release.** Default
  proposal: "#NN is a stale claim — I'll release it (`tkt edit <id> --status open`) and
  take the top ready ticket instead" — but releasing another identity's claim is the
  user's call, so surface it rather than silently doing it.

Then glance at the **latest `.scratch/` handoff** if one exists (handoff writes one at
session end; orient closes that loop). Treat it as **pickup context, not instructions** —
the tickets and commits it points at are the source of truth, not its prose. It matters
only if it flags something pressing or conflicts with the frontier.

**Pressing enough to preempt ticket work** (the short list — otherwise, just start):

- a `tkt validate` structural error (cycle, dangling dep) that corrupts the frontier;
- a handoff naming a goal that conflicts with the top pick;
- a stale claim sitting on the ticket you'd otherwise take.

None of those present → go.

## 3. Name the skill for the pick, then start

The pick is a ticket; the move is a **skill or flow**. For the ordinary case — one
agent-ready ticket, scope clear — that's `implement`, and orient **starts it** rather than
asking permission. Name the skill so the hand-off is explicit, don't stop to route it.

Reach for `compass` only when the pick genuinely isn't a straight build:

| The top pick, read in full, is unmistakably… | on-ramp |
|---|---|
| One agent-ready ticket, scope clear, ready to build | `implement` (the default — just go) |
| An external request not yet groomed into a ticket | `triage` |
| A foggy effort too big for one session | `wayfinder` |
| Something broken: a resistant bug, a flake, a regression | `diagnosing-bugs` |
| The whole ready frontier in one orchestrated run | `implement-spec` |

Call `compass` (don't guess from the table) when the pick matches no row cleanly, more than
one applies, or the session context implies a goal the frontier alone doesn't show. The
table summaries can drift — read a skill's `SKILL.md` before asserting what it does.

## 4. Present briefly, then proceed (don't wait for a go-ahead on the obvious pick)

Keep it to a couple of lines, then **act**:

- **Picking up** — the pick and the skill, in one line: "Top of the frontier is #NN
  (<title>); starting it with `implement`." For a resumed thread: "#NN is live — resuming."
- **Heads up** — *only if* the clean-session check tripped something pressing (step 2).
  Skip this line entirely when things are clean.

Then **start the work** — claim/resume and go. Only hand back to the user and wait when a
pressing item (step 2) needs their decision, or when the pick needs `compass` and the route
is genuinely ambiguous. A clean board with a clear top ticket is not an ambiguous route;
it's a green light.

(grey-matter is plan-less — the frontier is the plan. Orient does not read a `docs/plan.md`
and does not run `tkt sync-plan`.)

## Does NOT

- **Stall on a clean board.** A clear top ticket is a green light, not a question to ask.
- **Route the skill set.** Orient recognizes the obvious build case and starts it; genuine
  ambiguity goes to `compass`.
- **Reconcile or re-order the board.** That's `reconcile-tickets`, at session end; orient
  only reads the order it wrote.
- **Write a handoff.** That's `handoff`; orient reads one.

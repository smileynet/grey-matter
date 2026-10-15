---
name: wayfinder
description: Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on the issue tracker, and resolve them one at a time until the way to the destination is clear.
disable-model-invocation: true
---

A loose idea has arrived, too big for one agent session, and wrapped in fog: the way from here to the **destination** isn't visible yet. Wayfinding is about finding that way, not charging at the destination. This skill charts the way as a **shared map** on the repo's issue tracker, then works its **decision tickets** (questions whose resolution is a decision, not slices of a build to execute) one at a time until the route is clear.

The destination varies per effort, and naming it is the first act of charting: it shapes every ticket. It might be a spec to hand off and iterate on, a decision to lock before planning starts, or a change made in place like a data-structure migration. The map is domain-agnostic: engineering, game systems, docs, whatever fits the shape.

## Plan, don't build

Wayfinder **plans**: each ticket resolves a decision, and the map is done when the way is clear, with nothing left to decide before someone goes and builds the thing. This is absolute. The pull to just do the work is the signal you've reached the edge of the map and it's time to hand off, not permission to cross into implementation. Produce decisions, not deliverables; when the map clears, hand off to `to-spec` and stop. Code gets written in a separate implementation session, never inside the map.

## Refer by name

Every map and ticket is a tkt ticket, so it has a **title** and an id. In everything the human reads (narration, the map's Decisions-so-far), refer to it by its title, never by a bare id. A wall of `191, 192, 193` is illegible; titles read at a glance. The id doesn't vanish; a title wraps its link, but it rides _inside_ the title, never stands in for it.

## The Map

The map is a single tkt ticket tagged `type:epic` and `wayfinder:map`, the canonical artifact. Its tickets are its children.

The map is an **index**, not a store. It lists the decisions made and points at the tickets that hold their detail; a decision lives in exactly one place, its ticket, so the map never restates it, only gists it and links.

**How the map, its children, blocking, and frontier queries map onto tkt is set by the issue-tracker doc.** Read `docs/tkt-conventions.md` (the `wayfinder:` tag axis and the epic convention) before charting. The short form, against tkt today:

- **Map:** a ticket tagged `type:epic` + `wayfinder:map`, its `blocked_by` listing every open child (interim epic convention; tkt tickets 192-197 will replace this with a native `--parent`).
- **Child ticket:** `tkt new <slug> --title "..." --tags wayfinder:<type>` with `--blocked-by` for its edges and `--tags epic:<map-slug>` to group it under the map.
- **Frontier:** `tkt ready` lists open, unblocked tickets in priority-then-id order. That _is_ the frontier.
- **Claim:** `tkt claim <id>` moves a ticket to `in_progress`, dropping it off the frontier. In a solo serial workflow that is the lock; there is no assignee yet (tkt ticket 194).

### The map body

The whole map at low resolution, loaded once per session. Open tickets are **not** listed here: they are open children, found by `tkt ready`.

```markdown
## Destination

<what reaching the end of this map looks like: the spec, decision, or change this effort is finding its way to. One or two lines; every session orients to it before choosing a ticket.>

## Notes

<domain; skills every session should consult; standing preferences for this effort>

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then open the link for the detail the ticket holds -->

- [<closed ticket title>](link): <one-line gist of the answer>

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- see "Out of scope": work ruled beyond the destination; closed, never graduates -->
```

The **Notes** block carries domain and standing preferences only. It is **not** an escape hatch: it can never override "plan, don't build". If a map genuinely needs execution, that is a separate implementation effort, not a line in Notes.

### Tickets

Each ticket is a **child** of the map; its tkt id is its identity. Its body is the question, sized to one agent session (~100K tokens):

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Each ticket carries exactly one `wayfinder:<type>` tag, one of `research`, `prototype`, `grilling`, `task` (see [Ticket Types](#ticket-types)). `wayfinder:` and `epic:` are the only tags a map and its tickets carry, never a `triage:` tag like `ready-for-agent`: they are decisions, not implementation work.

Blocking uses tkt's native `blocked_by`, so `tkt ready` renders the frontier without opening the map and `tkt validate` guarantees no cycles or dangling edges. A ticket is **unblocked** when every ticket blocking it is closed; the **frontier** (`tkt ready`) is the open, unblocked, unclaimed children, the edge of the known.

The answer isn't part of the body; it's recorded on resolution (see [Work through the map](#work-through-the-map)). Assets created while resolving a ticket are linked from the ticket, not pasted in.

## Ticket Types

Every ticket is either **HITL** (human in the loop, worked _with_ a human who speaks for themselves) or **AFK**, driven by the agent alone.

**A HITL ticket resolves only through live human exchange.** The agent surfaces options and makes a recommendation; the human decides, and the human (or the agent on the human's explicit say-so) closes it. The agent never simulates the human's side, answers its own questions, or picks among its own prototypes and self-closes. A `grilling` ticket the agent resolved alone, or a `prototype` ticket where the agent chose the winner, is broken: the HITL guarantee is the whole point. If no human is present, the ticket stops and waits; it does not self-resolve.

- **Research** (AFK): Reading documentation, third-party APIs, or local resources like knowledge bases to surface a fact a decision waits on. Resolved by a subagent that calls the Skill tool with "research". Use when knowledge outside the current working directory is required. This is the one HITL exception: AFK by design.
- **Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough, concrete artifact to react to (an outline, a rough take, a stub, or throwaway UI/logic code) by calling the Skill tool with "prototype". **A prototype is throwaway: write it under `.scratch/` (gitignored), never into the committed tree.** This fences the one ticket type that writes code so it cannot silently become implementation. Link the prototype's path as an asset. Use when "how should it look" or "how should it behave" is the key question.
- **Grilling** (HITL): Conversation. The default case. Always call the Skill tool twice, for "grilling" and "domain-modeling" (or "game-modeling" when the subject is a game system, per `docs/tkt-conventions.md`'s app/game split).
- **Task** (HITL or AFK): Manual work that must happen before a _decision_ can be made: nothing to decide, prototype, or research, but the discussion is blocked until it's done. Signing up for a service so its API can be judged, provisioning access, moving data so its shape can be seen. This is the one type that _does_ rather than decides, and it earns its place by unblocking a decision, not by delivering the destination. The agent drives it alone where it can (AFK); otherwise it hands the human a precise checklist (HITL). Resolved when the work is done; the answer records what was done and any resulting facts (credentials location, new URLs, row counts) later tickets depend on.

A `task` ticket that reads like a slice of the build is mis-typed. Close it or retype it; it does not belong on the map as implementation.

## Fog of war

The map is _deliberately_ incomplete, and under-charting is the default, not a shortfall. Don't chart what you can't yet see. Beyond the live tickets lies the **fog of war**: the dim view of decisions and investigations you can tell are coming but can't yet pin down, because they hang on questions still open. Resolving a ticket clears the fog ahead of it, graduating whatever's now specifiable into fresh tickets, one at a time, until the way to the destination is clear and no tickets remain.

**Chart only the frontier you can state sharply now.** The failure mode is over-planning: charting twenty tickets at once, where the later ones rest on assumptions the earlier ones will invalidate. That is the waterfall trap. Specify the near edge; leave the rest as fog. A map that opens with a handful of frontier tickets and a thick **Not yet specified** section is healthy; one that opens with a fully-drawn multi-layer DAG is almost certainly speculative.

The map's **Not yet specified** section is where that dim view is written down: the suspected question, the area to revisit later. It's the undiscovered frontier _toward_ the destination: everything here is in scope, just not sharp enough to ticket. Write as loosely or as fully as the view allows; it doubles as a signpost for collaborators reading where the effort is headed.

**Fog or ticket?** The test is whether you can state the question precisely now, _not_ whether you can answer it now.

- **Ticket when** the question is already sharp, even if it's blocked and you can't act on it yet.
- **Not yet specified when** you can't yet phrase it that sharply. Don't pre-slice the fog into ticket-sized pieces: it's coarser than a ticket, and one patch may graduate into several tickets, or none, once the frontier reaches it.

**Not yet specified** excludes what's already decided (Decisions so far), what's already a live ticket, and what's out of scope (the next section).

## Out of scope

Fog only ever gathers _toward_ the destination. The destination fixes the scope, so work beyond it is **out of scope**: it isn't fog, and it doesn't belong in **Not yet specified**. It gets its own **Out of scope** section on the map: work you've consciously ruled out of _this_ effort. Scope, not sharpness, lands it here.

Out-of-scope work never graduates (the frontier stops at the destination), so it returns only if the destination is redrawn, and then as a fresh effort, not a resumption.

Ruling something out of scope is a scoping act, not a step on the route. When a ticket that already exists turns out to sit past the destination (mis-scoped in while charting, or exposed by a resolution), **close it** with a resolution noting it's out of scope, and leave one line in the **Out of scope** section: the gist plus why, linking the closed ticket. It stays out of **Decisions so far**, which records the route actually walked; a scope boundary isn't a step on it.

## Invocation

Two modes. Either way, **never resolve more than one ticket per session**, with the exception of research tickets.

### Chart the map

User invokes with a loose idea.

1. **Name the destination.** Call the Skill tool twice, for "grilling" and "domain-modeling", to pin down what this map is finding its way to: the spec, decision, or change. The destination fixes the scope, so it's settled first.
2. **Map the frontier.** Grill again, **breadth-first** this time: fan out across the whole space rather than deep on any one thread, surfacing the open decisions and the first steps takeable now. **If this surfaces no fog** (the way to the destination is already clear, the whole journey small enough for one session), you don't need a map. Stop and tell the user the effort is small enough to skip straight to grilling or a spec.
3. **Create the map** (`tkt new <map-slug> --title "..." --tags type:epic,wayfinder:map`): Destination and Notes filled in via `tkt edit <id> --spec` or the ticket body, Decisions-so-far empty, the fog sketched into **Not yet specified**.
4. **Create only the tickets you can specify now** (per Fog of war, under-chart) as children, then wire blocking in a **second pass** (`tkt edit`), since tickets need ids before they can reference each other. Tag each `wayfinder:<type>` and `epic:<map-slug>`, and add the map to each child's blockers so the map epic closes last. `tkt validate` confirms the graph. Everything you can't yet specify stays in **Not yet specified**.
5. **Fire the research subagents.** For each `research` ticket you just created, spin up a subagent that calls the Skill tool with "research" to resolve it in parallel, capturing findings in a committed `docs/research/<name>.md` with a context pointer from the ticket.
6. Stop: charting is one session's work; it hand-resolves nothing.

### Work through the map

User invokes with a map (id or title). A ticket is **optional**: without one, you pick the next decision, not the user.

1. Load the **map**: the low-res view, not every ticket body.
2. Choose the ticket. If the user named one, use it. Otherwise take the first `tkt ready` ticket. **Claim it** with `tkt claim <id>` before any work.
3. Resolve it as the type its `wayfinder:<type>` tag names (see [Ticket Types](#ticket-types)). Read the tag, not just the body: the body never states the type. **Zoom as needed**: open the full body of any related or closed ticket on demand; call the Skill tool for whichever skills the `## Notes` block names. If in doubt, call the Skill tool twice, for "grilling" and "domain-modeling". For a HITL ticket, wait on the human; never resolve it alone.
4. Record the resolution: `tkt close <id> --check-all --resolution "<the answer>"`, then **append a context pointer** (title + link + one-line gist) to the map's Decisions-so-far.
5. Add newly-surfaced tickets (create-then-wire); graduate any fog the answer has made specifiable, clearing each graduated patch from **Not yet specified** so it lives only as its new ticket. If the answer reveals that a ticket (this one or another) sits beyond the destination, **rule it out of scope** rather than resolving it on the route. If the decision invalidates other parts of the map, update or close those tickets.

The user may run unblocked tickets in parallel, so expect other sessions to be editing the tracker concurrently.

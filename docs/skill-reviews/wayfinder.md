# wayfinder

- Bucket: engineering. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **adapt**: keep the structure, repoint to tkt, put the three agent seams in
  prose teeth, drop the Notes execution-override.

## What it is

The heaviest flow in the set: a planner for an effort too big for one agent session. It
charts a **map** (one tracker ticket, `wayfinder:map`) whose children are **decision
tickets**, each asking a *question* whose resolution is a *decision*, never a build
slice. Four types: `grilling` (HITL, default), `prototype` (HITL), `research` (AFK
subagent), `task` (manual unblocking). Vocabulary: destination (named first, fixes
scope), fog of war (`Not yet specified`), frontier (open+unblocked+unclaimed),
out-of-scope. Hard rules: plan don't build; one ticket per session (research excepted);
hand off to `to-spec`, never into implementation.

## What it does for the user

Lets a single agent context handle an effort larger than it: planning state lives in the
tracker (durable, re-loadable, human-visible), and each session loads the map at low
resolution, resolves one decision, and stops. Turns "a big fuzzy idea" into a cleared
graph of linked decisions ready to collapse into a spec.

## Prior art (agent-filtered)

Research confirmed the core is a coherent synthesis of established patterns, not
idiosyncratic:

- **Decision-as-unit** = ADRs / decision logs / RFCs (Nygard ADRs, MADR). The twist is
  treating the decision as the planned *unit of work* up front, not an after-the-fact
  record.
- **`research` / `prototype` tickets** = XP spikes and tracer bullets (Pragmatic
  Programmer); throwaway vs evolutionary prototyping.
- **Destination-first + fog** = rolling-wave planning / progressive elaboration (PMBOK)
  and deferred commitment / last-responsible-moment (Lean / Poppendieck).
- **Frontier** = dependency-DAG ready-set / topological scheduling (make/Bazel ready
  sets, Kanban "ready").
- **Map-as-shared-state** = blackboard architecture; story mapping (Patton).
- **Plan/build split + one-ticket-per-session** = planner-executor split + context
  isolation (HTN planning; agent context-engineering guidance).

Well-grounded parts are **structural** (DAG frontier, decision-as-unit, one-ticket
sessions, plan/build split). The fragile parts are all **boundary enforcement left in
prose**, where an agent's helpfulness/momentum bias crosses a line the design only
draws in words:

1. agent writes production code inside a planning map (prototype tickets are the erosion
   point: they license code);
2. agent over-plans into a many-ticket waterfall whose later tickets are invalidated by
   earlier decisions (fog-of-war is the mitigation only if the agent is *forced* to
   under-chart);
3. agent answers its own HITL grilling or picks among its own prototypes and self-closes
   a decision that is the human's.

The research also flagged that the tracker substrate is heavyweight: justified when you
need human collaboration, a multi-worker DAG, or an audit trail; a committed plan file
would cover a solo effort more cheaply. For grey-matter we keep the tracker because tkt
is already the spine and gives the frontier, graph validation, and audit for free.

## Decision

**Adapt.** Repointing (same as every skill): tkt is the tracker; the map is a ticket
tagged `type:epic` + `wayfinder:map` with children under it (interim epic convention,
native `--parent` lands with tkt 192-197); children are `tkt new ... --tags
wayfinder:<type>,epic:<map-slug>`; blocking is native `blocked_by`; the frontier is
`tkt ready`; claim is `tkt claim` -> `in_progress` (no assignee until tkt 194);
`setup-matt-pocock-skills` -> `init-project`; AGENTS.md-primary. `docs/tkt-conventions.md`
already reserves the `wayfinder:` tag axis, so this slots in cleanly.

Three agent-seam adaptations, the real value:

1. **Fog-of-war as the enforced default.** Explicit "under-chart; specify only the
   frontier you can state sharply now" with the waterfall trap named. Counters failure
   mode 2.
2. **Prototype artifacts go in `.scratch/`.** The one code-writing ticket type is pinned
   to the gitignored scratch convention so a prototype can't become committed
   implementation. Counters failure mode 1.
3. **HITL hard-stop made explicit.** A HITL ticket resolves *only* through live human
   exchange: the agent recommends, the human decides and closes; the agent never
   simulates the human, answers its own questions, or self-closes a prototype choice; if
   no human is present it waits. Counters failure mode 3. (No harness teeth available, so
   the prose is unambiguous and names the failure.)

**Dropped** the Notes execution-override escape hatch. Upstream lets a map carry
execution via its Notes, but the agent *writes* the Notes, and the single
worst-documented failure (an agent writing "this map carries execution" into Notes it
owns, then building on a live server) traces to exactly that. grey-matter makes
"plan, don't build" absolute; execution is a separate session.

Also dropped the human-facing "Common questions" troubleshooting section (it's human
narrative); kept the SKILL.md at the upstream artifact's altitude.

Kept verbatim: the four ticket types + HITL/AFK split, the map-as-index-not-store rule,
destination-first, refer-by-name, out-of-scope mechanics, breadth-first charting,
one-ticket-per-session.

## tkt feature requests (filed in D:\code\tkt, built against current state)

The skill ships working on tkt today via the interim epic/claim conventions. Follow-ups
filed to make the map a first-class tkt object later (not blockers): a `wayfinder:map`
view / frontier-within-epic query, and the already-queued native `--parent` (192-197) +
`assignee` (194) that retire the interim conventions this skill leans on.

## Cross-skill dependencies

Schedules other skills: `grilling` + `domain-modeling` (or `game-modeling`) resolve
grilling tickets; `prototype` resolves prototype tickets; `research` runs AFK as a
subagent. Hands off at `to-spec` (then `to-tickets`, `implement-spec`). `handoff` bridges
a too-big conversation into a map and side quests out of one. Uses the `wayfinder:` and
`epic:` tag axes from `docs/tkt-conventions.md`.

## Web-app bias

None in the planning machinery (domain-agnostic). The only lens touch is the grilling
step, which routes to `game-modeling` instead of `domain-modeling` when the subject is a
game system, per the established app/game split. No always-on lens pointer needed.

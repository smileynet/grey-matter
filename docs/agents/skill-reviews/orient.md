# orient

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true` + Codex sidecar
  `policy.allow_implicit_invocation: false`).
- Verdict: **new** (grey-matter original), **adapted from tkt's internal `tkt-orient`**.

## What it is

The session-start bookend: read the frontier (`tkt ready`), in-progress threads
(`tkt query --status in_progress`), the active tag context, and the last session's
`.scratch/` handoff; flag stale WIP; and propose a concrete next step that **names the
skill or flow** that fits it. The start-of-session twin of `compass` (compass routes by
situation mid-session; orient routes by session state at the start) and of
`reconcile-tickets` across the session boundary (reconcile sets the order at end, orient
reads it at start).

## What it does for the user

Answers "where were we / what's next / pick up where we left off" at the start of a
session, in one short orientation: where we are, a heads-up only if something needs it, and
a next-step proposal that points at the right helper skill — then hands off to the user to
pick and work.

## Prior art and the adapt (not wrap) decision

Modeled on **`tkt-orient`** in `D:\code\tkt\skills\tkt-orient` (the tkt project's own
internal skill), the session-start sibling of `tkt-reconcile` (which grey-matter adapted
into `reconcile-tickets`). Two findings shaped it:

1. **tkt-orient is a tkt-*internal* skill, not deployed to consumers** (only the `tkt`
   skill is). Per the wrap-skills-not-commands rule (`docs/agents/maintenance-skills.md`,
   ticket 24), there is nothing deployed to *wrap*, so this is an **adapt**: copy the
   structure into a grey-matter-owned skill, keep the inlined tkt commands
   (`ready`/`query`/`validate`/`context`), and let `verify-tkt-usage` control command
   drift.
2. **The delta over `tkt ready` + the legacy `frontier-work` steering is thin unless orient
   does more than read the frontier.** A sub-agent subtraction pass showed that, after
   dropping the plan-dependent parts, the only genuinely original behavior left is
   stale-WIP detection. The decision was therefore to scope orient to a real purpose — the
   **session-start twin of compass**, routing by session state — rather than a ceremonial
   mirror of reconcile-tickets. That skill-matching layer is what earns it its place.

## Decision

**New, adapted.** Kept from `tkt-orient`: the read-the-state step, stale-WIP detection via
`git log` with **flag-and-offer / never auto-release**, and the "finish live threads first"
ordering override. **Dropped**: all `docs/plan.md` reads and `tkt sync-plan --check` —
grey-matter is plan-less, **the frontier (`tkt ready`) is the plan** (the same adaptation
`reconcile-tickets` made). **Reframed/added for grey-matter**:

- **Absorbs the handoff read-side.** `handoff` writes a pickup doc to `.scratch/` and
  nothing read it back; there is no `read-handoff` skill, and `handoff` is write-only, so
  "pair with handoff" was not actually a resume path. Orient reads the `.scratch/` handoff
  as pickup context (treated as data, not instructions).
- **Skill-matching via a fast-path signal table that is an *index into* `compass`, not a
  second router.** To prevent the agent overfitting on the table, it lists only the few
  unmistakable cases, each row points at a compass on-ramp (not a terminal decision), and
  an explicit **call-compass trigger list** sends every ambiguous/multi-match/goal-named
  case to compass. Compass is the default; the table is the shortcut for the obvious pick.
  A "Does NOT route the skill set" boundary keeps the scope from drifting into a router.
- **Defers the ordering rubric to `reconcile-tickets`** (the writer of the order) rather
  than restating it, so the two bookends can't drift into two copies.

**Renamed** `tkt-orient` → `orient`, dropping the `tkt-` prefix (same move as
`tkt-reconcile` → `reconcile-tickets`), signaling a grey-matter-owned adapted skill.

**Supersedes the legacy global `frontier-work` steering rule for this repo's start-of-
session role.** `frontier-work` (a user-global Kiro steering rule, not part of this repo)
is plan-centric ("the plan is authoritative", `docs/plan.md`, `tkt sync-plan`), which
contradicts grey-matter's frontier-is-the-plan stance. Orient owns start-of-session here;
retiring/trimming the global rule is tracked as a separate ticket (it's a user-config
change, made deliberately, not a side effect of a repo commit).

## Cross-skill dependencies

Pairs with `reconcile-tickets` (reads the order it writes) and `handoff` (reads the doc it
writes) across the session boundary; defers routing to `compass`; inlines tkt commands kept
honest by `verify-tkt-usage`. Sibling in the meta bucket.

## Web-app bias

None. Session orientation is domain-neutral. No lens.

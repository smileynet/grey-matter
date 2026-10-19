# ask-matt -> compass

- Bucket: engineering. Invocation: **model-invoked** (changed from upstream's
  user-invoked; see Decision).
- Verdict: **adapt + rename**. Renamed `ask-matt` -> `compass`; repointed the whole map to
  the grey-matter set; made it model-invokable; added a maintenance-skills section.

## What it is

The master **router/index** over the whole skill set: a map, not a how-to. A main flow
(idea -> ship), on-ramps that merge onto it (triage, diagnosing-bugs, wayfinder), a
health lane, a vocabulary-underneath layer, phase-boundary guidance (+ PHASE-BOUNDARIES.md),
and a standalone list. Each entry names a skill, says what it does in one line, and places
it relative to the others. Opens with the hedge: read a skill's SKILL.md before asserting
what it does or recommending a step be skipped; the summaries are orientation only.

## What it does for the user

Solves the "I know a skill exists but can't name it / don't know which fits" problem, and
(now) lets the agent self-route when it's unsure. The relative-position framing (on-ramps
merging onto the main flow) beats an alphabetical list.

## Prior art (agent-filtered)

An **index + flowchart delivered as the progressive-disclosure top layer** (command
palette, table of contents, "human is the index that must remember skills exist"). Failure
modes, ranked:

1. **Staleness (biggest)**: listing a dropped/renamed skill or omitting a new one actively
   misdirects, worse than no router. The router's whole value is the
   completeness-and-correctness invariant.
2. **Summary drift**: one-liners diverging from what skills now do -> confident wrong
   "skip step X" advice; fails quietly. The read-before-asserting hedge is the correctly
   scoped mitigation (a mitigation, not a fix).
3. **Length becoming its own cognitive load** (~29 entries is near the scannable ceiling).
4. **Scope creep**: the router absorbing how-to detail and becoming the 30th skill.

The honest keep-it-honest answer: don't hand-maintain the index, make the skill set the
source of truth and lint against it (set-equality: every skill appears once, every named
skill resolves). The hedge covers drift; a mechanical check covers staleness.

## Decision

**Adapt + rename.**

- **Rename `ask-matt` -> `compass`.** It's grey-matter's router, not "Matt". `compass`
  reads as orientation ("which way from here"), doesn't collide with `wayfinder` (a
  planning skill, not a router), and serves both human discovery and agent self-routing.
  The name is ratified-or-revised by the maintenance-skills strategy (ticket 17).
- **Model-invokable** (dropped upstream's `disable-model-invocation`/`policy`), per the
  decision that the agent, not only the human, should consult the map when unsure which
  skill applies. A router the model can't use is half-wasted. The context-cost/leaner-
  agent-router question is deferred to ticket 18 (test agent-focused routing: adapt this
  one vs a separate lean agent-router).
- **Repointed the whole map to our reality**: tkt is the tracker throughout (frontier =
  `tkt ready`, findings/tickets via tkt, wayfinder's map is a tkt epic); harness-neutral
  invocation (skill names, no `/slash` prefixes, per `.agents/invocation.md` inherited
  convention); `setup-matt-pocock-skills` -> `init-project` as the precondition;
  `docs/agents/` paths.
- **Added the new skills**: the game regime in the vocabulary layer (game-modeling beside
  domain-modeling; game-native-design beside codebase-design, routed by project type),
  prototype's game branch, research-audit beside research, curate-docs in the health lane,
  and a new **"Maintaining this set"** section (init-project, review-skill, curate-docs)
  so the meta skills are discoverable but clearly not feature-building steps.
- **Kept**: the main-flow spine, the on-ramp structure, the read-before-asserting hedge
  (verbatim), the phase-boundary tree (PHASE-BOUNDARIES.md carried over, tracker-neutral),
  and the map-not-how-to discipline.

## Follow-up / open

- **teach and wait-what are now in the map** (Standalone section), re-synced when they
  were reviewed into the set. The staleness invariant holds: the router lists exactly the
  skills that exist here.
- **Ticket 17** (maintenance-skills strategy): ratifies the `compass` name, decides whether
  meta skills get a dedicated bucket vs a router section, and sets the sync strategy.
- **Ticket 18** (agent-focused routing): tests self-routing; may split a lean agent-router
  from this human map.
- A **set-equality lint** (every skill appears once, every named skill resolves) is the
  right staleness guard; owned by curate-docs, a CI check is a candidate. Not built yet.

## Cross-skill dependencies

Names nearly every skill. Hard dependency on the inventory staying in sync (curate-docs
owns that). Precondition pointer to init-project. Reads each named skill's SKILL.md on
demand (the hedge).

## Web-app bias

The map itself is domain-neutral; the one adaptation is surfacing the **app/game regime
split** in the vocabulary layer (domain-modeling vs game-modeling, codebase-design vs
game-native-design) and prototype's game branch, so a game project routes correctly. No
separate lens.

---
id: "17"
title: "Strategy for maintenance-oriented skills (router, review-skill, curate-docs, future upkeep skills)"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "A recorded strategy for how maintenance/meta skills (ones that build and tend the skill set itself) are organized, named, grouped, and surfaced, distinct from the feature-building flow"
  - "A decision on whether maintenance skills live in a dedicated bucket/section (e.g. skills/meta or a maintenance lane in the router) vs mixed into engineering"
  - "ask-matt renamed to a project-appropriate name, and the router names the maintenance skills in their own section"
  - "A list of known + anticipated maintenance skills (review-skill, curate-docs, init-project, the router, model-eval-harness per ticket 06, deep-dive-sources per ticket 12) placed under the strategy"
tags: ["type:decision", "stream:skills-review"]
---

# Strategy for maintenance-oriented skills (router, review-skill, curate-docs, future upkeep skills)

## What to build

Decide and record how **maintenance/meta skills** are organized across grey-matter.
These are skills that build and tend the skill set (and the repo) itself, rather than
skills a user routes through to ship a feature. They have accumulated enough to need a
coherent home and surfacing strategy.

### The maintenance skills (built + anticipated)

- **review-skill**: the adaptation method (review an upstream skill -> keep/adapt/drop).
- **curate-docs**: promote/move/prune agent-facing docs and notes.
- **init-project**: set up a repo's tracker/conventions for the other skills (precondition).
- **the router** (currently `ask-matt`, to be renamed): the index/map over the set.
- **model-eval-harness** (ticket 06): track how model changes affect skill handling.
- **deep-dive-primary-sources** (ticket 12): ground lenses in the original sources.
- future upkeep skills as they arise.

### Decisions to make

- **Grouping/home**: do maintenance skills get a dedicated bucket (e.g. `skills/meta/`)
  or a dedicated lane/section in the router, vs staying mixed into `skills/engineering/`?
  Weigh discoverability vs the clutter of a user scanning engineering and hitting
  meta skills that aren't part of feature work.
- **Naming**: rename `ask-matt` to a project-appropriate name (it is grey-matter's
  router, not "Matt"). Candidates discussed: `which-skill` (self-describing), `compass`
  (orientation), `atlas` (map). Pick and apply, updating the folder, `name`, and every
  reference.
- **Surfacing**: the router names maintenance skills in their own section (separate from
  the idea->ship flow), so they are discoverable but clearly not feature-building steps.
- **Sync strategy**: how the router/maintenance set stays honest as skills are added
  (curate-docs owns this; a CI set-equality lint is a candidate).

Blocks ticket 18 (agent-focused routing) since the naming/grouping decision shapes it.

## Acceptance criteria

- [x] A recorded strategy for how maintenance/meta skills are organized, named, grouped, and surfaced, distinct from the feature-building flow
- [x] A decision on dedicated bucket/section vs mixed into engineering
- [x] `ask-matt` renamed to a project-appropriate name, and the router names maintenance skills in their own section
- [x] The known + anticipated maintenance skills are listed under the strategy

## Resolution (2026-10-19)

Recorded the maintenance-skills strategy in docs/agents/maintenance-skills.md and executed it: created the skills/meta bucket (compass, curate-docs, init-project, review-skill moved via git mv, history preserved), added per-bucket README.md for engineering/productivity/meta grouped by invocation, ratified the ask-matt->compass rename, and set curate-docs + a planned set-equality lint as the sync guard. AGENTS.md and compass updated to point at the strategy; all links resolve; no em-dashes.

### Verification
1. ✓ A recorded strategy for how maintenance/meta skills (ones that build and tend the skill set itself) are organized, named, grouped, and surfaced, distinct from the feature-building flow — "docs/agents/maintenance-skills.md records the strategy: three-bucket model (engineering/productivity/meta), what counts as maintenance, join/leave rules, sync guard"
2. ✓ A decision on whether maintenance skills live in a dedicated bucket/section (e.g. skills/meta or a maintenance lane in the router) vs mixed into engineering — "Decision recorded: dedicated meta bucket (not mixed into engineering); executed via git mv to skills/meta/ with review-index bucket columns and review-note Bucket lines updated to meta"
3. ✓ ask-matt renamed to a project-appropriate name, and the router names the maintenance skills in their own section — "ask-matt renamed to compass (model-invokable, skills/meta/compass), ratified in maintenance-skills.md; compass's Maintaining-this-set section lists init-project/review-skill/curate-docs and points at the strategy doc"
4. ✓ A list of known + anticipated maintenance skills (review-skill, curate-docs, init-project, the router, model-eval-harness per ticket 06, deep-dive-sources per ticket 12) placed under the strategy — "Known + anticipated maintenance skills listed in maintenance-skills.md: current (init-project, review-skill, curate-docs, compass), anticipated (model-eval-harness ticket 06, primary-source deep-dive ticket 12)"

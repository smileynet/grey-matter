# Maintenance skills: the meta bucket

Some skills build and tend the skill set and the repo itself rather than ship a feature.
They have their own bucket, `skills/meta/`, and their own strategy, recorded here. (Ticket
17.)

## What counts as a maintenance skill

A skill whose **subject is the toolkit or the repo**, not the product. The test: does it
help you *build software* (engineering), *think and communicate* (productivity), or
*maintain the skill set / repo* (meta)? The three buckets are those three answers.

Current members of `skills/meta/`:

- **init-project**: the precondition, sets up a repo's tkt tracker, triage tags, and doc
  layout so the other skills have what they assume.
- **review-skill**: the method for reviewing an upstream skill and deciding
  keep/adapt/drop/new when adapting it into this set.
- **curate-docs**: promote a mature note into a skill, move a skill's private reference
  into its `references/`, prune stale docs. Also owns keeping the router and bucket
  READMEs honest.
- **cheat-sheet**: list every skill by category with a one-line description (the quick
  reference card; the flat index to compass's map).
- **compass**: the router/index over the whole set.
- **changelog / readme / release**: the release set. `changelog` maintains `CHANGELOG.md`
  (user-facing entries); `readme` keeps `README.md` honest; `release` is the single
  orchestrator that composes both, picks the version, and runs the gated tag/push/publish
  mechanics (`release/references/release.sh`).
- **reconcile-tickets**: end-of-session ticket-board hygiene (drift audit, capture
  untracked work, set frontier ordering). **Wraps the `tkt-core` skill** (calls it for the
  command surface + ticket standards rather than copying them, so it can't go stale as tkt
  evolves). Pairs with `retro`.
- **wrap-session**: the single end-of-session closing bookend. **Composes**
  `reconcile-tickets` then `retro`, then adds the beat neither does alone, **landing** the
  cheap, unambiguous **mechanical** findings this session (writing the check/guardrail or a
  project-level skill/note) instead of only filing them; expensive or ambiguous findings
  stay tickets. The session-end twin of `orient`.
- **orient**: the start-of-session bookend to `reconcile-tickets`. Reads the frontier +
  in-progress threads + the last session's `.scratch/` handoff, flags stale WIP
  (flag-and-offer, never auto-release), and proposes a next step naming the skill/flow that
  fits. **Adapted** from tkt's internal `tkt-orient` (not wrapped — tkt-orient is
  tkt-internal, not deployed); the plan-doc/`sync-plan` reads were dropped (grey-matter is
  plan-less), it absorbs the handoff read-side (there is no `read-handoff`), and it defers
  routing to `compass` and the ordering rubric to `reconcile-tickets` rather than
  restating either. The session-start twin of `compass`.
- **verify-tkt-usage**: validate the tkt **commands** the skills inline against the live
  `tkt capabilities` manifest, catching drift after a tkt upgrade. (Inlined commands are
  allowed, see the wrap-skills-not-commands rule below; this keeps them honest.)

Anticipated members (tracked elsewhere): a model-eval harness (ticket 06), a
primary-source deep-dive capture (ticket 12). File a maintenance skill under
`skills/meta/` when it arrives.

## Decisions

- **Dedicated bucket, not mixed into engineering.** Maintenance skills are a different
  *kind* and were cluttering a user scanning `engineering/` for feature tools. A third
  bucket (`meta`) alongside `engineering` and `productivity` keeps each bucket's purpose
  clean and lets the router's "Maintaining this set" section map 1:1 to a bucket. Buckets
  are organizational only, discovery is by explicit enumeration (a manifest or the router),
  and a skill's `name` keys off its own leaf directory regardless of bucket, so the bucket
  a skill lives in never affects how it's invoked (see
  `docs/agents/skill-frontmatter.md`).
- **The router is named `compass`** (was `ask-matt` upstream). Ratified here. It is
  grey-matter's router, not "Matt"; `compass` reads as orientation, doesn't collide with
  `wayfinder`, and serves both human discovery and agent self-routing (it is
  model-invokable). Whether a leaner *agent-only* router is also warranted is ticket 18.
- **Each bucket has a `README.md`** listing its skills grouped by invocation
  (user-invoked / model-invoked), with the skill name linked to its `SKILL.md`. These are
  the lightweight per-bucket index; `compass` is the cross-bucket map.
- **curate-docs owns sync.** The router and the bucket READMEs must list exactly the
  skills that exist, a stale index actively misleads. `curate-docs` is the skill that keeps
  them honest. The mechanical backstop is a **set-equality lint**: every skill folder
  appears in `compass` and in its bucket README exactly once, and every skill named there
  resolves to a real folder. This is now built: `scripts/check-docs-consistency.mjs` (run
  standalone, or via the umbrella `scripts/check-repo.mjs` with the installer, invocation,
  and ticket checks). See `AGENTS.md` ("Consistency checks").
- **Wrap tool-owned skills; inline tool commands.** This repo depends on the `tkt` tool
  (a setup prerequisite `init-project` checks). Where tkt ships a *skill* (the `tkt-core`
  skill, which owns the command surface and ticket standards), **wrap it**, call the Skill
  tool with `tkt-core` rather than copying its content, so it can't go stale as tkt evolves
  (`reconcile-tickets` does this). But **inlining tkt *commands*** (`tkt new`, `tkt close
  --check-all`, ...) directly in a skill **is fine**, the wrap rule is about skills, not
  commands. The staleness control for inlined commands is `verify-tkt-usage`, which checks
  them against the live `tkt capabilities` manifest after a tkt upgrade.

## How a skill joins or leaves the meta bucket

- **Joins** when a new skill's subject is the toolkit/repo (not a feature). `curate-docs`
  can promote a `docs/agents/` note into a meta skill the same way it promotes any note.
- **Leaves / is renamed** rarely; when it happens, update the bucket README, `compass`, and
  the review index together (the set-equality lint catches a missed one).

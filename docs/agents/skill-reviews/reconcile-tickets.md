# reconcile-tickets

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **new** (grey-matter original), **adapted from tkt's `tkt-reconcile`** as a thin
  wrapper over the `tkt` skill rather than a copy.

## What it is

An end-of-session ticket-board hygiene pass: audit open tickets for drift, capture
untracked session work as tickets, and set the ordering axes so the frontier's top picks
are right. Pairs with `retro` (board vs environment).

## Prior art and the wrapping decision

Modeled on **`tkt-reconcile`** in `D:\code\tkt\.kiro\skills\` (the tkt project's own
internal skill). Two findings shaped the design:

1. **tkt ships one consumer-facing skill, `tkt`** (SKILL.md + references for commands,
   ticket-format, ticket-standards, audit-quality), and it is what's actually deployed to
   the harness skill roots. `tkt-reconcile` and ~48 others are the tkt *project's* internal
   skills, not consumer artifacts. So the thing to wrap is the `tkt` skill.
2. **The user's principle: wrap, don't copy, tkt's skills.** tkt owns its command surface
   and ticket standards and updates them as the tool evolves. Copying that content into
   grey-matter forks it and invites staleness. So `reconcile-tickets` **calls the Skill
   tool with `tkt`** for commands + standards and carries only the grey-matter-specific
   judgment: what to reconcile, the capture-untracked discipline, and the frontier-ordering
   rubric.

## Decision

**New, as a wrapper.** Kept from `tkt-reconcile`: the drift-audit checklist, capture-
untracked-work, the three ordering axes (blocked_by / priority / tag), and the ordering
rubric. **Dropped**: everything about `docs/plan.md` and `tkt sync-plan`, grey-matter has
no plan doc; **the frontier (`tkt ready`) is the plan**, so "re-organize the plan" becomes
"set the axes so the frontier surfaces the right picks." `docs/plan.md` is noted only as
the reserved fallback for a future no-tkt optionality path, not a live path. Also dropped
the re-spelled command lists and ticket-standards (those are the `tkt` skill's job).

**Dependency made explicit**: this repo depends on tkt (tool + the `tkt` skill). Rather
than a graceful-degradation branch, `init-project` now verifies both as setup
prerequisites; skills may then assume tkt is present.

## Follow-up

- A repo-wide **wrap-don't-inline-tkt** pass is warranted: several existing skills
  (implement, implement-spec, wayfinder, triage, to-tickets, code-review, retro) and
  `docs/agents/tkt-conventions.md` currently re-spell tkt commands/standards and carry the
  same staleness risk. Tracked as a ticket; overlaps ticket 10 (tracker-adaptability) and
  04 (native-tkt migration).

## Cross-skill dependencies

Wraps the `tkt` skill (command surface + ticket standards). Pairs with `retro` at session
end (cross-pointed). Sibling in the meta bucket to compass/curate-docs/cheat-sheet/release.

## Web-app bias

None. Ticket hygiene is domain-neutral. No lens.

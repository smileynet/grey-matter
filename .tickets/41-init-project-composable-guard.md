---
id: "41"
title: "Make init-project's guard create-what's-missing (composable on a non-empty repo)"
status: open
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Make init-project's guard create-what's-missing (composable on a non-empty repo)

## What to build

Change `skills/meta/init-project/SKILL.md`'s idempotency guard from **all-or-nothing bail**
to **create-what's-missing**: when some plumbing already exists (e.g. `AGENTS.md`), init-project
should create only the genuinely-absent pieces (`.scratch/`, `.references/` + its rehydration
README, the `CLAUDE.md` pointer, `tkt init`, gitignore entries) rather than declaring the project
already scaffolded and stopping.

## Context

Surfaced while grilling ticket 40 (`adopt-project`). adopt-project will **call** init-project for
the plumbing half, but only after its own inventory/reconcile step has decided what is safe to
create. init-project's current guard bails early if `AGENTS.md`/scaffolding exists — which is
exactly the brownfield case — so a naive call would skip plumbing that genuinely is missing. The
all-or-nothing guard is a latent bug for *any* composition, not just adopt-project; "create what's
missing, skip what exists" is the behavior init-project should have regardless. Fixing it here keeps
one source of truth for the plumbing (so adopt-project doesn't reimplement or inline plumbing
knowledge).

Keep the guard **non-destructive**: skip-what-exists means never overwrite an existing file; only
create absent ones.

Read first: `skills/meta/init-project/SKILL.md`, `docs/agents/skill-reviews/init-project.md`,
`.tickets/40-adopt-project-brownfield.md`.

## Acceptance criteria

- [ ] init-project creates only the absent plumbing pieces when run on a partially-scaffolded repo, instead of bailing because one piece (e.g. `AGENTS.md`) exists.
- [ ] It never overwrites an existing file — skip-what-exists is non-destructive.
- [ ] It is safe to invoke from `adopt-project` after an inventory/reconcile step (the behavior ticket 40 depends on).
- [ ] `node scripts/check-repo.mjs` passes and the skill is redeployed via install-skills.mjs.

---
id: "42"
title: "Add conformance-audit: audit a repo's skills/scripts/agent-guidance against current grey-matter standards"
status: in_progress
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Add conformance-audit: audit a repo's skills/scripts/agent-guidance against current grey-matter standards

## What to build

A new user-invoked **meta** skill that audits a target repo's **existing skills, tool scripts, and
agent guidance** (AGENTS.md / CLAUDE.md / steering / docs pointers) against grey-matter's **current**
health / maintenance / optimization guidance, and surfaces (or fixes) where they have drifted or fall
short — e.g. an AGENTS.md that restates reference-sized material instead of pointing, a skill with
stale frontmatter or the wrong invocation policy, a tool script not wired into a consistency check, a
doc that duplicates what a current skill already owns, a no-op steering rule.

It is invoked by `adopt-project` as one step **and** is runnable **standalone** so an already-adopted
repo can be re-conformed as grey-matter's own guidance evolves (invocation policy changes, new
consistency checks, reshaped skills, etc.).

## Context

Surfaced while grilling ticket 40 (`adopt-project`). Adoption shouldn't only bring a repo *under* the
workflow — it should bring it up to *current standard*. We chose to make this a **distinct skill**
rather than a step inside adopt-project because: (1) grey-matter's guidance is a moving target, so a
repo adopted earlier drifts and needs periodic re-audit without re-adopting; (2) it is conceptually
"run grey-matter's health/maintenance standards against *this* repo" — the same instinct as
`check-repo.mjs` + `curate-docs`, pointed at a foreign repo; (3) it keeps adopt-project a composer.

It is **especially load-bearing in adopt-project's negotiate-semantics path** (the mature-bespoke
archetype, where an incumbent agent layer exists): the audit is where "this existing AGENTS.md / skill
/ script drifted from current standard" gets surfaced for the user to decide on.

This ticket is a **design brief — grill it separately before building.** Open questions for its own
grill:
- **Stance: report-only vs fix.** Does it emit a conformance report for human decision, or fix what it
  can (and which fixes are safe to auto-apply vs gated)? This also drives the name
  (`conformance-audit` = report-leaning; `conform-repo` = fix-leaning; `audit-repo-health`).
- **What "current guidance" is checked against** — the source of truth for the standards (the
  consistency checks? `writing-for-agents` + `doc-conventions` + `skill-frontmatter`? a checklist?).
- **Non-destructive contract** — same git-based reconcile-never-clobber discipline as adopt-project.
- How it reports in the two adopt-project polarities (install vs negotiate).

Read first: `.tickets/40-adopt-project-brownfield.md`, `scripts/check-repo.mjs`, `skills/meta/curate-docs`,
`skills/productivity/writing-for-agents`, `docs/agents/doc-conventions.md`, `docs/agents/skill-frontmatter.md`.

## Acceptance criteria

- [ ] A user-invoked `meta` skill exists that audits a target repo's skills, tool scripts, and agent-guidance files against grey-matter's current health/maintenance/optimization guidance.
- [ ] It is runnable standalone (periodic re-conformance) and invokable by `adopt-project` as a pipeline step.
- [ ] Its stance (report-only vs fix, and which fixes are gated) is decided in its own grill and documented in the skill.
- [ ] Non-destructive: any fixes reconcile on git (clean tree, reviewable), never clobber.
- [ ] Indexes updated (bucket README + compass + maintenance-skills roster) and `node scripts/check-repo.mjs` passes; deployed via install-skills.mjs.

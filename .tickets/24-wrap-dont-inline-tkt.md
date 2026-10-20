---
id: "24"
title: "Wrap the tkt skill instead of inlining tkt commands/standards across skills"
status: backlog
blocked_by: ["10"]
priority: medium
validation_criteria:
  - "Skills that currently re-spell tkt commands or ticket standards (implement, implement-spec, wayfinder, triage, to-tickets, code-review, retro, reconcile-tickets) point at the tkt skill for the command surface + standards instead of duplicating them"
  - "docs/agents/tkt-conventions.md keeps only grey-matter-specific policy (tag vocab, epic convention, homonym rulings) and defers command/standard detail to the tkt skill"
  - "A documented principle in AGENTS.md or doc-conventions: wrap tool-owned skills, don't copy their content (avoids staleness as the tool evolves)"
  - "No skill breaks if tkt's command surface changes, because the authoritative copy lives in the tkt skill"
tags: ["type:chore", "stream:skills-review"]
---

# Wrap the tkt skill instead of inlining tkt commands/standards across skills

## What to build

Apply the **wrap-don't-copy** principle across the repo: grey-matter depends on the `tkt`
tool, which ships a `tkt` skill that owns the command surface, ticket format, and
ticket-quality standard and is updated as the tool evolves. Several grey-matter skills
currently **re-spell** that content inline, so they go stale when tkt changes. Make them
**point at the `tkt` skill** instead and keep only grey-matter-specific policy.

### Why

`reconcile-tickets` was authored this way deliberately (calls the Skill tool with `tkt`
for commands + standards, carries only the grey-matter judgment). The rest of the set
predates that decision and still inlines tkt knowledge, the staleness risk the user
flagged.

### The inlining to remove

Audit and repoint, where each re-spells tkt commands or ticket standards rather than
grey-matter policy:

- `implement`, `implement-spec` (claim/close/ready flows), `wayfinder` (new/edit/ready,
  ticket body), `triage` (new/close/tags), `to-tickets` (new/batch/blocked-by/vc),
  `code-review` (query/new for findings), `retro` (query/close).
- `docs/agents/tkt-conventions.md`: keep the grey-matter-specific policy (tag vocabulary,
  epic convention, homonym rulings, the interim-vs-native notes) and **defer command and
  ticket-standard detail to the `tkt` skill** rather than restating it.

### What stays grey-matter's own

Tag vocabulary (`type:`/`triage:`/`kind:`/`epic:`/`stream:`/`wayfinder:`), the epic
convention, the frontier-is-the-plan stance, homonym rulings. Those are policy, not tkt
mechanics, keep them.

### Principle to record

Add to AGENTS.md / `doc-conventions.md`: **wrap tool-owned skills, don't copy their
content**, so the authoritative copy lives in the tool's own skill and our skills can't
drift from it.

Blocked by ticket 10 (tracker-adaptability): the abstraction boundary that decides how a
skill names tracker operations shapes exactly how this wrapping is expressed.

## Acceptance criteria

- [ ] The listed skills point at the `tkt` skill for the command surface + standards instead of duplicating them
- [ ] `docs/agents/tkt-conventions.md` keeps only grey-matter-specific policy and defers command/standard detail to the `tkt` skill
- [ ] A documented wrap-don't-copy principle in AGENTS.md or doc-conventions
- [ ] No skill breaks if tkt's command surface changes (authoritative copy lives in the tkt skill)

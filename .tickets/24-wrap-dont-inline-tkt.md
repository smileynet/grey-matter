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

TBD

## Acceptance criteria

- [ ] TBD

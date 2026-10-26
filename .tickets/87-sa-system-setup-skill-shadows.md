---
id: "87"
title: "sa-system-setup skill links shadow grey-matter handoff and grill-me in ~/.kiro/skills"
status: open
blocked_by: []
validation_criteria:
  - "Decision recorded: keep the sa-system-setup links, or retire them so grey-matter's handoff and grill-me deploy"
  - "deploy.mjs install reports no refused names, or the refusal is documented as intended"
tags: ["stream:migration", "type:decision"]
---

# sa-system-setup skill links shadow grey-matter handoff and grill-me in ~/.kiro/skills

## Observed (2026-10-26, `node scripts/deploy.mjs install`)

`~/.kiro/skills/{handoff,grill-me,read-handoff,cheatsheet}` are symlinks into
`~/code/sa-system-setup/skills/`. deploy.mjs correctly refuses `handoff` and `grill-me`
as foreign, so Kiro sessions get sa-system-setup's versions of those two, not
grey-matter's. `read-handoff` and `cheatsheet` duplicate grey-matter's `orient` and
`cheat-sheet` under old names. Other harnesses get grey-matter's versions.

## What to build

Owner decision: keep the sa-system-setup links (and accept the Kiro divergence), or
retire them and redeploy so grey-matter's `handoff`/`grill-me` land in Kiro too.

## Acceptance criteria

- [ ] Decision recorded: keep the sa-system-setup links, or retire them
- [ ] deploy.mjs install reports no refused names, or the refusal is documented as intended

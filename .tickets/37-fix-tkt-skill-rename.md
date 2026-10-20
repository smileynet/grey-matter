---
id: "37"
title: "Repoint 'tkt' skill references to 'tkt-core' (tkt renamed its reference skill)"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "No skill or doc instructs calling the Skill tool with a bare 'tkt' name; all point at 'tkt-core'"
  - "grep for the dangling 'tkt' skill reference across skills/ and docs/ returns only historical review/decision records"
tags: ["type:chore", "kind:bug", "stream:tooling"]
---

# Repoint 'tkt' skill references to 'tkt-core' (tkt renamed its reference skill)

## What to build

The tkt tool renamed its reference skill `tkt` → `tkt-core` (tkt v0.4.0, skill
set is now `tkt-core` + the `tkt-orient`/`tkt-work`/`tkt-reconcile` session trio).
There is no longer a bare `tkt` skill deployed to the harness skill root — only
`tkt-core`. grey-matter skills still instruct agents to "call the Skill tool with
`tkt`", which now resolves to nothing.

Repoint the live, load-bearing references from `tkt` to `tkt-core`:

- `skills/meta/reconcile-tickets/SKILL.md` — the Skill-tool call ("call the Skill
  tool with `tkt`", line ~20) is load-bearing; also the "`tkt` skill" mentions at
  ~14, 27, 60, 67.
- `skills/meta/init-project/SKILL.md` (~28) — the prerequisite check names the
  `tkt` skill that must be deployed.
- `skills/meta/README.md` (~22) — "wraps the `tkt` skill".
- `docs/agents/maintenance-skills.md` (~30, 74) — wrap-the-`tkt`-skill rule.

Leave historical records alone (they describe the decision at the time it was made):
`docs/agents/skill-reviews/*.md` and `.tickets/*.md` bodies may keep saying `tkt`.

## Context

- Discovered during a cross-repo integration review after tkt migrated its
  `frontier-work` steering into the `tkt-work` skill and (earlier) renamed `tkt`
  → `tkt-core`. Both repos deploy into the same `~/.kiro/skills/` root.
- The wrap-don't-inline rule (`docs/agents/maintenance-skills.md`, ticket #24)
  depends on the wrapped skill name being correct — this ticket keeps that rule honest.
- Relevant: tkt `skills/tkt-core/SKILL.md` (the renamed skill).

## Acceptance criteria

- [x] `reconcile-tickets` and `init-project` call/name `tkt-core`, not `tkt`
- [x] `skills/meta/README.md` and `docs/agents/maintenance-skills.md` name `tkt-core`
- [x] `grep -rn "\`tkt\` skill\|Skill tool with \`tkt\`" skills/ docs/agents/maintenance-skills.md` returns nothing live (only skill-reviews history remains)
- [x] `node scripts/check-repo.mjs` (or the docs-consistency check) still passes

## Resolution (2026-10-20)

Renamed all live 'tkt' skill references to 'tkt-core' (tkt renamed its reference skill in v0.4.0). Fixed the load-bearing Skill-tool call in reconcile-tickets/SKILL.md plus mentions there and in init-project/SKILL.md, skills/meta/README.md, and docs/agents/maintenance-skills.md. The tool is still 'tkt'; only the skill name changed. Historical skill-reviews/*.md left as-is (they record past decisions). check-repo.mjs passes.

### Verification
1. ✓ No skill or doc instructs calling the Skill tool with a bare 'tkt' name; all point at 'tkt-core' — "grep for 'Skill tool with tkt' / 'the tkt skill' across skills/ + maintenance-skills.md returns NONE; reconcile-tickets and init-project now call/name tkt-core"
2. ✓ grep for the dangling 'tkt' skill reference across skills/ and docs/ returns only historical review/decision records — "Live grep clean; only docs/agents/skill-reviews/{reconcile-tickets,verify-tkt-usage}.md retain historical 'tkt skill' mentions, as intended"

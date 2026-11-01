---
id: "143"
title: "init-project and conformance-audit check cross-harness readiness (Antigravity, Codex)"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Audit checks instruction files, skills and rule frontmatter"
  - "Findings verified against official harness docs"
tags: ["stream:tooling"]
---

# init-project and conformance-audit check cross-harness readiness (Antigravity, Codex)

## Origin

Field report from philippines-trip, 2026-11-01, preparing a repo for Google Antigravity (Gemini 4 Argon) on Windows. Official docs checked that day (antigravity.google/docs/rules, /skills, /migration/workflows-to-skills): Antigravity reads AGENTS.md or GEMINI.md, `.agents/AGENTS.md`, `.agents/rules/*.md` and `.agents/skills/*/SKILL.md`, but not CLAUDE.md or `.claude/skills`; each file is truncated at 24,000 bytes; a rules file without a valid `trigger:` frontmatter is silently discarded; workflows stopped working 2026-10-19 (use skills). A CLAUDE.md that only says "See AGENTS.md" is not an import (`@AGENTS.md` is). Node tool deps resolved through a hardcoded NODE_PATH broke on a fresh clone until a `package.json` was added.

## Acceptance criteria

- [ ] conformance-audit checks: AGENTS.md exists and is under 24 KB; CLAUDE.md imports it; shared skills live in `.agents/skills/` with spec frontmatter; every `.agents/rules/*.md` has a valid trigger; no `.agents/workflows/`; no hardcoded absolute paths in tool usage lines; Node/Python tool deps have a manifest.
- [ ] init-project scaffolds the same, with the harness facts and dates sourced in docs/agents/harnesses.md.
- [ ] Facts are rechecked against official docs when the check is implemented.

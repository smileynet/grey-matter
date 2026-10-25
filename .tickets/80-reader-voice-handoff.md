---
id: "80"
title: "Apply accepted reader-focused voice and in-dashboard handoff guidance"
status: open
blocked_by: []
validation_criteria:
  - "Shared prose and report guidance implement the four accepted review decisions without imposing article-specific defaults"
  - "Repository, skill syntax, and changed-guidance review checks pass"
  - "Deployment check and audit verify configured plugin and skill-root consumers use the updated guidance"
tags: ["stream:skills-review"]
---

# Apply accepted reader-focused voice and in-dashboard handoff guidance

## Intent and context

Sam accepted all four voice/handoff proposals on October 25, 2026, including the revised prototype handoff: prefer in-dashboard screenshots, mocks, or working embeds when practical so readers can inspect and compare without leaving and returning. Sam explicitly requested implementation, checks, deployment, and verification of plugin updates.

Read `docs/agents/doc-conventions.md`, `docs/agents/report-format.md`, `skills/productivity/delivery-dashboard/SKILL.md`, `skills/engineering/prototype/UI.md`, and `docs/agents/distribution-maintenance.md`.

## What to build

Human-facing writing follows the reader's task with plain, precise language and intentional summaries. HTML supports review of unfinished proposals as well as explanations. Relevant views open or refresh when supported, with links as fallback. Prototype comparisons stay in the dashboard when practical. Preserve contextual formats, technical caveats, and existing evidence/retention/throwaway rules.

Do not impose the article's perspective, dark theme, italic summaries, embedded images, or starter prompt on every output. Keep one owner for prose and one for presentation.

## Acceptance criteria

- [ ] Shared prose and report guidance implement the four accepted review decisions without imposing article-specific defaults.
- [ ] Repository, skill syntax, and changed-guidance review checks pass.
- [ ] Deployment check and audit verify configured plugin and skill-root consumers use the updated guidance.

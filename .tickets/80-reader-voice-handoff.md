---
id: "80"
title: "Apply accepted reader-focused voice and in-dashboard handoff guidance"
status: done
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

- [x] Shared prose and report guidance implement the four accepted review decisions without imposing article-specific defaults.
- [x] Repository, skill syntax, and changed-guidance review checks pass.
- [x] Deployment check and audit verify configured plugin and skill-root consumers use the updated guidance.

## Resolution (2026-10-25)

Applied and pushed the accepted voice, report format, dashboard handoff, and in-dashboard prototype preview guidance. Deployed and verified local plugin consumers plus linked bare roots; reload plugins/start new sessions to consume refreshed instructions.

### Verification
1. ✓ Shared prose and report guidance implement the four accepted review decisions without imposing article-specific defaults — "Direct inspection and independent prose review confirmed the four accepted changes in doc-conventions, report-format, delivery-dashboard, and prototype UI; AGENTS pointer updated; source commit 1c6bf74."
2. ✓ Repository, skill syntax, and changed-guidance review checks pass — "node scripts/check-repo.mjs passed all 13 invariants; node --test scripts/skill-syntax.test.mjs passed 10/10; git diff --check passed. Existing ticket07 warning and one Linux-only skip were read and retained."
3. ✓ Deployment check and audit verify configured plugin and skill-root consumers use the updated guidance — "node scripts/deploy.mjs and corrective --link deployment succeeded. deploy check passed; strict audit passed with 18 plugins, 4 packs, zero findings/errors. All four Codex cache files match source; Antigravity changed content matches source/build; Claude reads source; Kiro/OpenCode source-linked skills resolve shared docs. Copy-mode gap captured as ticket81."

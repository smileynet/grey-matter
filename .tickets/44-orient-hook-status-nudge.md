---
id: "44"
title: "orient could nudge if the pre-commit hook isn't installed (optional)"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "orient checks hook status via install-hooks.mjs list and nudges once if absent"
  - "nudge is advisory, not forced; stays opt-in"
tags: ["stream:tooling"]
---

# orient could nudge if the pre-commit hook isn't installed (optional)

## What to build

Optionally have `orient` (the session-start bookend) check whether the opt-in pre-commit
consistency hook is installed (`node scripts/install-hooks.mjs list`) and, if absent, nudge
the user once — converting the opt-in into a once-per-repo prompt without forcing it.

## Context

Retro finding (2026-10-22 wrap-session), classified LOW / acceptable-by-design. `check-repo.mjs`
runs only on manual invoke or via the opt-in `scripts/hooks/pre-commit`; CI was deliberately
removed (local-hooks-only). The residual gap — a fresh clone where the hook isn't installed and
the agent forgets the manual run before pushing — is real but low-probability and by design.
AGENTS.md already tells agents to run the check and install the hook. This ticket is the *optional*
improvement: a gentle orient-time nudge. Deliberately **backlog** — it's a nice-to-have, not
actionable-now work, and it edits a core bookend skill for a low-probability gap.

Read first: `skills/meta/orient/SKILL.md`, `scripts/install-hooks.mjs`, AGENTS.md ("Working rhythm").

## Acceptance criteria

- [ ] orient checks hook status (`install-hooks.mjs list`) and nudges once if the hook is absent.
- [ ] The nudge is advisory, not forced; the hook stays opt-in.

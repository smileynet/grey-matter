---
id: "36"
title: "Add a short agent-facing note on Windows/PowerShell command gotchas"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "A committed agent-facing note lists the handful of PowerShell/Windows traps that recur, each with the correct form"
  - "It is reachable from AGENTS.md (a pointer), not an orphan doc"
tags: ["stream:tooling"]
---

# Add a short agent-facing note on Windows/PowerShell command gotchas

## What to build

A short `docs/agents/` note (pointed at from AGENTS.md) capturing the recurring
Windows/PowerShell command traps an agent hits in this repo, with the correct form for
each, so they aren't rediscovered every session.

## Context

Retro finding (2026-10-20 session). The repo is Windows-primary (ships `install-skills.ps1`
and the shell runs PowerShell), and several commands failed on first try from PS quirks:
`Rename-Item` needs a leaf name for `-NewName` (not a path) — prefer `Move-Item` with full
paths; multi-line here-strings are fragile from the agent — prefer the dedicated write/edit
tools over `echo`/here-strings; quote paths with spaces. Low severity (each was recovered
in one retry), but cross-session and cheap to document once.

Keep it tiny and reachable. The general "use dedicated tools not shell for file ops" rule
already exists in the harness; this note is specifically the Windows/PowerShell deltas.

Read first: AGENTS.md, `docs/agents/doc-conventions.md` (where agent-facing notes live).

## Acceptance criteria

- [x] A committed agent-facing note lists the recurring PowerShell/Windows traps with the correct form for each.
- [x] It is reachable via a pointer from AGENTS.md, not an orphan.

## Resolution (2026-10-20)

done: added a committed agent-facing Windows/PowerShell gotchas note (Move-Item vs Rename-Item, semicolon not double-ampersand, env-var syntax, here-string fragility, path quoting, -Filter array), reachable via a pointer in AGENTS.md's conventions list.

### Verification
1. ✓ A committed agent-facing note lists the handful of PowerShell/Windows traps that recur, each with the correct form — "docs/agents/windows-powershell-gotchas.md committed (d65c5b9); AGENTS.md pointer added; check-repo.mjs link check passes."
2. ✓ It is reachable from AGENTS.md (a pointer), not an orphan doc — "(no evidence)"

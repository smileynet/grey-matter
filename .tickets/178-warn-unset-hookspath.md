---
id: "178"
title: "Warn when grey-matter's own clone has no core.hooksPath, so pushes skip the pre-push stage"
status: open
blocked_by: []
tags: ["stream:tooling"]
---
# Warn when grey-matter's own clone has no core.hooksPath, so pushes skip the pre-push stage

## Intent source

Session retro, 2026-11-01. A static check failed and a chained command committed and pushed anyway;
the pipe and `;` traps recurred three times (docs/agents/windows-powershell-gotchas.md). The tracked
`.githooks/pre-push` would have blocked it, but it only runs once a clone sets
`git config core.hooksPath .githooks`, which proposal 18 keeps opt-in and nothing reminds anyone of.

## Context

Changing Git config stays the user's call (AGENTS.md working rhythm). The fix is a warning, not an
installer: `node scripts/deploy.mjs` (run after every guidance change) or the `orient` skill prints
one line when this checkout's `core.hooksPath` is not `.githooks`, naming the command to opt in.

## Acceptance criteria

- [ ] With `core.hooksPath` unset in a grey-matter checkout, the chosen command prints one warning
      naming `git config core.hooksPath .githooks`; with it set, it prints nothing.
- [ ] It never changes Git config itself, and stays silent in consumer projects.
- [ ] `node scripts/gate.mjs pre-merge` passes.
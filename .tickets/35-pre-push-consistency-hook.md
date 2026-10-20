---
id: "35"
title: "Add a pre-push (or pre-commit) hook running check-repo.mjs for fast local feedback"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "A git hook runs check-repo.mjs (or the cheap subset) before push/commit and blocks on a nonzero exit"
  - "The hook is opt-in or documented install (not forced on every clone), and degrades gracefully if Node/tkt are absent"
tags: ["type:enhancement", "stream:tooling"]
---

# Add a pre-push (or pre-commit) hook running check-repo.mjs for fast local feedback

## What to build

A local git hook (pre-push preferred; pre-commit is an option) that runs
`node scripts/check-repo.mjs` and blocks the operation on a nonzero exit, so a broken link,
a lost invocation sidecar, or an index drift is caught **locally, before** the push that
AGENTS.md's "Working rhythm" does immediately — rather than only in CI (ticket 34) after
it reaches the remote.

## Context

Retro finding (end of the 2026-10-20 review session). `check-repo.mjs` (ticket 31) exists
and is read-only + offline, so a hook is near-free. The "Working rhythm" section pushes
after every commit, which means a regression currently reaches `main` before any automated
check runs. A pre-push hook is cheaper and faster-feedback than push/PR CI.

Note upstream prior art: the unused `setup-pre-commit` skill (flagged in ticket 21) and the
pre-commit-hook direction in proposals 01b/01c. This ticket is the concrete grey-matter
instance. Pairs with ticket 34 (CI wiring) — hook = local fast path, CI = the backstop;
both call the same command.

Read first: `scripts/check-repo.mjs`, AGENTS.md ("Working rhythm", "Consistency checks"),
`.tickets/34-wire-check-repo-ci.md`.

## Acceptance criteria

- [ ] A git hook runs `check-repo.mjs` (or a documented cheap subset) before push/commit and blocks on nonzero exit.
- [ ] The hook is opt-in / documented-install, not forced on every clone, and degrades gracefully if Node or tkt are absent.
- [ ] Interaction with ticket 34's CI is noted (local fast path vs remote backstop; same command).

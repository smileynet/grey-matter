---
id: "35"
title: "Add a pre-push (or pre-commit) hook running check-repo.mjs for fast local feedback"
status: done
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

- [x] A git hook runs `check-repo.mjs` (or a documented cheap subset) before push/commit and blocks on nonzero exit.
- [x] The hook is opt-in / documented-install, not forced on every clone, and degrades gracefully if Node or tkt are absent.
- [x] Interaction with ticket 34's CI is noted (local fast path vs remote backstop; same command).

## Resolution (2026-10-20)

done: opt-in pre-push hook runs check-repo.mjs and blocks on nonzero exit; installer is install/list/uninstall, idempotent, not forced on clone, refuses to clobber/remove a foreign hook, degrades gracefully without node. Ticket 34 CI interaction documented in AGENTS.md.

### Verification
1. ✓ A git hook runs check-repo.mjs (or the cheap subset) before push/commit and blocks on a nonzero exit — "scripts/hooks/pre-push + install-hooks.mjs/.sh/.ps1 committed (cc15cd1); tested list/install/idempotent, hook runs check-repo.mjs exit 0 on clean repo, graceful node-absent path."
2. ✓ The hook is opt-in or documented install (not forced on every clone), and degrades gracefully if Node/tkt are absent — "Foreign-hook install and uninstall both REFUSED; opt-in (not forced on clone); AGENTS.md documents CI-vs-hook interaction (local fast path vs remote backstop, same command)."

## Correction (2026-10-20)

Two post-close changes:

1. **No CI** (maintainer direction): the ticket-34 CI pairing referenced above no longer
   applies — there is no CI (GitHub Actions was dropped), so this local hook is the sole
   automated gate.
2. **Stage: pre-commit** (agent judgement; maintainer indifferent to stage): the hook was
   moved from `pre-push` to **`pre-commit`** (commit `9e6f167`). Rationale — `check-repo.mjs`
   validates the whole tree (not a staged diff) so it's correct at either stage, and the
   repo's commit-then-immediately-push rhythm means a pre-commit gate stops a broken
   index/link *before* the bad commit exists rather than after. `scripts/hooks/pre-commit`
   blocks the commit on failure (bypass: `git commit --no-verify`). Same opt-in installer
   (`scripts/install-hooks.mjs` — install/list/uninstall, idempotent, foreign-hook-safe).

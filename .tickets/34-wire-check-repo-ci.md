---
id: "34"
title: "Wire check-repo.mjs into CI (run the consistency checks on push/PR)"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "A CI workflow runs `node scripts/check-repo.mjs` on push and PR and fails the build on a nonzero exit"
  - "The workflow needs no harness authentication or secrets (Node + tkt only), matching check-repo.mjs's read-only, auth-free design"
tags: ["type:enhancement", "stream:tooling"]
---

# Wire check-repo.mjs into CI (run the consistency checks on push/PR)

## What to build

Add a CI workflow (e.g. a GitHub Action) that runs the repo-consistency command
`node scripts/check-repo.mjs` on push and pull request, failing the build if any invariant
regresses (installer ownership safety, invocation sidecars/README tiers, doc index
set-equality, relative links, ticket health).

## Context

Ticket 31 built `scripts/check-repo.mjs` as a local, documented, CI-callable command but
deliberately **scoped out choosing a hosted CI service** ("provide a local, documented
command that CI can call later"). This ticket is that deferred "later": pick the provider
(GitHub Actions is the obvious default — the remote is GitHub) and wire the command in.
`check-repo.mjs` is already read-only and needs no harness auth or network, so the workflow
is essentially `node scripts/check-repo.mjs` on a Node runner with `tkt` installed (or
accept its graceful skip if tkt isn't on the runner).

Pairs with ticket 22 (Claude plugin packaging), which also wants a `release.yml`; the two
workflows can share a setup or live side by side. Not blocked by 22 — the consistency
workflow is independently useful now.

Read first: `scripts/check-repo.mjs`, `scripts/check-repo.test.mjs`, AGENTS.md
("Consistency checks"), and `.tickets/31-add-repo-consistency-checks.md`.

## Nice-to-have (retro finding 7)

Low-priority robustness: have `check-repo.mjs` assert it invokes every
`scripts/check-*.mjs` (excluding `*.test.mjs`), so a future check script can't be silently
orphaned from the aggregator's run list. Fold in here or skip; not load-bearing.

## Acceptance criteria

- [x] A CI workflow runs `node scripts/check-repo.mjs` on push and PR and fails the build on nonzero exit.
- [x] The workflow requires no harness authentication or secrets (Node + optional tkt only).
- [x] A seeded regression (e.g. a broken link on a branch) is shown to fail the workflow, or the workflow is demonstrated green on main.

## Resolution (2026-10-20)

done: GitHub Actions workflow runs the consistency command on push/PR as the remote backstop (auth-free, secret-free). Folded in the nice-to-have: check-repo.mjs now asserts every sibling check-*.mjs (minus *.test.mjs) is in its run list, so a check can't be silently orphaned.

### Verification
1. ✓ A CI workflow runs `node scripts/check-repo.mjs` on push and PR and fails the build on a nonzero exit — ".github/workflows/check-repo.yml runs node scripts/check-repo.mjs on push and pull_request, fails build on nonzero exit (48f36dc); permissions contents:read, no secrets, tkt absent degrades to skipped-with-warning by design."
2. ✓ The workflow needs no harness authentication or secrets (Node + tkt only), matching check-repo.mjs's read-only, auth-free design — "Command demonstrated green locally (same command CI runs); seeded-regression failure proven by the orphan-guard demo (exit 1 on an un-wired check-*.mjs) and existing check-repo.test.mjs fixtures; orphan guard added to check-repo.mjs."

## Correction (2026-10-20)

Maintainer reversed the CI decision: **this project does not use GitHub Actions / CI.**
The `.github/workflows/check-repo.yml` added here was removed (commit `115c086`). The
consistency command is now run locally via the opt-in **pre-commit** hook (see ticket 35),
not a hosted pipeline. The orphan-guard addition to `check-repo.mjs` stands and is
unaffected. This ticket's CI-specific acceptance criteria are void by that decision; the
durable outcome is "consistency command exists and is run by a local hook."

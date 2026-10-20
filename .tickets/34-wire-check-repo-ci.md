---
id: "34"
title: "Wire check-repo.mjs into CI (run the consistency checks on push/PR)"
status: backlog
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

- [ ] A CI workflow runs `node scripts/check-repo.mjs` on push and PR and fails the build on nonzero exit.
- [ ] The workflow requires no harness authentication or secrets (Node + optional tkt only).
- [ ] A seeded regression (e.g. a broken link on a branch) is shown to fail the workflow, or the workflow is demonstrated green on main.

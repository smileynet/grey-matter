---
id: "31"
title: "Automate repository consistency checks for skill distribution"
status: in_progress
blocked_by: ["26", "27", "29", "30"]
priority: medium
validation_criteria:
  - "One documented command verifies installer ownership safety, invocation sidecars, indexes, links, and ticket validation"
  - "The command exits nonzero for a seeded mismatch in each checked invariant"
  - "The command passes on the repaired repository"
tags: ["type:chore", "stream:tooling"]
---

# Automate repository consistency checks for skill distribution

## What to build

Maintainers need one repeatable verification command that catches drift between the skill
tree, installer safety contract, invocation policy, indexes, durable links, and ticket
closure health before a release or distribution update.

## Context

Found during the 2026-10-19 repository review. Tickets 26, 27, 29, and 30 repair
invariants that are currently checked only by human review. The meta strategy already
promises a set-equality lint in `docs/agents/maintenance-skills.md`, and
`skills/meta/verify-tkt-usage/SKILL.md` identifies committed deterministic checks as a
future hardening direction.

Read first: `scripts/install-skills.mjs`, `docs/agents/maintenance-skills.md`,
`skills/meta/verify-tkt-usage/SKILL.md`, and tickets 26, 27, 29, and 30.

## Out of scope

Do not add a hosted CI service unless a repository maintainer separately chooses one;
provide a local, documented command that CI can call later.

## Acceptance criteria

- [ ] One documented command verifies all repaired invariants without mutating a user skill root.
- [ ] Fixture tests prove the command fails for a foreign-directory ownership error, invocation-policy mismatch, index mismatch, broken durable link, and invalid done ticket.
- [ ] The command exits successfully against the repaired repository.
- [ ] The command is practical to invoke from future CI without harness authentication.

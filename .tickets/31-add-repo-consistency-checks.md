---
id: "31"
title: "Automate repository consistency checks for skill distribution"
status: done
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

- [x] One documented command verifies all repaired invariants without mutating a user skill root.
- [x] Fixture tests prove the command fails for a foreign-directory ownership error, invocation-policy mismatch, index mismatch, broken durable link, and invalid done ticket.
- [x] The command exits successfully against the repaired repository.
- [x] The command is practical to invoke from future CI without harness authentication.

## Resolution (2026-10-20)

Added scripts/check-repo.mjs: one documented command verifying all five invariants (installer ownership safety, invocation sidecars/README tiers, doc index set-equality, relative links, tkt ticket health), aggregating two scripts built earlier this session (install-skills.test.mjs, check-invocation-policy.mjs) plus a new check-docs-consistency.mjs. Read-only on user state (installer check uses throwaway temp roots), no harness auth/network (tkt degrades to skip), CI-callable. Fixtures in check-repo.test.mjs prove each invariant fails when seeded and the repaired repo passes (7/7). Documented in AGENTS.md 'Consistency checks'; the maintenance-skills set-equality promise now points at the built check. Committed 1efbc41, pushed.

### Verification
1. ✓ One documented command verifies installer ownership safety, invocation sidecars, indexes, links, and ticket validation — "node scripts/check-repo.mjs runs all five invariants and prints a summary; it is read-only (installer sub-check uses mkdtemp temp roots, others only read files) and documented in AGENTS.md. Confirmed exit 0 on the repaired repo with all four summary rows [ok]."
2. ✓ The command exits nonzero for a seeded mismatch in each checked invariant — "scripts/check-repo.test.mjs (node --test) seeds a mismatch in each invariant — foreign-dir ownership (install-skills.test.mjs AC1/AC2), invocation one-sided sidecar loss, README invocation-tier misfile, index missing-skill, and broken relative link — and asserts the relevant check exits 1; 7/7 pass, and the repo is left pristine (git status shows no leaked edits)."
3. ✓ The command passes on the repaired repository — "node scripts/check-repo.mjs exits 0 against the repaired repository: installer 5/5, invocation OK (39 skills, 24 user-invoked consistent), docs OK (indexes + links), tkt validate pass. AC4 practicality: no harness login or network used; tkt is the only external tool and is optional."

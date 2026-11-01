# Local gates

A **gate** is a check a Git hook runs on every commit or push. It taxes every commit for the
life of the project, so the default is no gate: the agent's own cadence on the
[test-environment ladder](test-environment-ladder.md) and on-demand check commands cover the rest.
Add a gate sparingly, for a key area, with a focused scope and a measured budget.

## Where each check runs

| Stage | Runs | Budget (all gates together, warm cache) |
|---|---|---|
| pre-commit | tier 0 on staged files: format, lint, parse, a focused invariant | 10 s |
| pre-push | tier 0 critical invariants only: the checks that stop a broken install or manifest from publishing | 30 s |
| release workflow | the full test suite, before the release is staged | none; it runs once per release |
| on demand, before merge | full tier 0 to 2 suite, tier 3 critical flows, agent review (`code-review`, critics) | none; the agent runs and reports it |
| hosted CI (GitHub Actions) | manual dispatch only, for evidence no local host gives (another OS, a clean machine) | none |

Test suites run in the release workflow, not at push: a slow or flaky fixture must never block
publishing tickets, docs or fixes. Hosted CI does not run them either.
Agent and LLM reviews take minutes and vary run to run, so they run on demand before merge,
never in a hook. Builds, full suites, rendered, simulator and device tiers also stay out of hooks.

## When a gate earns its place

All four hold:

1. **Key area**: a failure there is costly or surfaces late (release manifest, save or wire
   format, schema, public API, generated index).
2. **Observed**: the failure has happened, not just could.
3. **Mechanical**: a deterministic check catches it with no judgement.
4. **In budget**: measured on a typical change, it fits the stage's budget with the gates
   already there.

Anything else is a linter rule or a check script the agent runs on demand, listed in the
project's `AGENTS.md` test commands.

## Each gate declares

- **Scope**: the paths it watches. With none changed it exits 0 at once.
- **Catches**: the one failure it exists for.
- **Command** and **measured time**, with the date measured.

Record these in a header comment in the hook and in the `AGENTS.md` test commands.

## Over budget

Move it one stage later (pre-commit, pre-push, release), else remove it. A test is not
critical enough for a hook unless its failure would publish something broken to consumers.
Re-time the hook whenever a gate is added, and whenever a commit or push feels slow. A gate over budget, without a
scope, or guarding a failure no longer seen is a finding for `retro` and `conformance-audit`.

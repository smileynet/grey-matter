# Proposal 18: three-stage verification, rebuilt from zero

**Status:** proposed 2026-11-01. Step 0 (remove the old gate) is done in the same change.
**Supersedes:** the hook layout in [local gates](../local-gates.md) and the `check-repo.mjs` modes.
**Absorbs:** tickets 137, 138, 151, 152, 153 (see [Ticket disposition](#ticket-disposition)).

## Why start over

The old gate grew by accretion: one aggregator (`check-repo.mjs`) behind a pre-commit hook, a Git
pre-push hook and a Claude plugin PreToolUse hook. Observed costs:

- 15m12s for one full run here, a modal Recycle Bin dialog that hung it, and 3 red groups on
  Windows (2026-11-01). A push could run it three times.
- The Claude plugin hook shipped to **every** project that installs grey-matter. It fired on
  `git stash push` and on ticket titles containing "git push", checked the wrong repository
  for `git -C`, and called consumer checkers with an argument contract they did not share (153).
- Consumers copied the shape: tagalog-helper ran a 6 to 8 minute gate on every commit,
  docs-only commits included (152); philippines-trip's push hung 524 s in our footprint test (151).

Trimming did not fix the shape, so step 0 removes every enforcement point and the rebuild
admits checks one at a time.

## The three stages

| | Pre-push | Pre-merge | Pre-release |
|---|---|---|---|
| **Question** | Would this push break someone who pulls or installs right now? | Does this change work and fit, before it joins the trunk? | Does the product work end to end, where users run it? |
| **Priority** | most critical | important | complete |
| **Runs** | tier 0 static invariants on consumer-facing files | tiers 0 to 2 for the changed areas, plus agent review when risk warrants | everything: full suite, every OS, real harness installs, simulators and live devices |
| **Selected by** | the paths in the commits being pushed (Git's stdin refs), never the working tree | the paths changed on the branch or ticket | nothing; all of it |
| **Budget** | 30 s total; 0 s when no scoped path changed | 5 min per run, no single check over 2 min | none; once per release |
| **Enforced by** | one Git pre-push hook per clone, opt-in | the agent, as `tkt close` evidence or before a branch merge | the `release` skill, as gate receipts |
| **Never** | tests, temp repos, network, harness or tool spawns, anything that can prompt | hooks; full suite by default | skipped silently: a check not run is recorded "not run" |

**Pre-merge on trunk.** grey-matter and most consumers commit straight to `main`, so "merge" has
no event. Pre-merge then runs **before closing the ticket** whose change it is, and before merging
a worktree branch (`implement-spec`). That keeps it out of the push path and ties it to a unit of
work.

**Pre-release includes devices.** A game or mobile consumer's pre-release names its simulator matrix
and its tier 5 device checks (input feel, frame pacing, memory, install) from the
[test-environment ladder](../test-environment-ladder.md). The release does not stage until each is
a receipt or an explicit "not run" accepted by the owner.

## Admission rules (every stage)

A check enters a stage only with all of:

1. **Catches**: one named failure, observed (an incident, a ticket or a field report).
2. **Scope**: the paths it guards. Pre-push and pre-merge skip it when none changed.
3. **Measured time** on this host, with date, inside the stage budget.
4. **A per-check timeout** (pre-push 10 s, pre-merge 2 min, pre-release set per check). A timeout
   is an `infrastructure error` outcome, never a hang.
5. **Green on every supported host**, or skipped there with a stated reason. Flaky checks stay out
   until fixed.

Prefer the earliest stage that can observe the failure; a check that misses the budget moves
**later**, never gets the budget raised.

## One manifest, one runner

Replace the hard-coded groups in `check-repo.mjs` with a declared list, `scripts/gates.json`:

```json
{ "checks": [
  { "id": "plugin-manifest", "stage": "pre-push", "catches": "plugin install fails for consumers",
    "scope": [".claude-plugin/", ".codex-plugin/", "skill-packs.json"],
    "run": ["node", "scripts/check-plugin-manifest.mjs"], "timeout_s": 10, "measured": "1.6 s, 2026-11-01" }
] }
```

`node scripts/gate.mjs <pre-push|pre-merge|pre-release> [--base REF]` reads it, selects by stage and
changed paths, enforces timeouts and prints each check's time and outcome class. The same shape is
the consumer pattern (152): a project authors its own `gates.json`; grey-matter ships the runner
pattern and guidance, **never a hook**.

## Initial admission (from the 2026-11-01 timings)

| Check | Stage | Measured |
|---|---|---|
| plugin manifest (`check-plugin-manifest.mjs`) | pre-push | 1.6 to 2.4 s |
| YAML syntax and core types (`check-skill-syntax.mjs`) | pre-push | 0.2 to 1.0 s |
| invocation sidecars and skill indexes (`check-invocation-policy.mjs`) | pre-push | 0.1 s |
| skill and doc links (`check-docs-consistency.mjs`) | pre-push, scoped to `skills/`, `global/` | 0.2 s |
| ticket graph (`tkt validate`) | pre-merge | 0.1 s |
| relocate, guidance, uninstall, survey, shell probe, dashboard, review receipt, critic probe, spike fixture tests | pre-merge, each scoped to its own sources | 0.1 to 3.9 s each |
| footprint tests | pre-merge after 138/151 are fixed | red on Windows today |
| deployer tests | pre-release until 137 slims them | 90.8 s |
| release tests | pre-release | 116.2 s; test 31 flaky on Windows (135) |
| platform workflow (Windows, Linux), real Claude/Codex/agy installs | pre-release | manual dispatch |

## Rebuild sequence

0. **Remove** (done): the Claude plugin push hook, the Git pre-push and pre-commit hooks, their
   installer and tests. `check-repo.mjs` stays as an on-demand command so `release-product.mjs`
   keeps working until step 3.
1. **Pre-push**: `gates.json`, `gate.mjs`, the four pre-push checks, and one Git pre-push hook that
   passes Git's pushed refs to `gate.mjs`. Tests: a docs-only push runs zero checks; a seeded broken
   manifest blocks; a hung check times out.
2. **Pre-merge**: fix 138/151, 135 and 134, then admit the pre-merge tests one at a time. `tkt-work`
   and `implement` cite `gate.mjs pre-merge` output as close evidence.
3. **Pre-release**: move the remaining groups and the platform workflow under `gate.mjs pre-release`;
   `release-product.mjs` calls it; slim deployer and release tests (137). Retire `check-repo.mjs`.
4. **Guidance**: rewrite `local-gates.md` as the three-stage reference; `init-project`,
   `conformance-audit` and `retro` point at it; ship the consumer `gates.json` pattern (152).

## Ticket disposition

- **153** (plugin push hook): items 1 to 6 are moot once no hook ships; item 7 is 151. Keep only
  "the Git pre-push hook judges the pushed refs" as part of step 1, then close.
- **152** (consumer commit gates): becomes step 4.
- **138 and 151** (footprint test fails or hangs): one root cause area; merge into 151, prerequisite of step 2.
- **137** (slow deployer and release tests): pre-release slimming, step 3.
- **134, 135**: pre-merge admission blockers, step 2.

## Open decisions

1. Pre-merge trigger on trunk: before `tkt close` (proposed), or before every push of a finished ticket?
2. Pre-push hook: opt-in per clone (proposed), or installed by `deploy.mjs` for maintainers?
3. Consumers: guidance and runner pattern only, no shipped hook (proposed)?

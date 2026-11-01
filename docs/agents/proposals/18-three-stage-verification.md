# Proposal 18: three-stage verification, local first, rebuilt from zero

**Status:** accepted 2026-11-01 ([decisions](#decisions)); revised the same day from three research
notes. Step 0 (remove the old gate) is done (commit 545a80f).
**Supersedes:** the layout in [local gates](../local-gates.md) and the `check-repo.mjs` modes.
**Absorbs:** tickets 137, 138, 151, 152, 153 ([disposition](#ticket-disposition)).
**Terms:** **Git hook**, **agent hook**, **test lifecycle hook**, **stage** and **speed / stability
phase** as ruled in the
[glossary](../../../GLOSSARY.md#verification-terms). Bare "hook" is not used.
**Research:** [staged verification](../research/staged-verification-prior-art-20261101.md),
[local-first verification](../research/local-first-verification-20261101.md),
[check selection and agent enforcement](../research/check-selection-and-agent-enforcement-20261101.md);
earlier: [test tiers and cadence](../research/test-tiers-and-cadence-20261031.md),
[agent test tiering](../research/agent-test-tiering-prior-art-20261031.md),
[test-environment ladder](../test-environment-ladder.md).

## Why start over

The old gate grew by accretion: one aggregator (`check-repo.mjs`) behind a Git pre-commit hook, a
Git pre-push hook and a Claude Code `PreToolUse` agent hook shipped in the plugin. Observed:

- 15m12s for one full run here, a modal Recycle Bin dialog that hung it, and 3 red groups on
  Windows (2026-11-01). One push could run it three times.
- The plugin agent hook fired in **every** project with grey-matter enabled, matched `git stash
  push` and ticket titles, and checked the wrong repository for `git -C` (153). Claude's own docs
  call the `if` command filter "best-effort" and say to use permissions, not an agent hook, for a
  hard rule (check-selection §4).
- Consumers copied the shape: a 6 to 8 minute Git pre-commit hook on every commit (152); a push
  hung 524 s in our footprint test (151).
- A per-test timeout did not bound it: `node:test` reports a 500 ms-timeout test that blocks 3 s in
  `spawnSync` as **ok** (reproduced here, 3074 ms). Only a runner that owns the timeout and kills
  the process tree bounds a check.

## Principles

1. **Local first.** Every stage runs on the owner's machine through one project command. Hosted CI
   runs only when the user explicitly asks, or for a need no local machine meets: an OS the owner
   has no machine for, a clean-machine check before release, contributors outside the trusted
   circle, or signed provenance (SLSA Build L2). Prefer manual dispatch. Rails 8.1 ships local CI
   (`bin/ci`) as the default for small-to-mid apps; DHH scopes it away from Shopify-size codebases
   (prior art). Do not use act or Earthly as a stand-in: act is Linux-container-only and
   incomplete, Earthly is unmaintained (local-first §2).
2. **Small until the owner chooses stability.** Test what is cheap to break and costly to miss;
   grow when the owner trades speed for release stability. No primary source states "keep tests
   small until a release"; this is grey-matter's rule,
   built on Beck ("test as little as possible to reach a given level of confidence") and
   Dodds ("not too many, mostly integration"). Fowler disagrees for non-trivial code; we resolve it
   by testing what survives exploration, not what is explored (local-first §3).
3. **The stage is when; the enforcer is separate.** A Git hook, an agent hook, the agent's own
   discipline or a release receipt can enforce a stage. The check list and runner are the same.
4. **Bounded or out.** A check that can hang, prompt or flake does not run in any stage until fixed.

## Project phase: speed or stability

Every project starts in the **speed phase**. It moves to the **stability phase** only when the owner
declares it, by a line in the project's `AGENTS.md` (`Verification phase: stability`), because the
owner chooses to trade iteration speed for release stability. Tags, store builds and early
releases do not switch it: a tagged release can still be pre-production. Agents read the
declaration; they never infer it, and they may suggest it (for example when a project gains
persisted user data or outside users) but leave the choice to the owner. `init-project` writes the
line as `speed`; `conformance-audit` reports a missing line.

| | Speed phase (default) | Stability phase (owner-declared) |
|---|---|---|
| Entry point | one `check` command (npm script, `just`, `mise`, `make`, `bin/ci`) | the same command, now with `--stage` |
| Contents | tier 0 (format, lint, typecheck, data-file parse); unit tests only where the author or agent has actually been wrong or the logic is tangled; one headless smoke that boots the app or steps the game loop | adds: a regression test for every shipped bug fix at the lowest tier that reproduces it (Google's Beyoncé Rule); migration tests over previous save versions; the pre-release stage |
| Always, from day one | a round-trip test for anything persisted: save files, schemas, wire formats | same |
| Not yet | prototype code (promote to tested code when it survives), coverage targets, a device matrix, any Git hook or agent hook, hosted CI | hosted CI still only by explicit request or the four needs above |
| Budget | `check` under 60 s warm | pre-push 30 s, pre-merge 5 min, pre-release unbounded |
| Stages in use | pre-merge only: the agent runs `check` before pushing finished work | all three |
| Switch back | n/a | the owner may return to speed, for example during a rewrite |

The 60 s figure is grey-matter's, from the ladder's "about a minute" inner loop, not an external
standard.

## The three stages (stability phase)

| | Pre-push (most critical) | Pre-merge (important) | Pre-release (end to end) |
|---|---|---|---|
| **Question** | Would this push break someone who pulls or installs right now? | Does this change work before it joins the trunk? | Does the release artifact work where users run it? |
| **Runs** | tier 0 static invariants on consumer-facing files | tiers 0 to 2 for changed areas; tier 3 critical flows and a tier 4 simulator smoke **only when** their scope changed; agent review when risk warrants | everything, on the **release artifact** (signed APK/AAB, archived IPA, packaged game build), every OS, real harness installs, simulator matrix, live devices, platform checklists |
| **Range** | the commits being pushed: every stdin line of the Git pre-push hook | merge-base with `origin/main` to `HEAD`; never the working tree | all |
| **Budget** | 30 s total, 10 s per check; 0 s when no scoped path changed | 5 min total, 2 min per check | none; once per release |
| **Enforced by** | an opt-in Git pre-push hook per clone | the agent, before the push that lands a ticket's code, citing the output at `tkt close`; optionally a project `Stop` agent hook | the `release` skill, as receipts |
| **Excludes** | test suites, temp repos, network, harness or tool spawns, anything that can prompt | full suite by default | silent skips: a check not run is "not run", never a pass |

**Pre-merge on trunk.** With no pull requests, the push that lands work *is* the merge;
trunkbaseddevelopment.com: "Locally, before the commit/push is the gate" (staged §3). Closing a
ticket auto-pushes after the code is already on `main`, so pre-merge runs **before the push that
carries a ticket's code**, not at close. Pushes of tickets and docs match no pre-merge scope and
run nothing. Worktree branches run it before merging (`implement-spec`).

**Pre-commit is not a stage.** The trunk-based source says "Locally, before the commit/push is the
gate": the gate guards integration, and on trunk a commit integrates only when pushed. A commit is
a local, rewritable save point; every failure a pre-commit check could stop (a secret, a large
file, a broken manifest) is still stoppable at pre-push, which judges the commits actually leaving.
A Git pre-commit hook fires on every `tkt new`, `claim` and `close` and every agent commit (152's
6 to 8 minute case), and it judges the staged index, which can hold another session's work (153
item 6). A project may keep a Git pre-commit hook only as formatter-style tooling: it fixes staged
files in about a second, never blocks, and sits outside `gates.json`, the stages and their budgets.

**Pre-push reads Git's refs exactly.** The Git pre-push hook gets one stdin line per pushed ref.
Skip deletions (all-zeroes local object); for a new ref (all-zeroes remote object) use
`git rev-list <local> --not --remotes=<remote>`; union paths across all lines. pre-commit only
reads the first line and lefthook hangs without `use_stdin: true` (prior art to avoid; staged §2).

**Pre-release on devices.** Seed game and mobile receipts from platform checklists: Apple 2.1
on-device testing with the backend on; Play internal track and pre-launch report; Steam Deck
criteria (input, glyphs, text entry, 30 fps at 800p); Xbox XR-001's fresh-profile and offline
passes. A store report that does not arrive (Play's is "subject to capacity") is "not run", never a
pass and never a blocker by itself (staged §4).

## Admission and demotion

A check enters a stage only with all of:

1. **Catches** one named failure, observed, and often enough to earn its time. A check with no
   catch over three releases moves one stage later (Chromium drops configs that "only fail once
   every couple of weeks").
2. **Scope**: repo-relative POSIX path prefixes or globs, no regex. Out of scope, it does not run.
3. **Measured** time on this host with date, inside the stage budget. Over budget moves it later;
   budgets are never raised.
4. **Bounded by the runner**: a per-check timeout the runner enforces by killing the process tree
   (`taskkill /T /F` on Windows, process group on POSIX), stdin closed, `CI=true`,
   `GIT_TERMINAL_PROMPT=0`, a fresh temp dir. Killed is `timeout`; spawn failure or a missing tool
   is `infrastructure error`; neither is ever `pass` (Bazel). `node --test` also gets
   `--test-timeout` as a second line, not the bound.
5. **Cannot prompt**: no stdin reads, no OS trash or shell file APIs; test-made temp dirs go with
   `rmSync(..., { recursive: true, force: true })`.
6. **Green on every supported host**, or skipped there with a stated reason. A flaky check is
   quarantined with a ticket naming the stage it returns to; never retry-to-green.

## One manifest, one runner

`scripts/gates.json` declares checks; `node scripts/gate.mjs <pre-push|pre-merge|pre-release>`
runs them.

```json
{ "full_triggers": ["package.json", "package-lock.json", "scripts/gates.json", "scripts/gate.mjs"],
  "checks": [
  { "id": "plugin-manifest", "stage": "pre-push", "catches": "plugin install fails for consumers",
    "scope": [".claude-plugin/", ".codex-plugin/", "skill-packs.json"],
    "run": ["node", "scripts/check-plugin-manifest.mjs"], "timeout_s": 10,
    "measured": { "s": 1.6, "date": "2026-11-01", "host": "win" } }
] }
```

- `always: true` runs a check whatever changed; a `full_triggers` path selects every check in the
  stage. Unknown history selects more, never less.
- `SKIP=<id,...>` skips named checks and prints them as `skipped (SKIP)`; `git push --no-verify`
  stays the whole-Git-hook escape hatch (pre-commit prior art).
- `--include <id>` or `--stage pre-release` runs a later stage's checks early for a risky change
  (Chromium's opt-in CQ prior art).
- Output: each check's time and outcome class, and a warning when time exceeds `measured`.

`catches` and `measured` have no precedent in the manifests read (pre-commit, lefthook,
`config/ci.rb`, Nx, Turbo, Bazel); they carry the admission evidence.

## What grey-matter ships to consumers

Guidance, the `gates.json` schema and a reference `gate.mjs`. **No agent hook in the plugin**, and
no `PreToolUse` command matching for gating anywhere. A consumer that wants enforcement adds its
own, calling its own `gate.mjs`: a Git pre-push hook via `core.hooksPath`, and optionally a project
`Stop` agent hook in `.claude/settings.json` or `.codex/hooks.json` for pre-merge. Claude's
components page recommends plugin agent hooks for rules that must always hold; that fits rules the
plugin owns, not each project's checks (check-selection §6).

**Projects vendor; nothing installs.** grey-matter keeps the reference files: `gate.mjs` with a
version line at the top, the `gates.json` schema and a sample `.githooks/pre-push` (a few lines
calling `node scripts/gate.mjs pre-push`). A project commits its own copies and its own
`gates.json`, so its checks change only when it commits a change. A clone opts in with Git's own
`git config core.hooksPath .githooks`; there is no installer script. Two alternatives are rejected:

- **An installer** (the removed `install-hooks.mjs`) existed to preserve foreign Git hooks, honour
  `core.hooksPath` and handle worktrees, and needed its own test group; Git's setting does the job.
- **Calling grey-matter's installed copy in place** binds the project to one machine's install path
  and plugin version, breaks for collaborators, and changes behaviour silently on a plugin update
  (153's contract drift).

`core.hooksPath` replaces the clone's whole Git hook directory, so a project already using
lefthook, husky or pre-commit adds a pre-push job to that manager instead (lefthook needs
`use_stdin: true`). Drift is reported, never auto-applied: `conformance-audit` and `sync` compare
the vendored `gate.mjs` version line with the reference and offer the update. tkt's vendored
`tools/deploy.mjs` is the precedent in this repo.

## Initial admission for grey-matter (from the 2026-11-01 timings)

| Check | Stage | Measured |
|---|---|---|
| plugin manifest (`check-plugin-manifest.mjs`) | pre-push | 1.5 to 2.4 s |
| YAML syntax and core types (`check-skill-syntax.mjs`) | pre-push | 0.1 to 1.0 s |
| invocation sidecars and skill indexes (`check-invocation-policy.mjs`) | pre-push | 0.1 s |
| skill and doc links (`check-docs-consistency.mjs`), scoped to `skills/`, `global/` | pre-push | 0.1 to 0.2 s |
| ticket graph (`tkt validate`) | pre-merge | 0.1 to 0.5 s |
| relocate, guidance, uninstall, survey, shell probe, dashboard, review receipt, critic probe, spike fixture tests | pre-merge, each scoped to its sources | 0.1 to 3.9 s each |
| footprint tests | pre-merge after 151 is fixed | red or hung on Windows today |
| deployer tests | pre-release until 137 slims them | 90.8 s |
| release tests | pre-release | 116.2 s; test 31 flaky on Windows (135) |
| platform workflow (Windows, Linux), real Claude/Codex/agy installs | pre-release | manual dispatch |

## Rebuild sequence

0. **Remove** (done): the plugin agent hook, the Git pre-push and pre-commit hooks, the installer
   and their tests. `check-repo.mjs` stays on demand so `release-product.mjs` works until step 3.
1. **Runner and pre-push**: grey-matter's `AGENTS.md` declares `Verification phase: stability`
   (this proposal builds all three stages for it; the owner can revert); `gates.json`, `gate.mjs` (timeouts, process-tree kill, outcome
   classes, SKIP, stdin refs), the four pre-push checks, the reference `.githooks/pre-push`, opt-in by `core.hooksPath`. Tests: a
   docs-only push runs nothing; a two-ref and a new-branch push select correctly; a seeded broken
   manifest blocks; a hung and a `spawnSync`-blocked check both end as `timeout`.
2. **Pre-merge**: fix 151, 135 and 134; admit tests one at a time. `tkt-work` and `implement` run
   `gate.mjs pre-merge` before pushing a ticket's code and cite it at close.
3. **Pre-release**: move the slow groups and platform workflow under `gate.mjs pre-release`;
   `release-product.mjs` calls it; slim deployer and release tests (137); retire `check-repo.mjs`.
4. **Guidance**: rewrite `local-gates.md` around project phase and the three stages; `init-project`
   scaffolds the `check` command and the `Verification phase: speed` line; once the owner declares
   stability, `init-project` or `adopt-project` vendors `gate.mjs` and `.githooks/pre-push`, writes
   `gates.json` and, on the owner's opt-in, runs `git config core.hooksPath .githooks`;
   `conformance-audit` reports a vendored `gate.mjs` behind the reference version, and flags unbounded Git hooks, plugin agent hooks used as gates, hosted CI on every push, and
   unbounded scratch; `retro` points at it; lefthook consumers get the `use_stdin` note (152).

## Ticket disposition

- **153** (plugin agent hook): items 1 to 6 are moot with no agent hook shipped; item 7 is 151.
  Keep "the Git pre-push hook judges the pushed refs" in step 1, then close.
- **152** (consumer gates): step 4.
- **151** (footprint test hang) absorbs **138** (same file, Windows failures): prerequisite of step 2.
- **137** (slow deployer and release tests): step 3.
- **134, 135**: pre-merge admission blockers, step 2.

## Decisions

Recorded 2026-11-01 from the owner's answers.

1. **Pre-merge runs before the push that carries a ticket's code**, cited at `tkt close`; not at
   close, which is after the code reaches `main`.
2. **The Git pre-push hook is opt-in per clone**, by `git config core.hooksPath .githooks`;
   `deploy.mjs` never installs it.
3. **Consumers get guidance plus the runner pattern**; the plugin ships no agent hook.
4. **The owner declares the phase.** Tags and releases can still be pre-production; switching from
   speed to stability is the owner's choice, never inferred.
5. **Pre-commit is not a stage** (see above); a Git pre-commit hook is allowed only as non-blocking
   formatter tooling.
6. **Projects vendor the runner and Git hook; no installer script.** Each project commits its own
   `gate.mjs`, `gates.json` and `.githooks/pre-push`, and drift from the reference is reported,
   not applied ([above](#what-grey-matter-ships-to-consumers)).

## Deferred

- **Scaling**: if several agents push to `main` at once, add a serialization point (commit queue)
  rather than a heavier pre-push (Google, TBD prior art). Not needed now.

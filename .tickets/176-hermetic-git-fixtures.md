---
id: "176"
title: "Test fixtures isolate Git from the user's global config (signing, hooks, editor)"
status: in_progress
blocked_by: []
validation_criteria:
  - "Repository-creating test suites isolate global/system Git config and use a test-owned identity."
  - "A hostile forced-signing config with an unreachable key fails the control but leaves isolated fixtures able to commit and annotate tags without prompting."
  - "node scripts/gate.mjs pre-release passes with the hostile config supplied to the parent process."
tags: ["stream:tooling"]
---
# Test fixtures isolate Git from the user's global config (signing, hooks, editor)

## Intent source

Found during proposal 18 step 3 (2026-11-01). Diagnosing hanging release tests, the hung
`git tag -a` in a release-git fixture led to the user's `~/.gitconfig`: `commit.gpgsign=true`,
`tag.gpgsign=true`, `tag.forceSignAnnotated=true`, `gpg.format=ssh` with a real signing key, and
`core.editor=true`. The fixtures set `commit.gpgsign false` and sometimes `tag.gpgsign false`, but
not `tag.forceSignAnnotated`, so their annotated tags are signed with the user's real SSH key.

## Context

Not proven to cause today's hangs: a signed tag from Node took 735 ms and passed; the hangs
matched host load instead (ticket 137, 122). It is still a hermeticity gap: a fixture's outcome
depends on the host's Git config and agent, and a locked key would prompt, which the admission
rules in `docs/agents/local-gates.md` forbid ("Cannot prompt"). Prior art in this repo:
`release-cargo-*.integration.mjs` already run Git with `GIT_CONFIG_GLOBAL=/dev/null` and
`GIT_CONFIG_NOSYSTEM=1`. Fixtures that create repos: `release-git`, `release-verify`,
`release-development`, `release-product`, `release-artifacts`, `deploy`, `gate`, `relocate-knowledge`,
`survey-repos`, `inspect-footprint`, `repository-artifact-hygiene` tests (grep `"init"`).

## Acceptance criteria

- [ ] Every test file that creates a Git repository runs Git with the global and system config
      isolated (or explicitly overrides signing, hooks and editor), and sets its own identity.
- [ ] A seeded `tag.forceSignAnnotated=true` with an unreachable signing key in a temporary global
      config leaves every such test passing, not hanging.
- [ ] `node scripts/gate.mjs pre-release` passes.

## Progress 2026-11-02 — implementation present, verification incomplete

The 14 directly repository-creating suites and the indirect orchestration fixture suite import a
shared test environment. It replaces global Git config with a test-owned file containing an explicit
Fixture identity and line-ending defaults, disables system config, and keeps fixture LFS smudging off.
Existing Cargo/Python integration fixtures already isolate their Git configuration.

The hostile-config regression proves the signing control fails, then the isolated process can commit,
annotate a tag, resolve the Fixture identity, and find no inherited hooks/editor settings. Focused
regression passes. Standards/spec reviews found no remaining issues. A separate Windows regression
proves temp cleanup errors are reported as infrastructure failures with the original check output.

The required full pre-release stage has not passed. Latest pre-merge selects all 19 checks: 17 pass,
gate-runner and artifact-hygiene hit their 120-second bounds as host free RAM falls to about 0.6 GiB.
No verification limit was raised and no SKIP was used. Optimization work continues on #137; both
tickets remain in progress until required verification can complete.

See [structured verification evidence](../docs/agents/research/evidence/test-optimization-20261102.json)
for the commands, outcomes, timings and scope limits. Temporary profiles and failed fixtures remain
scoped to #137/#176 while diagnosis and cleanup are outstanding.

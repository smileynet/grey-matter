---
id: "176"
title: "Test fixtures isolate Git from the user's global config (signing, hooks, editor)"
status: open
blocked_by: []
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
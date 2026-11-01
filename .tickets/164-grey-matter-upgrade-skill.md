---
id: "164"
title: "grey-matter-upgrade skill: bring a project up to a new grey-matter release's standards"
status: open
blocked_by: []
tags: ["stream:tooling"]
---

# grey-matter-upgrade skill: bring a project up to a new grey-matter release's standards

## Intent source

Owner request, 2026-11-01: "consider a grey-matter-upgrade skill that can be run in projects when a
new version of grey-matter is released, to make sure the project is compliant with current
standards such as the gate one just introduced."

## Why

A grey-matter release can change what a compliant project looks like, not only what the skills
say. Proposal 18 is the first large case: the plugin agent hook is gone, projects declare
`Verification phase: speed|stability`, and stability projects vendor `gate.mjs`,
`.githooks/pre-push` and `gates.json`. A project adopted before that release still carries the old
shape (a full-suite Git pre-commit hook, a `check-repo.mjs` the removed agent hook called) until
someone migrates it.

## Consider first: overlap

- `conformance-audit` already audits a repo against current standards and applies only the
  mechanically safe fixes behind an approval gate ("re-conform an adopted repo as guidance
  evolves").
- `sync` re-synchronizes grey-matter itself, not a consumer project.
- `adopt-project` is first-time adoption.

Decide whether upgrade is a new skill or a release-aware mode of `conformance-audit`. A new skill
earns its place only if it adds what the audit lacks: knowing the version the project last
conformed to, reading the changelog entries between that and the current version, and running
per-release migration steps (for example, remove the old Git pre-commit hook, add the phase line,
re-vendor `gate.mjs`).

## What to build (if a skill)

- Record the conformed grey-matter version in the project (for example a line in `AGENTS.md`).
- Per release, a migration note in grey-matter (agent-facing, beside `CHANGELOG.md` or in
  `docs/agents/`) listing the mechanical steps and the judgement calls.
- The skill reads the recorded version, applies each intervening release's notes, runs
  `conformance-audit`, reports vendored-file drift (`gate.mjs` version line) and updates the
  recorded version. Judgement calls are surfaced, never auto-applied; one reviewable commit.

## Acceptance criteria

- [ ] The overlap decision (new skill vs. `conformance-audit` mode) is recorded with reasons.
- [ ] A project adopted before proposal 18 can be brought to the post-18 shape by running it, shown on one real consumer repo (philippines-trip or tagalog-helper), with the diff as evidence.
- [ ] Running it twice in a row makes no further change.
- [ ] Mechanical steps apply only behind the approval gate; judgement calls are reported.
- [ ] `node scripts/check-repo.mjs --static` passes.

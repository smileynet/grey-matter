---
id: "164"
title: "Upgrade path: bring a project up to a new grey-matter release's standards (conformance-audit mode recommended)"
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

## Recommended direction (2026-11-01, owner asked to weigh merge vs. separate)

Extend `conformance-audit` with a release-aware upgrade mode rather than adding a skill:

- Upgrading is conformance with a starting version. The audit already has the audit, approval gate,
  safe-tier fix, judgement report and one-commit landing an upgrade needs; a second skill would copy
  them.
- One source of "current standard". Two skills defining it drift (the audit's own rule-sources
  section warns against "a fourth copy").
- What is new is input: the recorded conformed version, per-release migration notes naming
  retired patterns (the old Git pre-commit hook, the old `check-repo.mjs` contract), and vendored
  `gate.mjs` drift. These become rule sources for the audit.
- No new skill means no bucket README, `compass` or roster churn; the audit's description gains an
  "after a grey-matter upgrade" trigger.
- Split only if upgrading had to change how grey-matter is installed in the project, which is
  `sync` and `deploy`'s job.

## What to build

- Record the conformed grey-matter version in the project (for example a line in `AGENTS.md`).
- Per release, a migration note in grey-matter (agent-facing, beside `CHANGELOG.md` or in
  `docs/agents/`) listing the mechanical steps and the judgement calls.
- The skill reads the recorded version, applies each intervening release's notes, runs
  `conformance-audit`, reports vendored-file drift (`gate.mjs` version line) and updates the
  recorded version. Judgement calls are surfaced, never auto-applied; one reviewable commit.

## Acceptance criteria

- [ ] The overlap decision is confirmed by the owner (recommended: a `conformance-audit` upgrade mode) and recorded with reasons.
- [ ] A project adopted before proposal 18 can be brought to the post-18 shape by running it, shown on one real consumer repo (philippines-trip or tagalog-helper), with the diff as evidence.
- [ ] Running it twice in a row makes no further change.
- [ ] Mechanical steps apply only behind the approval gate; judgement calls are reported.
- [ ] `node scripts/gate.mjs pre-push` passes.

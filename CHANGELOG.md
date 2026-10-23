# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
aims to follow Semantic Versioning (pre-1.0: breaking changes bump the minor).

## [Unreleased]

### Added
- Claude Code plugin: install with `/plugin marketplace add smileynet/grey-matter`, then `/plugin install grey-matter@grey-matter`. It brings in tkt's workflow skills as a dependency. Skills are namespaced (`/grey-matter:code-review`), so they no longer shadow Claude's bundled `/code-review`.
- Antigravity (`agy`) global deployment via a plugin package: `scripts/build-agy-plugin.mjs` assembles the skills into an `agy` plugin (`plugin.json` + flattened `skills/`), validates it with `agy plugin validate --strict`, and installs it with `agy plugin install`. On the probed agy, skill discovery is plugin-driven (not a bare-directory scan), so this is how the skills reach agy globally.
- `sync` skill: the inbound twin of `release` — pull the repo current and re-synchronize the coupled pieces (deployed skills, the tkt command surface, ticket IDs, repo invariants), then redeploy the skills to every harness. Orchestrates `verify-tkt-usage`, `check-repo.mjs`, and the installer; reports findings rather than gating the deploy.
- Release tooling: a `release` command that updates the changelog and README, picks the version, then tags, pushes, and publishes a GitHub release, composing the new `changelog` and `readme` skills.
- `cheat-sheet` skill: a styled, live-generated reference card of every skill by category.
- `adopt-project` relocates a dot-prefixed knowledge folder such as `.memory/` into grey-matter paths with a bundled script that keeps every link resolving and leaves recorded evidence untouched. It now also sets up Git LFS, untracks sensitive files, completes the `.references/` clone index, and reshapes AGENTS.md around who actually reads it.
- `adopt-project` portfolio mode: survey every sibling repo, rank them by freshness, and adopt the freshest first or all of them in batches, each with its own approval gate.
- `adopt-project` files audit findings as review-first migration findings, so the project's own agent confirms or rejects each one before acting on it.

- User-level standing rules: one short `global/AGENTS.md` (verify before claiming done, keep code minimal, trust observation over docs), installed into kiro-cli, Codex, Claude Code, and OpenCode with `scripts/install-agents-md.mjs`. It replaces always-on steering, stays under a 3 KB budget, and never overwrites a file it didn't install.
- `line-craft` skill: write fiction prose and dialogue so feeling is carried by acts and errands. It includes a revision pass and a self-testing catalog of sentimental shapes, which grows from lines the author rejects, plus a standalone checker. The moves come from a study of LucasArts adventure dialogue.

### Changed
- `release` also sets the version in `.claude-plugin/plugin.json` when a repo has one, so installed plugins pick up the new release.
- `adopt-project` treats skills a repo ships to its users as product: it audits them but no longer restructures them. `conformance-audit` reports grey-matter's own layout rules as not applicable on such repos.

### Fixed
- `release` works on macOS: its changelog edits no longer rely on GNU-only `sed` syntax.

## [0.1.0] - 2026-10-19

### Added
- 33 agent skills across three buckets: engineering (build), productivity (think/communicate), and meta (tend the skill set).
- Every active upstream skill from mattpocock/skills reviewed and adapted, with a keep/adapt/drop verdict and a committed review note.
- Game-centric development support: a game/app two-regime split across modeling, architecture, review, and prototyping, so games are built as games, not web apps.
- A cross-client installer that deploys skills into every known agent harness on the machine (kiro-cli, Codex, Claude Code, agy, Crush, OpenCode), idempotently and reversibly.
- Project conventions: tkt as the work tracker, an agent-facing docs layout, report-format and skill-authoring guides, and a router (`compass`) over the whole set.

# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
aims to follow Semantic Versioning (pre-1.0: breaking changes bump the minor).

## [Unreleased]

### Added
- `data-modeling` helps design and review data so invalid states can't be represented, and says when a simpler type is the better choice. `codebase-design` calls it when an interface carries data, and `code-review` uses its review lens when a change touches types or schemas.
- `repository-artifact-hygiene` separates source assets from generated evidence, measures staged Git artifacts read-only, and helps choose storage and recovery without automatic migration or deletion.
- Codex marketplace packaging supplies namespaced skills, with local cache refresh through the same deployer used by the other harnesses.
- `orient` and `wrap-session` connect session pickup and handoff to the current plan and tickets; `conformance-audit` checks adopted repositories against current guidance.
- Claude Code checks the launch project's repository invariants before recognized agent `git push` commands; the Git pre-push gate continues to cover other push paths. Requires Claude 2.1.310+ and Node 22+.
- `delivery-dashboard` keeps one dark, blue status page current after each task: what needs your input first, the latest outcome in your terms, the last five entries at a glance, and every older entry in a searchable history tab. It ships a blank template, a worked example with a walkthrough, and a checker, and labels planned, partial and shipped experiences.
- `spike-options` compares competing designs with throwaway builds, then helps you choose an approach and track its integration.
- Claude Code plugin: add the `smileynet/tkt` and `smileynet/grey-matter` marketplaces, then `/plugin install grey-matter@grey-matter`. It brings in tkt's workflow skills as a dependency. Skills are namespaced (`/grey-matter:code-review`), so they no longer shadow Claude's bundled `/code-review`.
- Antigravity (`agy`) plugins deliver the skills and their referenced resources through the canonical deployer.
- `sync` skill: the inbound twin of `release` — pull the repo current and re-synchronize the coupled pieces (deployed skills, the tkt command surface, ticket IDs, repo invariants), then redeploy the skills to every harness. Orchestrates `verify-tkt-usage`, `check-repo.mjs`, and the installer; reports findings rather than gating the deploy.
- `release` can be started by the agent as well as by `/release`, and first checks for candidates already prepared or staged and how far main has moved past them. Publishing still waits for your explicit request, and now checks that the merge back into main keeps newer changelog entries under Unreleased.
- Release tooling prepares approved local candidates, notes, plugin bundles and checksums without publication. Product and native checks bind evidence to the exact candidate; separately authorized publication uses reviewed artifacts and retries incomplete publication without changing the version.
- `cheat-sheet` skill: a styled, live-generated reference card of every skill by category.
- `adopt-project` relocates a dot-prefixed knowledge folder such as `.memory/` into grey-matter paths with a bundled script that keeps every link resolving and leaves recorded evidence untouched. It now also sets up Git LFS, untracks sensitive files, completes the `.references/` clone index, and reshapes AGENTS.md around who actually reads it.
- `adopt-project` portfolio mode: survey every sibling repo, rank them by freshness, and adopt the freshest first or all of them in batches, each with its own approval gate.
- `adopt-project` files audit findings as review-first migration findings, so the project's own agent confirms or rejects each one before acting on it.
- User-level standing rules: one short `global/AGENTS.md` (verify before claiming done, keep code minimal, trust observation over docs), installed into kiro-cli, Codex, Claude Code, and OpenCode with `scripts/install-agents-md.mjs`. It replaces always-on steering, stays under a 3 KB budget, and never overwrites a file it didn't install.
- `line-craft` skill: write fiction prose and dialogue so feeling is carried by acts and errands. It includes a revision pass and a self-testing catalog of sentimental shapes, which grows from lines the author rejects, plus a standalone checker. The moves come from a study of LucasArts adventure dialogue.

### Changed
- Reports can retain offline usability with versioned local assets or frozen bundles; intentional self-contained HTML remains supported without making every changing dashboard carry embedded evidence.
- One deployer, `scripts/deploy.mjs`, replaces the installer and the agy packager. It picks skill roots so every harness on the machine sees each skill exactly once, counting an installed Claude or Codex plugin. It takes back copies it left elsewhere, and adds `check` and `audit` (unowned dirs, skills a harness sees twice). `install-skills.mjs` and `build-agy-plugin.mjs` still work and forward to it.
- `install-skills.mjs` won't copy skills where Claude Code already loads them from the grey-matter plugin, and it removes copies it put there before, so a skill is never listed twice. `--allow-dual` overrides.
- Release preparation derives every plugin version from the repository's product version. Publication verifies immutable GitHub assets before stable promotion and reports each channel's status and URL, including incomplete outcomes.
- Code reviews compare repository standards and originating requirements, then require findings to be verified before fixes.
- `adopt-project` treats skills a repo ships to its users as product: it audits them but no longer restructures them. `conformance-audit` reports grey-matter's own layout rules as not applicable on such repos.

### Fixed
- Local Claude plugin audits use the active checkout rather than stale cache folders. Failed or foreign source checks preserve existing skill copies during deployment.
- Plugin bundles retain referenced scripts/resources and required license notices when extracted away from the source checkout.

## [0.1.0] - 2026-10-19

### Added
- 33 agent skills across three buckets: engineering (build), productivity (think/communicate), and meta (tend the skill set).
- Every active upstream skill from mattpocock/skills reviewed and adapted, with a keep/adapt/drop verdict and a committed review note.
- Game-centric development support: a game/app two-regime split across modeling, architecture, review, and prototyping, so games are built as games, not web apps.
- A cross-client installer that deploys skills into every known agent harness on the machine (kiro-cli, Codex, Claude Code, agy, Crush, OpenCode), idempotently and reversibly.
- Project conventions: tkt as the work tracker, an agent-facing docs layout, report-format and skill-authoring guides, and a router (`compass`) over the whole set.

---
id: "211"
title: "Ship only what skills need in the Kiro Crew app and agy plugin (65 MB today)"
status: open
blocked_by: []
tags: ["stream:tooling"]
priority: medium
---
# Ship only what skills need in the Kiro Crew app and agy plugin

## Why

`deploy.mjs` packages each skill plus every file its Markdown links reach, transitively
(`agyResources`). On 2026-11-03 the Kiro Crew app at `dist/kirocrew-app` was 65 MB:

| Part | Size | Files |
|---|---|---|
| `docs/agents/research/evidence/` | 60 MB | 464 |
| rest of `docs/` | ~2 MB | ~190 |
| `skills/` | 1.6 MB | 218 |
| `scripts/` | 460 KB | 34 |
| `.tickets/` | 180 KB | 25 |

Skill references link to research docs, which link to evidence, tickets and `docs/plan.md`.
So the package ships repo history, and every ticket or plan edit changes it. The app
content check then asks for a reinstall the user must run by hand (the gateway refuses
agents). The agy plugin uses the same resource walk and has the same problem.

## What to build

1. Stop the walk at the boundary of what a skill needs at run time: the skill's own folder,
   declared `runtimeFiles`, legal files, and docs a skill links to directly.
2. Links from packaged files to anything outside that set (`.tickets/`, `docs/plan.md`,
   `docs/agents/research/**`, `docs/*.html`) are rewritten to GitHub URLs pinned to the
   pack's repository and version tag (or `main` before the first release), not copied.
3. Same rule for the Kiro Crew app, the agy plugin and copy-mode `.resources-<pack>`, so one
   change covers all three.
4. `deploy.mjs check` reports the package size and file count, and fails over a budget
   (start at 5 MB) so growth is visible.

## Acceptance

- `dist/kirocrew-app` is under 5 MB and contains no `.tickets/` or `research/evidence/`.
- A ticket edit or a new evidence file leaves `sameAppContent` true (no reinstall).
- Every link in a packaged Markdown file resolves: either to a packaged file or to a
  GitHub URL; existing deploy tests for linked resources still pass or are updated.
- `node scripts/gate.mjs pre-release` passes; tkt's vendored deployer is resynced.

## Owns

`scripts/deploy.mjs`, `scripts/deploy.test.mjs`, `docs/agents/distribution-maintenance.md`,
`CHANGELOG.md`; tkt `tools/deploy.mjs` via `sync-release-tools.mjs`.

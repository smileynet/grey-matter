# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
aims to follow Semantic Versioning (pre-1.0: breaking changes bump the minor).

## [Unreleased]

### Added
- Release tooling: a `release` command that updates the changelog and README, picks the version, then tags, pushes, and publishes a GitHub release, composing the new `changelog` and `readme` skills.
- `cheat-sheet` skill: a styled, live-generated reference card of every skill by category.

## [0.1.0] - 2026-10-19

### Added
- 33 agent skills across three buckets: engineering (build), productivity (think/communicate), and meta (tend the skill set).
- Every active upstream skill from mattpocock/skills reviewed and adapted, with a keep/adapt/drop verdict and a committed review note.
- Game-centric development support: a game/app two-regime split across modeling, architecture, review, and prototyping, so games are built as games, not web apps.
- A cross-client installer that deploys skills into every known agent harness on the machine (kiro-cli, Codex, Claude Code, agy, Crush, OpenCode), idempotently and reversibly.
- Project conventions: tkt as the work tracker, an agent-facing docs layout, report-format and skill-authoring guides, and a router (`compass`) over the whole set.

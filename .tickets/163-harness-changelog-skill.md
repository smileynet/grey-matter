---
id: "163"
title: "Skill: harness-changelog, review new harness versions against a hashed baseline"
status: in_progress
blocked_by: []
tags: ["stream:tooling"]
---

# Skill: harness-changelog, review new harness versions against a hashed baseline

## What to build

A `meta` skill, `harness-changelog`, that checks every installed harness for a new version, reviews what changed, and proposes what grey-matter should adapt.

- **Baseline.** A committed manifest (for example `docs/agents/harness-surfaces/versions.json`) records, per harness and surface: version, how it was read, the help hash defined in [harness surfaces](../docs/agents/harness-surfaces/README.md#version-stamp), and the date. The per-harness surface files carry the same stamp.
- **Detect.** A script reads each installed version and recomputes the help hashes (recursively over subcommands, so a changed flag anywhere shows), then reports which harnesses moved. It needs no network. Kiro Crew self-updated mid-session and kiro-cli moved 2.34 → 2.37 unnoticed during tickets 126-128, so silent upgrades are the normal case.
- **Fetch.** For each moved harness, read the changelog between the old and new versions from the harness's own source: the bundled `CHANGELOG.md` for Kiro Crew, `agy changelog`, the official changelog pages, or GitHub releases.
- **Review.** Classify each change: new capability, changed flag or default, removal or deprecation, or security-relevant. Map each one to the grey-matter files it affects (`docs/agents/harnesses.md`, the harness-surfaces files, the orchestration primitives note, skill references) and propose updates or tickets. It never applies them silently.
- **Update.** After review, refresh the surface file's CLI reference and the manifest, so the next run diffs against the reviewed state.

Open design questions: one manifest or per-file stamps only; whether to hash per-subcommand help as well as the top level; how to treat GUI apps with no `--help`; and the cadence (on demand only, or a reminder in `tkt-orient`).

## Acceptance criteria

- [ ] SKILL.md under `skills/meta/harness-changelog/` follows [skill frontmatter](../docs/agents/skill-frontmatter.md) and passes `node --test scripts/skill-syntax.test.mjs`.
- [ ] The detect script reports no change on an unchanged machine, and names the harness and the changed subcommand after a version change (test with a fixture of two help outputs).
- [ ] One real review run recorded against the current baseline, with the proposals it produced.
- [ ] `node scripts/check-repo.mjs --affected` exits 0.

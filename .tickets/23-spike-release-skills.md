---
id: "23"
title: "Spike: validate the release-process skills (changelog, readme, release)"
status: backlog
blocked_by: []
priority: low
validation_criteria:
  - "changelog judgment checked against a gold hand-written changelog for a real history range: entries user-facing not commit-dumps, refactor/test churn dropped, correct Added/Changed/Fixed/Removed bucketing, pulls from both commits and closed tkt tickets, no leaked hashes/ids/em-dashes"
  - "readme drift detection scored against a README with injected defects (broken install command, removed-feature-still-listed, dead link, stale version): which caught vs missed vs false-positive"
  - "release run end-to-end live in a throwaway repo with real git+gh: changelog promoted, [Unreleased] left empty, annotated tag created, GH release notes match the section; safe/idempotent on a dirty tree"
  - "release composition verified: it actually invokes changelog + readme via the Skill tool in kiro-cli and codex, not inlined or skipped"
  - "Primary integration test is dogfooding: cutting the next real release (v0.2.0) via the release skill counts as spikes 1+3"
tags: ["type:research", "stream:tooling"]
---

# Spike: validate the release-process skills (changelog, readme, release)

## What to build

TBD

## Acceptance criteria

- [ ] TBD

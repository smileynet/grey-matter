---
id: "28"
title: "Publish releases without unrelated tags or stranded release state"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "Release publication pushes only the requested tag"
  - "A GitHub-release failure leaves documented recoverable state and no temporary notes file"
  - "Release script succeeds on supported macOS and Linux shell tooling"
tags: ["type:chore", "kind:bug", "stream:tooling"]
---

# Publish releases without unrelated tags or stranded release state

## What to build

Cutting a release must publish only the requested tag, work on supported POSIX shell
platforms, and leave a clear, recoverable state if GitHub release creation fails.

## Context

Found during the 2026-10-19 repository review. `skills/meta/release/references/release.sh`
uses `git push origin HEAD --tags`, so it publishes unrelated local tags before
`gh release create` runs. A failed GitHub call leaves an externally visible tag without a
release and leaves the temporary notes file behind. Its `sed -i` usage is GNU-specific.
Ticket 23 validates the release workflow; this ticket hardens the behavior it will test.

Read first: `skills/meta/release/references/release.sh`, `skills/meta/release/SKILL.md`,
and `.tickets/23-spike-release-skills.md`.

## Out of scope

Do not cut a real release or publish to GitHub while implementing this hardening.

## Acceptance criteria

- [ ] A release run pushes `HEAD` and only the requested tag, never unrelated local tags.
- [ ] A simulated `gh release create` failure leaves no temporary notes file and emits exact recovery instructions.
- [ ] The script has a portable in-place-edit replacement or documented platform constraint verified on macOS and Linux tooling.
- [ ] A throwaway-repository test demonstrates the normal and failure paths without contacting the production remote.

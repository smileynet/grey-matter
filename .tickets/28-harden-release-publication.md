---
id: "28"
title: "Publish releases without unrelated tags or stranded release state"
status: done
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

- [x] A release run pushes `HEAD` and only the requested tag, never unrelated local tags.
- [x] A simulated `gh release create` failure leaves no temporary notes file and emits exact recovery instructions.
- [x] The script has a portable in-place-edit replacement or documented platform constraint verified on macOS and Linux tooling.
- [x] A throwaway-repository test demonstrates the normal and failure paths without contacting the production remote.

## Resolution (2026-10-20)

Hardened skills/meta/release/references/release.sh: (1) push HEAD + only refs/tags/\ instead of 'git push origin HEAD --tags', so unrelated local tags are never published; (2) trap-on-EXIT always removes the temp notes file, and a gh release create failure prints exact recovery steps (retry gh, or delete the tag) and exits nonzero, keeping the pushed tag as the durable artifact; (3) replaced GNU-only 'sed -i' with the portable temp-file+redirect pattern. Added references/release.test.sh (local bare origin + fake gh, never the real remote): 11/11 pass. SKILL.md step 6 + Notes updated. Committed 899a1c3, pushed, redeployed. bash -n clean; the clean-tree gate still fires correctly.

### Verification
1. ✓ Release publication pushes only the requested tag — "Release run pushes only the requested tag: test 'unrelated local tag was NOT pushed' passes while 'release tag v0.2.0 pushed' passes; the script uses 'git push origin refs/tags/\', not '--tags'."
2. ✓ A GitHub-release failure leaves documented recoverable state and no temporary notes file — "gh failure leaves recoverable state and no temp file: tests 'gh failure makes release exit nonzero', 'failure path prints a recovery message', 'recovery message includes tag-undo instructions', 'tag v0.3.0 pushed despite gh failure', and 'temp notes file cleaned up on failure (trap EXIT)' all pass."
3. ✓ Release script succeeds on supported macOS and Linux shell tooling — "Portable across macOS/Linux tooling: no 'sed -i' remains (static check passes), replaced by temp-file+mv which behaves identically on BSD/macOS and GNU; bash -n passes. Verified via references/release.test.sh 11/11 in an isolated throwaway repo."

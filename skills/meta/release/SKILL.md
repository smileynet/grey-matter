---
name: release
description: "Cut a tagged release: update the changelog and README, pick the version, then tag, push, and publish a GitHub release. Use when the user wants to ship a release or asks to cut a version."
disable-model-invocation: true
---

# Release

Cut a tagged release. This is the single command that runs the whole flow: it does the
**judgement** (what changed, is the README honest, which version), composing the
`changelog` and `readme` skills, and then runs the **pinned mechanical tail**
([references/release.sh](references/release.sh)) that gates and executes the
tag/push/publish so those exact steps can't be fumbled or skipped.

The judgement pieces are also invokable on their own (`changelog`, `readme`); `release`
is the orchestrator that ties them together with the versioning decision and the
mechanics.

## Steps

1. **Update the changelog.** Call the Skill tool with `changelog` to turn everything
   since the last release (commits + closed tkt tickets) into user-facing `[Unreleased]`
   entries. The release is blocked if `[Unreleased]` ends up empty, there is nothing to
   ship.

2. **Check the README.** Call the Skill tool with `readme` to catch and fix drift before
   it ships (stale install commands, a feature list that no longer matches, a dead
   pointer, an out-of-date status line). Surface what it changed.

3. **Pick the version.** Decide the semver bump from the `[Unreleased]` changes and the
   project's stage, per [references/versioning.md](references/versioning.md) (pre-1.0 has
   its own rules). State the bump and the reasoning, and confirm the version with the user
   before cutting, the bump is a judgement call, not a silent choice.

4. **Dry-run the mechanics.** Run `bash references/release.sh <version> --dry-run` from the
   repo root and show the plan (the gates it checks, the changelog section it would
   promote, the tag/commit/push/publish it would do). Fix anything a gate flags (unclean
   tree, version not greater than the last tag) before proceeding.

5. **Commit the judgement work first.** The changelog and README edits from steps 1-2
   must be committed (the script gates on a clean tree). Commit them with a clear message
   (e.g. `docs: changelog + readme for <version>`) so the release commit itself only
   promotes the changelog section.

6. **Cut the release.** Run `bash references/release.sh <version>`. It re-checks the gates,
   promotes `[Unreleased]` to a dated `[version]` section (leaving a fresh empty
   `[Unreleased]`), sets the version in `.claude-plugin/plugin.json` when the repo has one
   (Claude Code caches plugins by version), commits `release: v<version>`, creates an annotated tag, pushes the
   commit and **only that release tag** (never all local tags), and publishes a GitHub
   release with notes extracted from that version's changelog section. If the GitHub
   release step fails, the pushed tag stays in place (it is the durable artifact) and the
   script prints exact recovery steps (retry `gh release create`, or delete the tag);
   the temp notes file is always cleaned up.

7. **Report.** Confirm the tag, the GitHub release URL, and anything deferred.

## Notes

- **Requires `git` and `gh`** (authenticated). On Windows run the script via Git Bash /
  WSL (it's bash).
- **Never hand-edit the mechanics.** The gating and the tag/push/publish live in
  `release.sh` on purpose; do the judgement in the skill, let the script do the exact
  steps. Keep `release.sh` stable (same discipline as `wizard`'s library); change it only
  deliberately, and re-run `bash references/release.test.sh` (isolated: a local bare repo +
  a fake `gh`, never the real remote) when you do.
- **Idempotency / safety**: the script aborts without touching anything if a gate fails
  (unclean tree, bad or non-increasing version, empty `[Unreleased]`). `--dry-run` always
  changes nothing.
- This skill does not deploy the skills to harnesses, that's `scripts/install-skills.mjs`.
  A release tags and publishes the repo; deploying is a separate, local step.

## It's working if

- The changelog's new version section reads as user-facing changes, not commits.
- The README has no drift the release would have shipped.
- The tag is `vX.Y.Z`, strictly greater than the last, and the GitHub release notes match
  that version's changelog section.
- `[Unreleased]` is left empty and ready for the next cycle.

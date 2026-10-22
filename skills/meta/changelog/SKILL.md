---
name: changelog
description: "Maintain CHANGELOG.md in Keep a Changelog format with user-facing entries. Use when recording what changed for a release, updating the Unreleased section, or asked to write/update the changelog."
---

# Changelog

Maintain `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
The one rule that matters most: entries are **user-facing and benefit-oriented**, what
changed *for the user*, not a dump of commit messages. "Deploys no longer delete skills
from other sources" is a changelog entry; "fix: scope prune to manifest" is a commit.

Invokable on its own, and called by `release` as its first step.

## Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- <new capability, in the user's terms>

### Changed
- <behaviour that changed, and what it means for the user>

### Fixed
- <bug that's now fixed, described as the symptom that's gone>

### Removed
- <capability that's gone>

## [0.1.0] - 2026-10-19
...
```

`[Unreleased]` accumulates between releases; `release` promotes it to a dated
`[x.y.z]` section. Use only the four headings above, and only the ones that have entries
(omit an empty heading). Newest version first.

## How to update `[Unreleased]`

1. **Find the frontier of unreleased change.** The last release is the last `v*` tag
   (`git tag -l 'v*' --sort=-v:refname | head -1`); if there are no tags, use the whole
   history. Collect what changed since it from two sources:
   - **commits**: `git log <last-tag>..HEAD --oneline` for the shape of what moved;
   - **closed tkt tickets**: their resolutions are written as "what was done" and are the
     best raw material (`tkt query` for tickets closed since the last release; read their
     Resolution lines).
2. **Translate each change into a user-facing entry.** Ask "what can the user now do, or
   no longer has to worry about?" Drop refactors, test-only changes, and internal churn
   that no user would notice. Bucket each kept entry under Added / Changed / Fixed /
   Removed.
3. **Write the entry as a benefit, present tense, no ceremony.** Lead with the outcome,
   not the mechanism. One line each. ASCII hyphen bullets, no em-dashes (house style).
4. **Merge, don't duplicate.** If `[Unreleased]` already has an entry the new change
   extends, sharpen that line rather than adding a near-duplicate.

## It's working if

- Every entry reads as a change a user would notice, not an implementation note.
- A reader skimming `[Unreleased]` can tell whether the next release affects them.
- The headings present all have entries; no empty Added/Changed/Fixed/Removed.
- No raw commit hashes, ticket ids, or "refactor X" lines leaked in.

# GitHub release strategy

Research date: 2026-10-23. Coverage: ✅ requested local scripts/config/workflow, GitHub CLI and immutability docs, cargo-release and cargo-dist primary documentation. Repository immutability settings and live release state were not queried.

## Observed implementation

- [L1:verified] `tkt/tools/release.sh` runs fmt, clippy and tests, then `cargo release "$LEVEL" "$@"`. `tkt/release.toml` permits main, enables publish/verify/push, produces `v{{version}}`, and updates three plugin manifests. It intentionally leaves changelog curation manual.
- [L1:verified] `tkt/.github/workflows/release.yml` is generated for dist 0.32.0 and runs on version-tag pushes. After local/global builds, its host job creates the GitHub Release with `gh release create … artifacts/*`. Thus cargo-release owns version/commit/tag/crates.io, and the workflow owns GitHub publication. The `dist host --steps=upload --steps=release` command is not itself evidence of a duplicate GitHub publisher: the explicit generated `gh release create` is the visible GitHub publication operation.
- [L1:verified] `grey-matter/skills/meta/release/references/release.sh` promotes changelog entries, bumps two plugin manifests, commits, tags, pushes branch and tag separately, then directly creates a GitHub Release. Its recovery message suggests deleting the tag or retrying with the entire tagged CHANGELOG as notes. Neither is an adequate general recovery contract: the former breaks immutability policy; the latter changes the promised section-only notes.

## Primary-source findings

- [L4:verified] GitHub CLI can create a missing tag from the default branch. Require `--verify-tag` when the tag is an independently verified release identity. With assets, creation uses draft/upload/publish requests; it is explicitly non-atomic. `--draft` leaves publication pending. [GitHub CLI create](https://cli.github.com/manual/gh_release_create).
- [L4:verified] Immutable-release protection begins at publication: tags and assets then lock; even deleting the release does not permit tag-name reuse. GitHub recommends draft → upload all assets → publish. Notes/title remain editable. [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases).
- [L4:verified] Publishing an existing draft is supported by `gh release edit TAG --draft=false`. [GitHub CLI edit](https://cli.github.com/manual/gh_release_edit).
- [L4:verified] cargo-dist explicitly leaves versioning, notes, commits, tags, pushes and crates.io to tools such as cargo-release. Its one-package integration describes an atomic branch/tag push. [dist cargo-release guide](https://axodotdev.github.io/cargo-dist/book/workspaces/cargo-release-guide.html).
- [L4:verified] cargo-release provides separate version/replace/hook/commit/publish/tag/push steps and defaults to dry-run without `--execute`. These are useful recovery primitives after inspecting actual state; rerunning a version-bumping command is not a recovery algorithm. [cargo-release reference](https://raw.githubusercontent.com/crate-ci/cargo-release/main/docs/reference.md).

## Recommendation and warning checks

| Approach | Pro | Con / warning |
|---|---|---|
| Keep tkt workflow as sole GitHub publisher | Fits existing tag-triggered dist architecture; no competing local creator | A local shared release script must stop after preparing/pushing the tag and observe workflow completion. CLI creation is non-atomic, so inspect whether a draft or published release already exists before retrying. [CLI warning](https://cli.github.com/manual/gh_release_create) |
| Pre-create a curated draft, let dist finish it | Official `create-release=false` mode preserves supplied title/body, uploads assets and undrafts afterward | Requires intentionally changing dist config and regenerating workflow; creating a draft while retaining default create behavior gives two owners of creation. [dist config](https://axodotdev.github.io/cargo-dist/book/reference/config.html#create-release) |
| Keep direct publication for grey-matter | Matches its artifact-free local flow | Preserve pushed tags on failure, distinguish missing/draft/published state, and retry only the missing step. Immutable publication prevents tag/asset correction. [GitHub immutability](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) |

[L4:verified] Do not move dist GitHub publication from host to announce merely to make tags happen last: dist warns that Homebrew/npm installers can become available before the referenced assets. [dist github-release warning](https://axodotdev.github.io/cargo-dist/book/reference/config.html#github-release).

## Recovery contract inferred from the evidence

[L4:inferred] Record version, release commit SHA, tag, repository, notes and expected assets before mutation. After any failure inspect local/remote tag targets, registry publication, GitHub draft/public state, and workflow status. Resume only missing operations against the same identity; never bump again, force-move a published tag, or assume a failed API request had no effect. Once published, verify release tag/commit/assets, and use a new version for corrected binaries. An existing draft can be completed before publication. This synthesis follows the CLI's non-atomic warning plus GitHub's immutable boundary; it is a proposed contract, not a claim that the current scripts implement it.

## Currency and execution gate

These findings were researched on 2026-10-23. Re-read the linked primary documentation
and record installed client/tool versions before implementation or conformance claims.
Local file observations describe the checkout at that date, not a permanent API contract.

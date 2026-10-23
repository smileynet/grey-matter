# Publisher recovery contract

Read 2026-10-23 for ticket 68. Documentation and local configuration were inspected;
no live GitHub release, repository setting or registry publication was tested.
The implementation currently contains a tested reconciliation library, not a live
publisher or completed release workflow.

## Observed contracts

| Decision | Evidence and reason | Con / warning |
| --- | --- | --- |
| Discover drafts through authenticated, paginated release lists and preserve the observed release ID | [L4:verified] GitHub's [release API](https://docs.github.com/en/rest/releases/releases) includes drafts for users with push access; the by-tag endpoint documents published releases | A by-tag 404 does not establish absence. Authentication or transport failure must not become a create action. |
| Create a draft only after verifying the remote annotated tag; upload all assets before publishing | [L4:verified] [CLI create](https://cli.github.com/manual/gh_release_create) supports `--verify-tag` and `--draft`; [immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) lock tags/assets at publication | Creation, upload and publication are separate requests. The tag and repository immutability setting need independent checks. |
| Resume only matching uploaded assets | [L4:verified] The [asset API](https://docs.github.com/en/rest/releases/assets) exposes name, state, size and digest; [CLI upload](https://cli.github.com/manual/gh_release_upload) documents replacement behavior | `--clobber` deletes the original before upload. A 502 can leave an empty `starter` asset; duplicate names return 422. Missing digests and mismatched, duplicate or unexpected assets block automatic recovery. |
| Reinspect after an ambiguous mutation outcome | [L4:inferred] The separate request sequence permits a timeout after a successful operation | No documented idempotency key or conditional publication operation was found. One publisher and reinspection reduce races but do not make remote operations atomic. |
| Keep tkt's GitHub publisher in cargo-dist CI | [L1:verified] tkt's [Cargo configuration](https://github.com/smileynet/tkt/blob/d5d73639a92e44d6df8b76a0a8817e202ab63bf7/Cargo.toml) configures dist 0.32.0; its [generated workflow](https://github.com/smileynet/tkt/blob/d5d73639a92e44d6df8b76a0a8817e202ab63bf7/.github/workflows/release.yml) owns `gh release create` | Rerunning the current host job can encounter a draft left by a partial create. It has no state-aware resume branch yet. Local tooling must not create a competing release. |

Repository/product/tag/commit, reviewed notes/title and the complete asset set are one
release identity. The library verifies local bytes against sealed hashes and checks
remote state before accepting it. Existing releases must have matching notes/title;
published releases must also be immutable and contain every expected asset. Remote
tag movement or a changed/disappeared release ID stops recovery. No operation deletes
a tag, release or asset.

`release-publish.mjs` supplies the shared state logic through an injected API. Default
inspection makes no writes. Execution is tested only against fake services. Its gate
record must match the candidate commit and have no pending checks; this checks the
record's shape and identity, not the authenticity of external audit evidence. The
future staging/publisher integration must validate that evidence before calling it.
There is no live adapter or publication CLI, and existing entry points still reject
`publish` and `resume`.

## tkt integration and recovery seams

The effective configuration is `[workspace.metadata.dist]` in `Cargo.toml`, not a
`dist-workspace.toml`. Current release jobs are tag-triggered and use self-hosted
runners. `allow-dirty = ["ci"]` permits the checked-in workflow to differ from the
generator, so regeneration must deliberately account for those customizations.

[L4:verified] Dist's [configuration reference](https://axodotdev.github.io/cargo-dist/book/reference/config.html#create-release)
documents `create-release=false` for an existing draft, `extra-artifacts` for additional
files, and publication ordering. [Reusable workflow hooks](https://axodotdev.github.io/cargo-dist/book/ci/customizing.html)
provide integration points around build, host, publish and announcement. These are
supported seams; they are not evidence that the current workflow implements recovery.
Ticket 68 must configure/regenerate and test the chosen integration while preserving
one publisher.

[L4:verified] [cargo-release](https://raw.githubusercontent.com/crate-ci/cargo-release/master/docs/reference.md)
separates version/replace/hook/commit/publish/tag/push steps. Registry publication is
separate from GitHub hosting and stable promotion. Recovery must observe each channel
and never repeat a version bump to repair a later failure.
[CLI rerun](https://cli.github.com/manual/gh_run_rerun) supports failed-job or explicit
job recovery; job database IDs come from `gh run view`, not browser URL guesses.

## Remaining gates

- Implement argument-safe GitHub and Git adapters, authenticated pagination, immutable
  setting inspection and remote tag verification. A missing API digest currently
  blocks recovery; a download-and-hash fallback would require its own tests.
- Bind final staging/audit evidence before exposing publication commands. The library's
  input fields do not grant human authorization or certify final readiness.
- Implement the atomic branch/tag push, crate observation/publication, cargo-dist
  integration and stable promotion/recovery. Test unsupported atomic pushes and
  interruptions using disposable remotes and fake services.
- Preserve settings, client-version and native-platform gaps. [Asset attestation
  verification](https://cli.github.com/manual/gh_release_verify-asset) applies after
  immutable publication; live availability and supported gh versions remain untested.

Coverage: GitHub and cargo-dist documentation and tkt's local release configuration
were inspected. Live publication behavior, repository settings and supported
client/platform combinations remain untested. Ticket 68 remains open. This work
published no tag, registry release, GitHub release or stable ref.

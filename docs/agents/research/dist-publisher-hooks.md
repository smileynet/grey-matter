# cargo-dist 0.32 publisher integration

Research date: 2026-10-23. Coverage: pinned 0.32 configuration, CI template, GitHub command generator, and tkt Cargo.toml/release.yml were inspected. Workflow integration remains unimplemented; no publication ran.

## Result

[L1:verified] tkt pins `cargo-dist-version = "0.32.0"`, keeps five binary targets plus shell/PowerShell installers, and already uses `allow-dirty = ["ci"]`. Its maintained release.yml builds local/global artifacts and invokes `gh release create` inside `host`, after `dist host`. It has no custom publisher workflow today.

[L2:verified] There is **no documented 0.32 key that replaces the built-in GitHub publisher with a custom reusable publisher**. `publish-jobs` adds jobs. `create-release = false` still uploads and publishes an existing draft; it is not a publisher-disable switch. Source confirms it generates `gh release edit ... --draft=false`. `github-release` accepts only `auto`, `host`, `announce`. See [pinned command generator](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/cargo-dist/src/backend/ci/github.rs#L483-L516), [pinned enums](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/cargo-dist/src/config/mod.rs#L209-L249), and [pinned configuration](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/book/src/reference/config.md).

## Exact supported configuration

Under existing `[workspace.metadata.dist]` (the v0 Rust form):

| Key | Supported behavior | Constraint / con |
| --- | --- | --- |
| `publish-jobs = ["./publish-release"]` | Calls `.github/workflows/publish-release.yml` with required string input `plan`; secrets inherited | Additive; default built-in publisher has already published in host. Custom publish is skipped on prereleases unless `publish-prereleases = true`. |
| `global-artifacts-jobs = ["./seal-plugin"]` | Custom reusable workflow after local binary jobs; host waits for it | Runs alongside built-in global build, not after it; cannot assume installers exist yet. |
| `host-jobs = ["./verify-release"]` | Additional pre-publish jobs | Runs parallel to built-in host, not as a guard before its GitHub publication. |
| `post-announce-jobs = ["./after-release"]` | Runs after announcement and publishing | Too late to add immutable release assets. |
| `github-custom-job-permissions = { "publish-release" = { contents = "write" } }` | Explicit permissions for generated custom caller | Overrides default publish permissions, which are id-token/write and packages/write. Callee cannot elevate caller permissions. |
| `create-release = false` | Uploads to and undrafts pre-existing release, preserves title/body | Still a second publisher if custom workflow publishes too. |
| `github-release = "announce"` | Moves built-in publication after publish-jobs | Still publishes; official warning: package-manager releases can reference URLs not yet live. |
| `allow-dirty = ["ci"]` | Excludes generated CI from regeneration and consistency checks | Official docs recommend avoiding it when supported settings suffice; maintains a manual workflow responsibility. Already present in tkt. |
| `extra-artifacts` array | Build command plus explicit output files, built/uploaded with dist | Packaging alone does not establish review, provenance, sealing, or remote resume. |

Source: [0.32 config](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/book/src/reference/config.md), [0.32 custom workflow guide](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/book/src/ci/customizing.md), and [actual dependency template](https://github.com/axodotdev/cargo-dist/blob/v0.32.0/cargo-dist/templates/ci/github/release.yml.j2#L456-L614). Note the guide's introductory list inconsistently says `build-global-artifacts-jobs`; authoritative config/reference and template use `global-artifacts-jobs`.

Example extra artifacts in the existing Rust metadata representation:

```toml
[[workspace.metadata.dist.extra-artifacts]]
artifacts = ["target/plugin-release/plugin.zip", "target/plugin-release/plugin-seal.json"]
build = ["node", "scripts/seal-plugin.mjs"]
```

## Feasible design

[L6:inferred] Retain tkt's existing manually maintained dist build pipeline and `allow-dirty=["ci"]`; replace only its GitHub-mutating host steps with **one job-level reusable-workflow call** after successful local/global builds and plugin sealing. Keep the manifest collection if downstream tooling needs it. The reusable workflow should consume the same-run binary artifacts, sealed plugin assets and reviewed notes from the tagged commit. This is a custom CI integration around supported dist build/artifact commands, not a claim that `publish-jobs` can replace built-in publication.

Put validation and assembly inside the reusable publisher before any remote write: resolve the exact tag commit, validate version authorities, verify reviewed notes/review evidence and the expected complete artifact inventory, verify the plugin seal against the tagged source and digests, reject duplicate asset basenames. Use explicit inventories rather than blindly uploading `artifacts/*`, which currently contains granular manifests until cleanup.

Publisher state machine: absent release -> create draft with explicit reviewed notes and `--verify-tag`; existing draft -> verify tag/target, notes and already-uploaded asset digests; upload missing assets without clobbering; verify exact final inventory/digests; publish draft once. Existing published release -> validate exact expected state and return success without mutation; mismatches -> fail. Serialize by repository/tag with concurrency cancellation disabled. Re-read remote draft immediately before publication; draft assets are mutable until that point. Keep sealed artifacts available for reruns rather than rebuilding and silently accepting differing bytes.

[L2:verified] GitHub explicitly recommends draft -> attach all assets -> publish. Immutability locks published assets and tag, **not title/notes**; therefore preserving reviewed notes requires publisher verification/policy as well as repository immutability. [GitHub immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases).

[L2:verified] `gh release create --verify-tag --draft --notes-file ...` provides useful primitives. Creation with assets uses multiple requests, not an atomic transaction. CLI documentation explicitly warns draft assets remain mutable, including while upload runs. [GitHub CLI release create](https://cli.github.com/manual/gh_release_create).

## Gaps and required validation

- No actual `dist generate` fixture was run: source proves additive behavior, but a proposed config must still be generated and inspected before implementation acceptance.
- Repository immutable-release setting and deployed GitHub CLI version were not queried; require explicit preflight evidence before claiming immutable publication.
- Plugin seal schema/review-evidence contract must be taken from project release contract; this report does not invent that authority.
- Workflow rerun retention is finite; resume beyond retained CI artifacts requires durable sealed staging or a documented rebuild/review boundary.
- Built-in `host-jobs` cannot guard built-in host publication. Do not combine it with default host and claim the validation is ordered.
- Removing built-in release creation must include all locations (host and announce), so there is exactly one owner of GitHub release writes.

Evidence: read current `/Users/sambiggins/code/tkt/Cargo.toml` and `.github/workflows/release.yml`; fetched/read v0.32.0 config, enums, GitHub backend generator, main template and publish partial. This file is research only; no tracked source changed.

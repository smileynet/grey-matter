# Cargo 1.99.1 publish source contract

Date: 2026-10-23. Scope: read-only source research for ticket 68. No registry writes, installs, project source changes or repeat transport probe.

## Result

[L1:verified] The official Rust 1.99.1 source archive was downloaded and SHA-256 verified: `db56bbc64db491ceda6b78a2811a6d121c639338906fd944f720289cbd02245c`. Its bundled `src/tools/cargo/git-commit-info` contains `5f94df4789f005f9a352888e8355ffc645b7ed0e`, short hash `5f94df478`, date `2026-08-27`. All three exactly match installed `cargo -Vv` (Cargo 1.99.1 Homebrew). This resolves the prior source retrieval gap. The failed GitHub path remains a retrieval failure, not evidence of absence.

Primary versioned source: [official rustc-1.99.1-src.tar.gz](https://static.rust-lang.org/dist/rustc-1.99.1-src.tar.gz). Local retained archive: `.scratch/rustc-1.99.1-src.tar.gz`. Selected readable extracted files: `.scratch/cargo-source-exact/` (scratch only). Matching commit establishes source-version identity; this is not a reproducible-build attestation that the Homebrew binary contains no patch.

[L1:verified] A supported **credential-provider checksum gate** exists immediately after packaging and before upload. It can compare Cargo's own newly generated archive checksum against the independently reviewed seal before releasing a token. This is materially stronger than hoping a second packaging reproduces a preflight. It still requires protection against an external writer mutating the open archive inode between Cargo's hash and HTTP body read. No production adapter or new probe was implemented here.

## Exact call chain and file handle

All paths below are relative to `src/tools/cargo/` in the verified source archive; line numbers refer to extracted original source.

1. `src/ops/registry/cargo_publish.rs:162–184`: `publish` invokes `ops::cargo_package::package_with_dep_graph`, with verification/dirty flags from publish options, `include_lockfile: true`, and the resolved registry. Existing output is not an input archive option.
2. `src/ops/cargo_package/mod.rs:144–200`: `create_package` opens an exclusive scratch `FileLock` in build-dir `package/tmp-crate/<name-version.crate>`, truncates it, writes the tar/gzip, and returns that handle. `package_with_dep_graph` (243–250) returns the archive handles from `do_package`. The separate public `package` function's artifact uplift/copy (216–235) is not the publish path.
3. `cargo_publish.rs:224–247`: the graph entry supplies `tarball`; Cargo seeks `tarball.file()` to zero, computes SHA-256 from it and passes `Operation::Publish {name, vers, cksum}` to `auth::auth_token`. Failure returns before `transmit`.
4. `cargo_publish.rs:262–270`: the same `tarball.file()` reference is passed to `transmit`; there is no reopening by pathname and no repackage in this interval.
5. `cargo_publish.rs:649–667`: `transmit` prepares registry metadata, checks dry-run, then calls `registry.publish(&new_crate, tarball)` using that same `&File`. Metadata preparation (`525–643`) normalizes in-memory manifest data and rereads the README; it does not rewrite the archive. Mutable source could therefore affect *upload metadata* even if archive bytes are held fixed: source protection remains useful.
6. `crates/crates-io/lib.rs:277–315`: `Registry::publish` seeks the provided `&File` to end for length then back to zero, constructs the metadata/length header, and reads header plus this file into an owned `Vec<u8>` HTTP body. Only then does the HTTP transport run. In the inspected call chain there is no Cargo archive write after the provider check. Once the body is built, later file changes cannot alter that owned request body.

[L1:inferred] Under trusted Cargo/provider/OS and an exclusive private archive backing inode, a provider accepting only the reviewed checksum can enforce the archive equality at Cargo's last supported authorization seam. Pinning source inputs and Cargo alone is not such enforcement. Cargo's exclusive file lock is advisory; it does not prevent an uncooperative same-user or host writer. Path replacement alone ordinarily leaves the existing open inode intact; mutation of that same inode is the relevant residual threat. Do not claim security against arbitrary host root/same-user writes without a stronger boundary.

## Provider protocol and bypass conditions

[L4:verified] Official [credential-provider protocol](https://doc.rust-lang.org/cargo/reference/credential-provider-protocol.html#publish-request) specifies a v1 `get` request whose `operation` is `publish`, with name, version, checksum and registry identity. A provider starts with `{"v":[1]}`; Cargo passes `--cargo-plugin`. An accepted credential response uses `Ok`, `kind: get`, token, cache policy and operation independence. A refusal can return `Err` kind `other` with a diagnostic. These are documented extension points, not a custom registry uploader.

[L1:verified] `cargo_publish.rs:131–142` requests a **read** credential before packaging. `src/util/auth/mod.rs:608–619` reuses a cached token for publication if it was marked operation-independent. `:655–658` returns a `cache: never` token without insertion. Therefore the gate provider must answer read operations without caching an operation-independent token (prefer `cache: never`, `operation_independent: false`) and must independently check the later publish request. Otherwise the critical provider call can be bypassed by Cargo's credential cache.

[L1:verified] `auth/mod.rs:457–466` caches a command-line token as operation-independent. The production invocation must prohibit `--token`, use isolated controlled configuration and exactly the selected registry provider, and prevent token-provider fallback. `auth/mod.rs:70–96` prioritizes an explicitly configured per-registry credential provider; `:508–572` otherwise loops provider candidates. See [registry authentication](https://doc.rust-lang.org/cargo/reference/registry-authentication.html). A checksum rejection must be fatal, not `url-not-supported`/`not-found` that invites another provider.

This research did not execute a provider. Required harmless follow-up: localhost mock, dummy token, exact checksum match reaches one captured PUT; wrong hash/name/version/registry reaches zero; initial read response never bypasses the publish request; CLI token/config fallback attempts are rejected by the wrapper; post-check same-inode mutation is explicitly tested against the chosen write boundary. Do not call this a completed release gate before those results exist.

## Inputs affecting generated archive

[L1:verified] Package source enumerator is `PathSource::list_files`, called at `cargo_package/mod.rs:489`, followed by VCS state extraction. `build_ar_list` (`503–640`) supplies on-disk files, original and normalized manifests, generated lockfile and VCS JSON; readme/license paths may add files outside the initially enumerated list. Archive order is sorted by relative path. Source symlink targets and file permissions matter; all included file content and reachable external file inputs need closure, not merely tracked `.rs` files.

[L1:verified] Generated manifest uses `prepare_for_publish` and manifest serialization (`887`, `918–920`), so workspace inheritance, target detection, included-file set, dependency registry identities and loaded Cargo configuration may affect output. Generated lockfile (`742–804`) loads the original resolution, constructs an ephemeral published workspace, resolves with registry/configuration and all features/dev units, checks yanked dependencies, then serializes the result. `--locked` is not proof of byte identity; it constrains lock changes, not all packaging inputs or registry observation.

[L1:verified] Gzip uses crate filename and compression-best (`872–874`); ordinary tar entries use deterministic metadata (`902–910`), generated entries fixed mode/timestamp (`925–934`). Pin the complete Cargo distribution/platform if claiming algorithm-level reproducibility; matching Cargo version text alone does not identify compression/dependency build inputs. Git discovery, HEAD, path-within-repo, ignore/index state and clean-state checks affect VCS JSON/file discovery (`cargo_package/vcs.rs`). Packaging outside Git can omit VCS JSON instead of failing (`vcs.rs:55–75`).

[L4:verified] [Official package command](https://doc.rust-lang.org/cargo/commands/cargo-package.html) confirms manifest normalization, generated lock/VCS data and flattened symlinks, and explicitly warns that VCS provenance is best-effort rather than proof that archive contents match the commit. Therefore sealed source + pinned Cargo is useful reproducibility evidence, not a sufficient byte-enforcement gate by itself.

## Coverage and remaining gaps

- Fully extracted: exact Cargo 1.99.1 source identity, packaging-to-hash-to-provider-to-same-file-to-request-body path, provider caching bypass, major archive input classes.
- Partial: transitive internals of manifest parser/resolver/path enumerator/config loaders not exhaustively enumerated; binary reproducible-build equivalence not established.
- Unexecuted: checksum-checking provider and enforced output-inode boundary; no result here authorizes real publication.

Evidence: official archive download succeeded; Python hashlib digest equals recorded Homebrew source SHA; extracted `git-commit-info` equals current `cargo -Vv`; source snippets inspected at the line ranges above. Existing local-probe results were read but not rerun. No project-tracked files were changed.

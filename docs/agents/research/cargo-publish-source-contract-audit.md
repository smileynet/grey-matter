# Audit: Cargo 1.99.1 publish source contract

Date: 2026-10-23. Independent audit of [the producer report](cargo-publish-source-contract.md), using retained source and freshly fetched official documentation. No registry writes or transport probe execution.

**PASS — trust score 9/10 for the source-level contract.** The checksum authorization seam, same-file upload chain and cache bypass conditions are supported. This score does not certify an implemented provider, an immutable inode boundary or production publication readiness.

## Independent identity verification

[L1:verified] Rehashed the retained 566,528,605-byte `.scratch/rustc-1.99.1-src.tar.gz` with Python SHA-256. Result: `db56bbc64db491ceda6b78a2811a6d121c639338906fd944f720289cbd02245c`. Independently fetched the [official checksum sidecar](https://static.rust-lang.org/dist/rustc-1.99.1-src.tar.gz.sha256) over HTTPS; its digest is identical. The archive was not downloaded again. The web reader could not open the sidecar, but Python HTTPS retrieval succeeded.

[L1:verified] Read `src/tools/cargo/git-commit-info` directly from that archive: full commit `5f94df4789f005f9a352888e8355ffc645b7ed0e`, short commit `5f94df478`, date `2026-08-27`. A fresh `cargo -Vv` returns exactly these values and release `1.99.1` (Homebrew, aarch64-apple-darwin). Each inspected retained file was independently compared byte-for-byte with its original archive member:

| Retained file under `.scratch/cargo-source-exact/` | SHA-256 |
| --- | --- |
| `cargo_publish.rs` | `e138901d65b8b8a8a66f0da1b22cdd9cac3849a177ad505b35d6852d2e6fb111` |
| `lib.rs` (crates-io client) | `a6c772f054f0d176bb5927b640c3ae4bf667da894c5b6a98bb1549da2de97696` |
| `src/ops/cargo_package/mod.rs` | `a221487dbd72ffc0b63c6c8cf72a82787bd3acae9caf000a58b0bae21008adf4` |
| `src/ops/cargo_package/vcs.rs` | `838ccab8cb331cb790dc84ef0dff9895fe803e1a23f6baabd99de244880b7699` |
| `src/util/auth/mod.rs` | `7f70cba029e8a56ddffcff4fe64711ea9dc5fe8424dcfb718d0dbfe0f1381b7f` |

This establishes the inspected upstream source revision. Matching version metadata is not a reproducible-build attestation of the installed Homebrew binary; the producer states that limitation correctly.

## Per-claim verdicts

Source references below use original line numbers under `src/tools/cargo/` in the [official versioned archive](https://static.rust-lang.org/dist/rustc-1.99.1-src.tar.gz). Short excerpts are from the independently matched source files.

| Claim | Verdict | Supporting evidence and limits |
| --- | --- | --- |
| Official archive digest and Cargo commit/date match the installed binary metadata. | supported | Independent archive hashing, official checksum retrieval, archive commit-info extraction and fresh `cargo -Vv`, above. Binary equivalence remains unproven. |
| Publish creates a new archive rather than accepting an existing output archive. | supported | `cargo_publish.rs:162–184` calls `package_with_dep_graph`; package `mod.rs:175–185` opens scratch space and executes `dst.file().set_len(0)?` before `tar`. No existing-archive input in this path. |
| The publish path retains the scratch archive handle, rather than the public package command’s uplift copy. | supported | `mod.rs:243–250` maps `do_package` results to `(opts.cli_features, tarball)`. The separate uplift loop is at `216–235`. |
| Cargo hashes the archive immediately before obtaining publish authorization. | supported | `cargo_publish.rs:224–247`: graph-owned `tarball.file()` is rewound, passed to `update_file`, then the hash enters `Operation::Publish { name, vers, cksum }`; `auth_token(...)?` must succeed before continuation. |
| The same File reaches upload, with no Cargo archive write between the hash/provider check and body construction. | supported | `cargo_publish.rs:262–270` passes `tarball.file()` to `transmit`; `649–667` accepts `tarball: &File` and calls `registry.publish(&new_crate, tarball)`. Client `lib.rs:277–315` seeks this same file, then `Cursor::new(header).chain(tarball).read_to_end(&mut body)?`. Inspected intervening operations only prepare metadata, seek and read the archive. External processes are outside this claim. |
| Later file mutations cannot alter the already constructed HTTP body. | supported | Client `lib.rs:303–315` constructs an owned `Vec`, moves it into `.body(body)?`, then calls `self.handle.request(request)`. This does not remove the earlier hash-to-read mutation window. |
| Metadata can be reread after the authorization check even while archive bytes remain fixed. | supported | `prepare_transmit`, `cargo_publish.rs:525–643`, calls `prepare_for_publish` and reads the README from `local_pkg.root().join(readme)`. The metadata header is separately serialized at client `lib.rs:282`. Source protection remains relevant. |
| The supported provider protocol carries publish identity/checksum and permits success or fatal refusal. | supported | Fresh [protocol documentation](https://doc.rust-lang.org/cargo/reference/credential-provider-protocol.html#publish-request) specifies `get`, `publish`, `name`, `vers`, `cksum`, registry information, v1 hello, cache controls and failure kinds. It documents `--cargo-plugin` execution. |
| A cached operation-independent read token can bypass the later provider call. | supported | `cargo_publish.rs:131–142` requests `Operation::Read` before packaging. `auth/mod.rs:608–619` returns cached credentials when operation-independent; `655–658` returns a never-cache response before insertion. Requiring a fresh publish decision and avoiding such read caching is justified. |
| CLI tokens and fallback providers must be excluded by the production wrapper. | supported | `auth/mod.rs:457–466` inserts CLI credentials with `operation_independent: true`; `70–96` returns exactly the explicit per-registry provider; `508–572` loops alternatives only for UrlNotSupported/NotFound, while other failures return. Fresh [authentication documentation](https://doc.rust-lang.org/cargo/reference/registry-authentication.html) corroborates fallback precedence and token-provider configuration. Wrapper enforcement is still unimplemented. |
| Packaging depends on more than tracked Rust source and a lockfile. | supported | Package `mod.rs:489–640` enumerates files, adds original/generated manifests, lockfile, VCS JSON and external readme/license inputs, then sorts paths. `742–804` rebuilds published resolution and checks yanked dependencies; `887–934` normalizes manifest and emits deterministic archive metadata. VCS `55–75` permits no-repository output. Fresh [package documentation](https://doc.rust-lang.org/cargo/commands/cargo-package.html) confirms normalization, symlink flattening and limited VCS provenance. This is a major-input inventory, not an exhaustive transitive specification. |
| A matching provider checksum enforces equality only if the backing inode cannot change until the HTTP body has been read. | supported, conditional inference | The same-file source chain proves the conditional argument under trusted Cargo/provider/OS and SHA-256 assumptions. The source does not establish an enforced private immutable backing inode. The producer explicitly retains this gap and does not claim advisory locking protects against arbitrary writers. |

## Findings and remaining gaps

No unsupported or weak factual claim requiring correction was found within the report’s stated source-research scope. The report correctly separates observations, conditional inference and unexecuted work.

1. **Runtime gate remains unexecuted.** A localhost mock must demonstrate exact-match upload, zero PUTs for wrong checksum/name/version/registry, read-cache bypass resistance and wrapper rejection of CLI-token/config overrides. Source inspection is not a substitute for these results.
2. **Archive mutation protection remains unproved.** A provider checksum alone leaves the interval between hashing and request-body construction vulnerable to mutation of the same inode. Test the chosen boundary with an adversarial same-inode writer; a pathname-only or post-upload check does not establish it.
3. **Binary and transitive input limits remain.** The archive identifies upstream source, not the precise Homebrew build. Manifest/resolver/enumerator internals were not exhaustively audited. Pin actual toolchain distribution and platform before making stronger reproducibility claims.
4. **Documentation currency is bounded.** Protocol/authentication/package pages were fetched from current official documentation on the audit date; exact behavioral authority for this conclusion is the independently matched 1.99.1 source archive. The report makes no claim that future Cargo versions retain this seam unchanged.

Coverage: fully checked source identity, packaging/hash/provider/upload chain, cache and fallback conditions, and the cited major-input inventory. Partial transitive internals; no runtime provider or immutable-inode boundary verification. No registry write was executed.

Evidence: Python `hashlib` + `tarfile` + official HTTPS checksum retrieval → matching archive digest and five matching retained files; `cargo -Vv` → matching release/commit/date; direct source reads and fresh official documentation → verdicts above.

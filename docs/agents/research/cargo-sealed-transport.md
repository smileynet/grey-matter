# Cargo 1.99.1 sealed transport investigation

Date: 2026-10-23. Scope: one transport question for ticket 68. No publication, registry upload, release, tag, source edit, or Cargo publish invocation ran. Probe below is a design, not observed success.

## Practical conclusion

[L1:verified] Installed `cargo -Vv` reports `cargo 1.99.1 (5f94df478 2026-08-27) (Homebrew)`, full commit `5f94df4789f005f9a352888e8355ffc645b7ed0e`, host `aarch64-apple-darwin`. `cargo publish --help` has no argument accepting an existing `.crate`. It offers `--manifest-path`, `--target-dir`, `--registry`, `--index`, `--locked`, `--dry-run`, and `--no-verify`; the last explicitly skips building verification.

[L4:verified] The official publish contract creates a package from source before upload. Therefore the supported CLI does not currently establish “send this sealed file without recreating it.” A reproducible repackaging result is a weaker claim than using the sealed file as the upload source. Keep the stronger release requirement open until the pinned implementation and an actual boundary test establish a pre-upload enforcement mechanism. Do not implement a raw uploader to paper over this gap.

Sources: [publish command](https://doc.rust-lang.org/cargo/commands/cargo-publish.html), especially description and `--no-verify`; local `cargo publish --help` output.

## Implementation evidence and explicit source gap

[L1:verified] Exact-commit source request `https://raw.githubusercontent.com/rust-lang/cargo/5f94df4789f005f9a352888e8355ffc645b7ed0e/src/cargo/ops/registry/publish.rs` returned HTTP 404. GitHub contents request `https://api.github.com/repos/rust-lang/cargo/contents/src/cargo/ops` also returned 404, as did attempted master source paths. These responses establish retrieval failure, not absence of source or an implementation fact. No exact pinned call chain, package reuse branch, file-open identity, or hash enforcement was observed. Do not cite speculative Cargo function names as verified implementation paths.

[L1:verified] `brew info rust --json=v2` identifies source distribution `https://static.rust-lang.org/dist/rustc-1.99.1-src.tar.gz`, expected SHA-256 `db56bbc64db491ceda6b78a2811a6d121c639338906fd944f720289cbd02245c`. Follow-up: obtain and validate that archive, locate bundled Cargo source, then inspect publish -> packaging -> HTTP body read. This investigation did not download that archive. Confirm its Cargo revision matches the installed binary before relying on it.

## Harmless localhost probe design

Use a disposable dependency-free Rust fixture under `.scratch/`, not project production source. Put a unique package name/version in its manifest. Use a separate empty `CARGO_HOME`, a dummy token, explicit named registry, and a server bound to `127.0.0.1` on an ephemeral port. Scrub inherited registry credentials/proxies and configure only loopback endpoints; reject redirects and any non-loopback request. Where available, run inside a network namespace or equivalent egress deny rule permitting loopback only. An enforced loopback-only egress rule would prevent an accidental default-registry request from reaching production. Verify that restriction before running the probe.

The mock serves sparse index `config.json` with both `api` and `dl` on the same loopback address. Missing crate records return 404 before capture. Implement only `PUT /api/v1/crates/new`; capture the complete body, never forward it. Decode two unsigned little-endian 32-bit lengths around metadata and crate bytes. Require exact body consumption and valid lengths; preserve raw body, metadata, extracted crate, request count and SHA-256. Reply with JSON success and then serve a minimal index row with the captured checksum to finish polling. A simpler deliberate error after capture avoids polling but must report the expected Cargo nonzero exit separately from successful transport capture.

[L4:verified] The web API specifies this upload envelope and allows successful upload before index visibility. The registry index specifies its `api` base URL and the `.crate` SHA-256 `cksum`. Sources: [web API, Publish](https://doc.rust-lang.org/cargo/reference/registry-web-api.html#publish), [index configuration](https://doc.rust-lang.org/cargo/reference/registry-index.html#index-configuration), [index schema](https://doc.rust-lang.org/cargo/reference/registry-index.html#json-schema).

Run matrix, each case with a fresh fixture/home/index state:

1. Package the fixture with pinned Cargo and the same registry/config options intended for publish. Copy the produced archive to a separate seal path; record hash and size. Keep the seal outside Cargo's target/package output directory.
2. Invoke pinned `cargo publish --manifest-path <fixture>/Cargo.toml --registry probe --locked --no-verify --target-dir <fixture-target>` with named registry index `sparse+http://127.0.0.1:<port>/index/`, dummy token, and explicit `cargo:token` credential provider. Do not use `--offline`/`--frozen`: the upload must reach loopback. Capture SHA-256 must equal sealed SHA-256. This only establishes same-input reproducibility for the tested environment.
3. Keep seal and preexisting target/package archive fixed; mutate a packaged source file, then publish. If capture follows changed source, this falsifies a claim that preexisting target/package output is authoritative. Repeat with corrupted target/package archive to see whether Cargo replaces it. Record bytes before/after, not only exit status.
4. Mutate source after a separate successful dry-run comparison but before publish. Require the proposed production guard to stop before the mock sees a PUT. A mismatch discovered after capture is a failed safety gate even when the script exits nonzero. This is the decisive test of the existing “compare then publish” proposal.
5. Re-run baseline with the exact future publisher invocation, fixture registry name/config and dependency arrangement that mirror real packaging. Alternate registry identity can change packaged metadata/dependency resolution; do not extrapolate a dependency-free fixture to the production crate.

Suggested configuration (substitute actual port and fixture paths):

```toml
[registries.probe]
index = "sparse+http://127.0.0.1:PORT/index/"
credential-provider = "cargo:token"
```

Dummy environment: `CARGO_REGISTRIES_PROBE_TOKEN=local-probe-only`; execute with isolated `CARGO_HOME` and explicit config. `--dry-run` is useful for checking packaging but cannot exercise the upload boundary because it suppresses upload.

## Acceptance and risks

Emit structured probe result with status, Cargo full version, invocation/config hashes, sealed/packaged/captured hashes and sizes, PUT count, mutation case, Cargo exit and stderr. A pass requires all expected cases and exact request counts. Retain byte fixtures to reproduce discrepancies.

Warnings: `--locked` controls lockfile changes, not source immutability or archive identity. `--no-verify` is not an existing-archive transport option. A comparison before a later packaging step leaves a time-of-check/time-of-use gap. A captured mismatch proves failure after transmission; it does not prevent that transmission. Pinning alone is insufficient, and a mock probe proves only the tested invocation/environment. No evidence here supports deploying a custom loopback proxy or patched Cargo as a production workaround.

Coverage: ✅ installed CLI identity/options and official protocol read; ✅ bounded probe designed; ⚠️ exact pinned source not retrieved; ❌ localhost probe not implemented/run; ❌ sealed-file-only transport mechanism established. Preserve the existing release-contract gate.

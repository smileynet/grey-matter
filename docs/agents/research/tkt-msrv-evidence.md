# tkt Rust 1.80 release-audit evidence

Coverage: ✅ declared MSRV, locked dependency metadata, lockfile format, hosted failing 1.80.1 build, passing 1.85.0 build and full gate.

The initial investigation below records the pre-fix state. The hosted follow-up at
the end supersedes its unexecuted compilation gap.

## Finding

[L1:verified] At audited source `b2d2321`, `Cargo.toml` declares `rust-version = "1.80"` and edition 2021. `Cargo.lock` uses format version 4. The locked normal dependency chain includes `clap 4.6.4 -> clap_builder 4.6.2 -> clap_lex 1.1.0`, and the derive feature brings `clap_derive 4.6.4`. Every one of these four cached crate manifests declares `rust-version = "1.85"` and `edition = "2024"`.

[L1:verified] The test dependency chain also contains `tempfile 3.27.0 -> getrandom 0.4.3`; the cached `getrandom` manifest declares Rust 1.85 and edition 2024. `cargo tree --locked -i getrandom@0.4.3` and `cargo tree --locked -i clap_lex@1.1.0` confirmed the chains.

[L2:inferred] The current locked binary build does not support Rust 1.80: Clap alone is decisive, without invoking dev dependencies. Cargo 1.80 may reject the edition-2024 manifest before reaching a rust-version diagnostic. The precise failure wording is unexecuted.

[L4:verified] Lockfile v4 itself is compatible with Cargo 1.80. Cargo's changelog says v4 stabilized in Cargo 1.78 and explicitly states Rust toolchains 1.78+ support it. Its becoming the default in 1.83 must not be confused with its first supported version.

## Primary sources read

- [L4:verified] [Cargo changelog, Cargo 1.78 and 1.83](https://doc.rust-lang.org/stable/cargo/CHANGELOG.html#cargo-178-2024-05-02): format-v4 stabilization and compatibility statement (also 1.83 section).
- [L2:verified] [Cargo rust-version reference](https://doc.rust-lang.org/stable/cargo/reference/rust-version.html): support declaration, unsupported-toolchain diagnostics, and verified support expectations. Dependency ranges need only admit at least one compatible version; broad `clap = "4"` by itself does not prove the package can never support 1.80. The *current locked versions* are the failure.
- [L4:verified] [Rust 2024 edition guide](https://doc.rust-lang.org/edition-guide/rust-2024/index.html): release version 1.85.0.
- [L1:verified] Local `/Users/sambiggins/code/tkt/Cargo.toml`, `Cargo.lock`, and matching `~/.cargo/registry/src/*/{clap-4.6.4,clap_builder-4.6.2,clap_derive-4.6.4,clap_lex-1.1.0,getrandom-0.4.3}/Cargo.toml`.

## Smallest decisive hosted test

At the audited commit, use one Linux hosted job with Rust 1.80.0 and run `cargo +1.80.0 check --locked --bin tkt`. This tests the normal dependency failure with no test suite or platform matrix. Capture the exact error and commit SHA. If the intended support contract includes tests, additionally run `cargo +1.80.0 test --locked`; that is broader verification, unnecessary merely to demonstrate the existing Clap blocker. Do not regenerate Cargo.lock or use `--ignore-rust-version`.

During the initial investigation, no CI was dispatched, toolchain installed, build attempted, or source changed. Installed toolchains observed: stable, 1.90, 1.97.1; Rust 1.80 is absent. `git status --short` in tkt returned no changes after investigation.

Evidence: Python TOML inspection of every locally cached locked crate manifest → four Clap crates and getrandom require 1.85; `cargo tree --locked -i` → confirms normal/dev chains; official changelog read → lockfile v4 supported since 1.78; `rustup toolchain list` → 1.80 unavailable; `git status --short` → clean tkt tree.

## Hosted remediation and verification

[L1:verified] [Run 40054220986, minimum job](https://github.com/smileynet/tkt/actions/runs/40054220986/job/120753486806)
at `3627d815130b2a43e3842dd6104d7ede5adaa275` installed Rust/Cargo 1.80.1.
`cargo check --locked --bin tkt` exited 101: clap_lex 1.1.0 requires the
unstabilized `edition2024` feature. This observes the failure predicted above.

[L1:verified] Fix `acf27c5720870bc35241ec830546a39bdafbff4d` declares exact
minimum 1.85.0, documents it in the README, and records the source-build upgrade
path in the changelog. The CI minimum job reads the version from Cargo.toml,
preventing a second independently maintained version promise. No dependency
versions or CLI behavior changed. Its [action documentation](https://github.com/dtolnay/rust-toolchain)
specifies an explicit `toolchain` input with the master action revision.

[L1:verified] [Run 40054566229, minimum job](https://github.com/smileynet/tkt/actions/runs/40054566229/job/120754556480)
at `a1fe66a7bb7e096ddf8f98fbe4d0f6779b5a5087` reports `release: 1.85.0` and
passes `cargo check --locked --bin tkt`. Its [full gate](https://github.com/smileynet/tkt/actions/runs/40054566229/job/120754556236)
passes 14 Node checks, fmt, clippy and 296 Rust tests on stable. The minimum job
checks the binary; the full test suite is not claimed to have run on 1.85.0.

A separate cold-cache failure in the full gate at acf27c5 selected an uncached
serde_json in an offline identity fixture. Ticket 216 fixes that by seeding the
fixture from the project lockfile and fetching locked dependencies before CI.
The successful clean run above includes this correction. Tickets
[215](https://github.com/smileynet/tkt/blob/main/.tickets/215-verified-msrv.md) and
[216](https://github.com/smileynet/tkt/blob/main/.tickets/216-cold-ci-identity-fixture.md)
are closed with numbered evidence. These source-version checks do not validate a
final 0.5.0 candidate or authorize publication.

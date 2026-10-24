# tkt Rust 1.80 release-audit evidence

Coverage: ✅ declared MSRV, locked dependency metadata, lockfile format; ⚠️ no Rust 1.80 compilation executed.

## Finding

[L1:verified] `Cargo.toml` declares `rust-version = "1.80"` and edition 2021. `Cargo.lock` uses format version 4. The locked normal dependency chain includes `clap 4.6.4 -> clap_builder 4.6.2 -> clap_lex 1.1.0`, and the derive feature brings `clap_derive 4.6.4`. Every one of these four cached crate manifests declares `rust-version = "1.85"` and `edition = "2024"`.

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

No CI dispatched, toolchain installed, build attempted, or source changed. Installed toolchains observed: stable, 1.90, 1.97.1; Rust 1.80 is absent. `git status --short` in tkt returned no changes after investigation.

Evidence: Python TOML inspection of every locally cached locked crate manifest → four Clap crates and getrandom require 1.85; `cargo tree --locked -i` → confirms normal/dev chains; official changelog read → lockfile v4 supported since 1.78; `rustup toolchain list` → 1.80 unavailable; `git status --short` → clean tkt tree.

---
id: "282"
title: "Record Windows Rust toolchain failure modes and repairs"
status: done
blocked_by: []
validation_criteria:
  - "gotchas doc covers rust-std-missing failure with symptom and repair"
  - "gotchas doc covers missing-default-toolchain and direct-cargo.exe trap"
  - "gotchas doc covers mise shim mise-x failure and locating the real binary"
  - "each entry states literal grep-able error text"
tags: ["stream:tooling", "type:chore"]
---
## What to build

Extend `docs/agents/windows-powershell-gotchas.md` with the Windows Rust
toolchain failure modes observed on 2026-11-08, each written as the symptom an
agent actually sees plus the repair.

**Observed this session:**

1. `cargo build` fails with `error[E0463]: can't find crate for 'core'` /
   "the `x86_64-pc-windows-msvc` target may not be installed" — the toolchain
   exists under `~/.rustup/toolchains/` but its `rust-std` component is missing
   (interrupted rustup install). Manifest list under `lib/rustlib/` shows only
   cargo/clippy/rustc/rustfmt, no `rust-std`. Repair:
   `rustup toolchain install <ver> --component rust-std` (idempotent).
2. Invoking a toolchain's real `cargo.exe` directly (bypassing the rustup proxy)
   fails with "no default toolchain configured" — set one:
   `rustup default <ver>`.
3. mise-generated shims (`~/.local/share/mise/shims` or
   `%LOCALAPPDATA%\mise\shims`) are bash/cmd stubs that exec `mise x -- <tool>`;
   when `mise.exe` itself is not on PATH the symptom is `command not found` even
   though the tool's binary is fine. The real binary lives under
   `%LOCALAPPDATA%\mise\installs\<tool>\<ver>\` — invoke it directly or repair
   the mise install.

**Smoke check after any rustup/mise change:** `rustup default <ver> &&
rustc --print sysroot` then a trivial `cargo build`.

## Acceptance criteria

- [x] Gotchas doc covers the rust-std-missing failure, its symptom, and its repair
- [x] Gotchas doc covers missing-default-toolchain and the direct-cargo.exe trap
- [x] Gotchas doc covers the mise shim `mise x` failure mode and how to find the real binary
- [x] Each entry states the literal error text an agent would grep for

## Resolution (2026-11-08)

done: windows-powershell-gotchas.md gains a Rust toolchain section covering the three observed failure modes with literal error text, repairs, and a smoke check

### Verification
1. ✓ gotchas doc covers rust-std-missing failure with symptom and repair — "E0463 can't-find-core entry documents symptom, rustlib manifest tell, and idempotent 'rustup toolchain install --component rust-std' repair"
2. ✓ gotchas doc covers missing-default-toolchain and direct-cargo.exe trap — "missing-default-toolchain and direct-cargo.exe entry documents the symptom and 'rustup default <ver>' repair"
3. ✓ gotchas doc covers mise shim mise-x failure and locating the real binary — "mise shim entry documents 'mise: not found' failure, the installs/<tool>/<ver> binary location, and mise repair path"
4. ✓ each entry states literal grep-able error text — "each entry quotes the literal error text (error[E0463], no default toolchain configured, command not found)"

---
id: "282"
title: "Record Windows Rust toolchain failure modes and repairs"
status: in_progress
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

- [ ] Gotchas doc covers the rust-std-missing failure, its symptom, and its repair
- [ ] Gotchas doc covers missing-default-toolchain and the direct-cargo.exe trap
- [ ] Gotchas doc covers the mise shim `mise x` failure mode and how to find the real binary
- [ ] Each entry states the literal error text an agent would grep for

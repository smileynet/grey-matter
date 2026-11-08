# Windows / PowerShell command gotchas

This repo is Windows-primary: it ships `scripts/install-skills.ps1` and the agent's shell
is PowerShell (`pwsh`). A handful of PowerShell/Windows traps recur across sessions and
each costs a failed command plus a retry. They're collected here once so they aren't
rediscovered every session.

The general rule still holds first: **for file operations, use the dedicated read/write/
edit/search tools, not shell commands.** This note is only the Windows/PowerShell deltas
for the cases where a shell command is genuinely the right tool (git, Node, tkt, builds).

## The traps

- **`Rename-Item -NewName` wants a leaf name, not a path.** Passing a path (even the same
  directory) throws. To move *and* rename across paths, use `Move-Item` with full source
  and destination paths instead:
  ```powershell
  Move-Item -Path .\old\name.md -Destination .\new\name.md
  ```

- **`;` runs the next command even after a failure.** Use it only between independent steps.
  Never chain a check to `git commit` or `git push` with `;` or through a pipe: a red check still
  pushed that way on 2026-10-22 and 2026-11-01. Run the check bare and chain with `&&` (pwsh 7+,
  no pipe in between), or check `$LASTEXITCODE` before committing.

- **No `%VAR%` environment syntax.** That's `cmd.exe`. In PowerShell an undefined
  `%TEMP%` becomes a *literal* folder name, silently creating junk. Use `$env:TEMP`,
  `$env:USERPROFILE`, etc.

- **Avoid multi-line here-strings / `echo >` to create files.** They're fragile when the
  agent emits them (quoting, newline handling). Use the dedicated write/edit tools, which
  is the standing rule anyway.

- **Quote paths with spaces.** Wrap any path that may contain a space in double quotes:
  `Get-Content "C:\Program Files\x\y.txt"`.

- **Globbing in `-Filter` / `-Path` takes one pattern, not an array.** `Get-ChildItem
  -Filter "a*","b*"` throws. Use `-Include` with `-Recurse`, or a `Where-Object` match on
  `$_.Name`.

## Bash under Git Bash / MSYS, and scripts generally

- **`IFS=$'\t' read` collapses consecutive tabs**, so empty fields vanish and later columns
  shift. Use a non-whitespace delimiter (`IFS='|'`, with `yq ... | join("|")` instead of `@tsv`).
- **uv-installed tool shims (`.exe`) can fail under Git Bash/MSYS** (the venv's site-packages
  doesn't resolve). Under `set -e`, guard `$(tool ...) || true`, fall back to
  `powershell.exe -NoProfile -Command`, and pipe through `tr -d '\r'`.
- **PowerShell output carries `\r`.** Strip it before comparing strings.
- **Compare Python paths to git output with `Path.as_posix()`**: git always prints `/`.
- **A pipe hides a gating command's failure.** `node scripts/gate.mjs pre-merge | tail -11 && git push`
  tests `tail`'s exit code, so a red check still pushes (it did, 2026-10-22). Run the gate bare
  under `set -e`, or redirect it to a file and grep the file after the exit code is known.
- **Edit code and data with Edit/Write, or a script file.** Backslashes, regexes, and template
  literals inside `node -e`, `python -`, or a heredoc get re-escaped: `"\b"` once landed in JSON as
  a backspace and `"\n"` as a real newline inside a regex. Write a `.mjs` to the scratchpad instead.
  On 2026-11-01 the same trap struck four times in one session: `"C:\Users"` was a Python
  unicode-escape error, nested backticks and quotes ended a heredoc early, and `json.dump`
  reformatted a hand-kept `scripts/gates.json`. To change one entry in a hand-formatted file,
  insert it as text or use Edit; never re-serialize the whole file.
- **Git Bash rewrites an argument that starts with `/` into a Windows path.** `kc.py get /api/chat/slots`
  reached Python as `C:/Program Files/Git/api/chat/slots`, and `kiro-cli chat /usage` reached the
  model as a prompt naming `C:/Program Files/Git/usage`, which spent a turn. Prefix the command with
  `MSYS_NO_PATHCONV=1`, or run it from PowerShell.
- **A scrub chained to a push needs its own exit test.** `grep -c pattern *.md | grep -v ":0" && git commit && git push`
  pushes when the scrub *failed*, because the grep that finds leftovers succeeds. Check that the count is
  zero first (`! grep -q pattern files && git commit`). `scripts/check-home-path.mjs`, a pre-push gate, now
  blocks this machine's home path in tracked files.

Each of these was low-severity (recovered in one retry) but cross-session and cheap to
document once.

## Rust toolchain breakage (rustup / mise)

Observed 2026-11-08 while refreshing the tkt CLI; each cost a diagnosis before the fix.

- **`error[E0463]: can't find crate for 'core'` / "the `x86_64-pc-windows-msvc` target may not
  be installed"** — the toolchain under `~/.rustup/toolchains/<ver>-x86_64-pc-windows-msvc`
  exists but its `rust-std` component is missing (an interrupted rustup install). Tell:
  `lib/rustlib/` lists manifests for cargo/clippy/rustc/rustfmt but no `rust-std`. Repair
  (idempotent): `rustup toolchain install <ver> --component rust-std`. The `help:` text's
  `rustup target add` suggestion does not fix this form.
- **Invoking a toolchain's real `cargo.exe` directly fails with "no default toolchain
  configured"** — the rustup proxies require a default; bypassing them (calling
  `~/.rustup/toolchains/<ver>/bin/cargo.exe` straight) or a missing default both produce it.
  Repair: `rustup default <ver>`, then prefer the proxy over the toolchain's real binaries.
- **mise shims fail with `command not found` (or "mise: not found") although the tool's
  binary is fine.** Shims in `%LOCALAPPDATA%\mise\shims` are stubs that exec `mise x -- <tool>`;
  when `mise.exe` itself is not on PATH every shimmed tool breaks at once. The real binaries
  live under `%LOCALAPPDATA%\mise\installs\<tool>\<ver>\` — invoke them directly to keep
  working, then repair the mise installation (reinstall/activate mise; verify in a fresh
  shell with `mise --version`).
- **Smoke check after any rustup/mise change:** `rustup default <ver> && rustc --print
  sysroot`, then a trivial `cargo build`. A toolchain that lists in `rustup toolchain list`
  can still be missing `rust-std`, so existence is not proof of compilability.

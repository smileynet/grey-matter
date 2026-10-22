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

- **Command separator is `;`, not `&&`.** PowerShell 7 does support `&&`, but `;` is the
  portable form here. Note `;` does not stop on failure the way `&&` does — if you need
  "stop on first error," chain with `&&` (pwsh 7+) or check `$LASTEXITCODE` between steps.

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
- **A pipe hides a gating command's failure.** `node scripts/check-repo.mjs | tail -11 && git push`
  tests `tail`'s exit code, so a red check still pushes (it did, 2026-10-22). Run the gate bare
  under `set -e`, or redirect it to a file and grep the file after the exit code is known.
- **Edit code and data with Edit/Write, or a script file.** Backslashes, regexes, and template
  literals inside `node -e`, `python -`, or a heredoc get re-escaped: `"\b"` once landed in JSON as
  a backspace and `"\n"` as a real newline inside a regex. Write a `.mjs` to the scratchpad instead.

Each of these was low-severity (recovered in one retry) but cross-session and cheap to
document once.

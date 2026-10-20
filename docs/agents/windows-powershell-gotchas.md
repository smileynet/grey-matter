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

Each of these was low-severity (recovered in one retry) but cross-session and cheap to
document once.

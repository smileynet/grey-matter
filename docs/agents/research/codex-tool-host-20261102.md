---
topic: Codex Windows CLI code-mode host resolution
date: 2026-11-02
status: complete
confidence: reproduced-and-session-remedy-verified
---

# Codex CLI code-mode host resolution on Windows

## Summary

The PATH-selected Bun executable is the official Codex 0.166.0 native binary, but
its required companion is missing from the directory where the process looks for
it. The same binary bytes are present in the installed `@openai/codex-win32-x64`
package beside the signed companion host. Running that package-owned executable
by absolute path in the same disposable fixture executed a harmless Git command.
This gives this session a same-version remedy without copying files, installing
anything, or changing global configuration.

The evidence isolates a path/layout difference rather than a binary-version
difference: the Bun executable and the package executable have the same SHA-256.
The separate app-managed CLI also worked, but reports `0.166.0-alpha.5.1`; it is
not needed to establish the remedy and cannot be used to attribute behavior to
the host alone.

## Observed executable ownership and layout

`Get-Command codex -All` listed the Bun `codex.exe`, `.cmd`, and extensionless
launcher first, followed by the app-managed CLI. `where.exe codex` resolves the
Bun location first. The selected native executable reports `codex-cli 0.166.0`.
Its SHA-256 is `9D563EE4E0441FF9D59D612013E0460DDF8E5709735C2D9F6B98B7EF8CA4EB42`.
There is no `codex-code-mode-host.exe` next to that executable.

The installed `@openai/codex` package metadata identifies version `0.166.0` and
declares `@openai/codex-win32-x64` version `0.166.0-win32-x64` as its Windows x64
optional dependency. In that package's vendor directory, `codex.exe` is 371,735,856
bytes and has the same SHA-256 as the Bun executable. `codex-code-mode-host.exe`
is present beside it (79,101,744 bytes). Both files have valid Authenticode
signatures from OpenAI OpCo, LLC, thumbprint
`DB0AA48794DC07B481F286EAD18ABC2CD17EDC22`.

The CLI is therefore not an unknown or guessed binary, and the remedy does not
depend on an app alpha build. The path-selected copy lacks the companion in its
expected sibling location, while the identical package-owned executable has that
companion beside it.

## Native reproduction and remedy

An owned fixture was created at `%TEMP%\\gm-t188-fixture` with the repository's
`scripts/spike-orchestrate-fixture.mjs` (`--variant trunk`, no remote). Free space
was checked before fixture creation: C: had about 174 GB free and D: about 98 GB.
The command was `git -c core.excludesFile=<fixture>/.gitignore status --short`;
it avoids reading the user's global Git ignore file. The exact command was run
through Codex `exec --ephemeral --sandbox read-only --json` in the fixture.

| Executable invocation | Version / identity | Native command result | Classification |
| --- | --- | --- | --- |
| PATH-selected `%USERPROFILE%\\.bun\\bin\\codex.exe` | 0.166.0; SHA-256 above | Error names `%USERPROFILE%\\.bun\\bin\\codex-code-mode-host.exe` and Windows OS error 2; shell command did not execute. | Reproduced infrastructure failure; CLI process exit 0 is not a pass. |
| `@openai/codex-win32-x64/vendor/x86_64-pc-windows-msvc/bin/codex.exe` | 0.166.0; identical SHA-256; companion colocated | Shell command executed, exit 0, exact stdout and stderr empty. | Pass for this harmless command and session-scoped executable path. |
| App-managed `.../Codex/bin/22cfb1d302613eae/codex.exe` | 0.166.0-alpha.5.1; OpenAI-signed executable and colocated signed host | Shell command executed, exit 0, output empty when using fixture `.gitignore`; an earlier attempt emitted global-ignore permission warnings, then a corrected probe succeeded. | Observed working, but different alpha version; not used for causal isolation. |

The sanitized raw event excerpts and exact package metadata are in
[`evidence/codex-tool-host-20261102.json`](./evidence/codex-tool-host-20261102.json).

## Supported scope and limits

OpenAI's [Windows deployment guidance](https://learn.chatgpt.com/docs/enterprise/windows-deployment)
(current page, accessed 2026-11-02) says: “Keep the standalone runtime files
together; copying only `codex.exe` is not a complete standalone package.” It also
states, “The desktop app and standalone CLI use different installation contexts.”
These instructions align with the local package layout. The app-managed versus
standalone version distinction is explicit in the observations above.

For the current process/session, invoking the installed platform package's
`vendor/x86_64-pc-windows-msvc/bin/codex.exe` by absolute path is verified. This
is an observed remedy using the package's own executable and companion; no
installer or copy was used. The deployment page does not document this exact
internal vendor path as a user-facing launcher contract, so permanence across
package upgrades is unverified. For a durable installation repair, use the
documented standalone installation/update route and preserve its complete
runtime layout, then verify the installed executable and companion together.
No installation repair was attempted in this diagnosis.

The test verifies only one harmless shell execution. It does not verify approvals,
write access, broader tool behavior, or that future package updates retain this
path. Existing #162 evidence independently reproduces the original host failure;
this report adds an exact current reproduction and same-version remedy.

## Artifact disposition

The fixture and native JSONL captures were retained under the worker's ignored
`.scratch/t188-*` paths through independent review. No Codex configuration,
PATH, global Git configuration, or installation was changed. No binary was
copied or downloaded. After critic review, the parent can remove the fixture and
raw captures; the committed sanitized receipt remains the evidence record.

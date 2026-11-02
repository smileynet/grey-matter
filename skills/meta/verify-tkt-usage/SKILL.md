---
name: verify-tkt-usage
description: "Validate tkt skill-pack commands against the installed CLI before deploying the pack, or after a CLI upgrade; report unsupported commands and flags with the exact CLI and pack identities."
---

# Verify tkt Usage

grey-matter skills are allowed to inline tkt **commands** (`tkt new`, `tkt close --check-all`,
`tkt ready`, ...), the wrap-don't-copy rule applies to tkt's *skills*, not its command
surface. The cost of inlining is **drift**: when tkt renames a subcommand, drops a flag, or
changes an enum, the inlined usage silently goes wrong. Run this check before deploying the
tkt skill pack, even when the installed CLI version has not changed. A checkout can advance
while the CLI stays on an older release.

## The source of truth

`tkt capabilities -o json` is tkt's machine-readable feature manifest: every command with a
description, its effects, and a **JSON Schema of its inputs** (flag names, enums, required
fields). Validate against *that* (and the installed `tkt --version`), never against memory
of how tkt used to work.

```bash
tkt --version
tkt capabilities -o json   # commands{} with inputSchema{} per command
```

**The manifest can be present but partial.** At some versions `tkt capabilities`
under-reports: it has omitted real flags (e.g. `--tags`, `--vc`/`--validation`, `--requires`
on `new`) and whole commands (e.g. `context`, `blocked`, `audit`) that `tkt <cmd> --help`
lists. So the manifest proves a command/flag *exists*, but its **absence from the manifest
does not prove the command/flag is gone**. Whenever a referenced command or flag is missing
from the manifest, **confirm against `tkt <cmd> --help` before flagging drift**, help is the
tiebreaker. Only report drift when a command/flag is absent from *both* the manifest and
`--help`.

## Process

1. **Bind the check to its inputs.** Resolve the tkt pack from `skill-packs.json` and the
   native installed CLI executable (for example, `Get-Command tkt -All` on Windows and
   `command -v tkt` on POSIX; use the executable path, not a shell shim). Run:

   ```bash
   node scripts/verify-tkt-usage.mjs --pack /path/to/tkt --tkt /path/to/tkt-executable
   ```

   The report records `tkt --version` including its build hash, executable path and SHA-256,
   pack `HEAD`, the extracted command and flag set, working directory, and a SHA-256 of the
   environment passed to tkt. It stores only these identities and the result in an ignored
   repo-local cache; environment values are never written. The tool
   probes version and capabilities on every run. It reuses help results only when executable
   identity, version/build, capabilities, pack commit, command set, working directory and
   environment hash all match. A changed identity reruns the help checks.

2. **Check the actual CLI.** The tool compares extracted invocations with
   `tkt capabilities -o json`, then uses root or command `--help` as the tiebreaker when the
   manifest is missing a command or flag. A command or flag absent from both is a finding.
   Read the report and manually include named command/flag prose that is not written as an
   invocation; the tool captures explicit global-flag mentions too.

3. **Collect the remaining tkt usage.** Grep the skills and the tkt conventions doc for
   invocations, the places that inline the command surface:
   - `skills/**/SKILL.md` and any skill `references/*` (including `release.sh`-style
     scripts),
   - `docs/agents/tkt-conventions.md`.
   Pull each `tkt <subcommand> ...` invocation and the flags it uses (`--check-all`,
   `--vc`, `--blocked-by`, `--tags`, `--priority`, `--status`, `--resolution`,
   `--evidence`, `-o json`, ...). Note prose that *names* a command/flag too, but weight
   actual invocations higher.

4. **Review usage against the manifest (with a `--help` tiebreaker).** For each referenced
   command:
   - **Command missing** from `capabilities` -> check `tkt <cmd> --help`. Still missing ->
     renamed or removed upstream; flag it. Present in help -> the manifest is partial, not
     drift.
   - **Flag not in the command's inputSchema** -> check `tkt <cmd> --help`. Still absent ->
     renamed/dropped; flag it with the current flags. Present in help -> manifest is partial
     (this is common for `--tags`/`--vc`), not drift.
   - **Enum value no longer valid** (e.g. a `priority`/`status` value that changed) ->
     flag it with the current allowed set (enums in the manifest are reliable where
     present; confirm against `--help` if the whole command was manifest-partial).
   - **Required field we never pass** -> flag as a latent failure.
   Anything that matches the manifest (or `--help`) is fine, say so briefly; don't list
   every clean hit.

5. **Report, most-severe-first.** Present a table: skill/file -> command -> the drift ->
   the current correct form from the manifest. A removed command or wrong required field is
   a blocker; a renamed optional flag is a should-fix.

6. **Optionally file findings as tickets.** By default, present the report and stop. If the
   user wants the drift tracked, file each actionable finding as a tkt ticket with the
   file, the stale usage, and the corrected form as context. **Dedupe first** (`tkt
   query`): extend an existing drift ticket rather than file a near-duplicate.
## Notes

- This is a mechanical check. The report identifies the CLI, executable and pack revision it
  checked; named prose that is not an invocation still needs review.
- Run it before deploying a tkt skill pack, after a tkt upgrade, and when the pack commit or
  referenced commands change. It reads only; it changes no skill, it reports.
- If `tkt capabilities` is unavailable or invalid, the tool marks capability data unavailable
  and checks commands through help. A partial manifest is normal; help is the tiebreaker.
- The helper cache is local and disposable; a missing or malformed cache causes a fresh audit.
## It's working if

- Every tkt command and flag the skills inline exists in the live CLI help output.
- Before pack deployment, this reports unsupported usage and the exact identities checked.
- A cached result is reused only for the identical CLI, pack commit, command set, working
  directory and environment.

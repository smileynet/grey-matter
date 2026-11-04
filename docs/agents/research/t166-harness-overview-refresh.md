# Harness overview refresh: ticket 166

Observed on 2026-11-04 in the managed Windows checkout. The overview now states the current
local versions for Codex, Claude Code, and Crush; records Kiro's live version/manifest mismatch;
and labels Agy's manifest value as last-recorded because its execution hold remains active.

## Version and executable observations

| Harness | Command output | Current executable path (portable) | Manifest comparison |
| --- | --- | --- | --- |
| Codex | `codex-cli 0.166.0` | `~/.bun/bin/codex.exe` | `versions.json` records 0.166.0; its first probe candidate is the vendored package binary, while PATH resolved to this file. Package-managed versus copied provenance is unknown. |
| Claude Code | `2.1.316 (Claude Code)` | `~/.local/bin/claude.exe` | Matches 2.1.316. |
| Kiro CLI | `kiro-cli 2.37.1` | `%LOCALAPPDATA%/Kiro-Cli/kiro-cli.exe` | Installed version is 2.37.1; `versions.json` still records 2.37.0 from 2026-11-01. The overview calls out this gap; the manifest/reference baseline was not rewritten from a version-only probe. |
| Agy | Not run | Not probed | 1.4.12 is the manifest's last-recorded value (2026-11-01), not a current observation. Execution hold respected. |
| Crush | `crush version v0.93.1` | `%LOCALAPPDATA%/Microsoft/WinGet/Links/crush.exe` | Matches 0.93.1. |

## Example qualification

The changed harness examples were qualified only through no-model help commands. No prompt,
agent, review, or native model invocation was started.

| Command | Outcome |
| --- | --- |
| `codex exec --help` | Exit 0; help printed sandbox options, including `read-only`. |
| `claude.exe --help` | Exit 0; help printed `--print` and `--allowedTools`. |
| `claude.exe plugin --help` | Exit 0; help printed the `details` subcommand used by the local component-listing example. |
| `kiro-cli chat --help` | Exit 0; help printed `--no-interactive` and scoped `--trust-tools`. Existing profile settings may already approve tools; no runtime permission behavior was inferred. |
| `crush run --help` | Exit 0; help printed `--cwd`, `--quiet`, and `--yolo` was absent. |

Raw output hashes were returned in the worker dispatch packet. Agy help and version commands
were not run.
These checks qualify command grammar only; they do not establish skill discovery or runtime
behavior. The Kiro reference's 2.37.0 grammar and hashes were not refreshed against 2.37.1.

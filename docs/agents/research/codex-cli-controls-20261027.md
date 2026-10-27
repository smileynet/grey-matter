# Codex CLI arguments and controls for headless critics (2026-10-27)

Question: what does the Codex CLI offer for running a review critic non-interactively, pinned to a
model, with enforced read-only access, and why does its sandbox fail on randomserver? Evidence:
`codex --help`, `codex exec --help`, `codex features list`, `codex doctor` and short local probes on
Codex 0.164.0 (Ubuntu 24.04, kernel 7.0.0-34), plus the official documentation,
[CLI reference](https://learn.chatgpt.com/docs/cli/reference),
[sandboxing](https://learn.chatgpt.com/docs/sandboxing) and
[config basics](https://learn.chatgpt.com/docs/config-file/config-basic). Search results from
third-party sites and GitHub issues are marked as such.

## Flags that matter for a critic (`codex exec`)

| Flag | What it does | Use for a critic |
| --- | --- | --- |
| `-m, --model` | Model for the run | Pin the critic model |
| `-c key=value` | Override any config key (TOML) | `model_reasoning_effort=high`, feature flags |
| `-s, --sandbox read-only\|workspace-write\|danger-full-access` | Sandbox for model-run shell commands. Official: read-only "can inspect files, but it can't edit files or run commands without approval" | The intended read-only control; blocked on this host (below) |
| `--dangerously-bypass-approvals-and-sandbox` (`--yolo`) | No approvals, no sandbox. Official: "only use inside an externally hardened environment" | The owner's current choice; read-only then rests on the prompt |
| `--approve-for-me` | Automatic approval review with `on-request` and the `workspace-write` sandbox; conflicts with `-s` and `--yolo` | Not read-only |
| `-C, --cd` | Workspace root for the run | Point at a throwaway directory |
| `--add-dir` | Extra writable directories | Avoid for critics |
| `--worktree` | Run in a new managed Git worktree; cannot combine with `--ephemeral`, `resume`, `review` or `--ignore-user-config` | Contains relative-path writes (partial) |
| `--ephemeral` | Do not write the rollout file | Loses the model record the probe reads; do not use when the record is needed |
| `--ignore-user-config` | Skip `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME` | Isolation from the user's config |
| `--ignore-rules` | Skip user and project execpolicy `.rules` files | Isolation from command rules |
| `-p, --profile` | Layer `$CODEX_HOME/<name>.config.toml` over the base config | A `critic` profile carrying model, effort and settings |
| `--output-schema FILE` | JSON Schema for the final message | Structured findings (verified earlier) |
| `-o, --output-last-message FILE` | Write the last message to a file | Simple parsing |
| `--json` | JSONL events on stdout | Evidence and tool-call audit |
| `--enable` / `--disable FEATURE` | `-c features.<name>=true/false` | Remove tools (see below) |
| `--strict-config` | Error on unknown config keys | Catches a typo in a critic profile |
| `--skip-git-repo-check` | Run outside a repo | Throwaway directories |
| `--dangerously-bypass-hook-trust` | Run enabled hooks without persisted trust | Avoid |
| `codex review [--uncommitted \| --base \| --commit]` | Built-in non-interactive code review | Not tested; may suit code, not dashboards |
| `codex sandbox [-c ...] -- CMD` | Run a command inside the Linux sandbox | The cheapest sandbox test |
| `codex debug models` / `prompt-input` | Dump the model catalog / the model-visible prompt input | Offline checks of catalog and instructions |
| `codex doctor` | Environment health report | Includes OS and install facts |

Config and docs: `model`, `model_reasoning_effort`, `approval_policy` (`on-request` or `never` for
automation), `sandbox_mode`, `[permissions.<name>]` custom profiles with built-ins `:read-only`,
`:workspace` and `:danger-full-access`, `[agents]` (`default_subagent_model`,
`default_subagent_reasoning_effort`), and `[shell_environment_policy]` (controls which environment
variables spawned commands see; the default `ignore_default_excludes = true` disables filtering of
names containing KEY, SECRET or TOKEN). Project `.codex/` layers load only for trusted projects.
The config page does not cover `[sandbox_workspace_write]`, `.rules` format, `CODEX_HOME` or how to
disable AGENTS.md.

## Why the sandbox fails here

- **Cause.** Ubuntu 24.04 sets `kernel.apparmor_restrict_unprivileged_userns = 1` (confirmed here).
  Codex's Linux sandbox uses bubblewrap, which needs an unprivileged user namespace; bubblewrap's
  loopback setup then fails with `RTM_NEWADDR: Operation not permitted`. Reproduced with
  `codex sandbox -- /bin/true`. A system `bwrap` exists at `/usr/bin/bwrap`; Codex also bundles a
  helper in `codex-resources/bwrap`. Official docs: Codex "uses the first bwrap executable it finds
  on PATH" and otherwise a bundled helper that "requires support for unprivileged user namespace
  creation".
- **Official fix (Ubuntu 24.04).** Install `apparmor-profiles` and `apparmor-utils`, copy the
  `bwrap-userns-restrict` profile to `/etc/apparmor.d/`, run `apparmor_parser -r` on it (no reboot).
  Last resort per the docs: `sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0`, which
  switches off a system-wide hardening measure. Neither can be done by me: `sudo` needs a password,
  and `/usr/share/apparmor/extra-profiles` does not exist here (the package is not installed).
  Third-party reports (GitHub issues 14919, 15057, 17337, 29908) say the profile may not cover
  Codex's bundled bwrap path and that results vary by version; treat as unverified.
- **The Landlock fallback is gone.** `use_legacy_landlock` is listed as deprecated and, set to true,
  `codex sandbox` now stops with "filesystem-restricted execution requires bubblewrap to isolate
  app-server sockets". Do not rely on it.

## Findings from local probes

1. With `--dangerously-bypass-approvals-and-sandbox` a critic reads files with `rg` and can write
   them. It refused to write when its prompt said it was a read-only reviewer.
2. **Disabling the shell tool does not make a critic read-only.** With
   `--disable shell_tool --disable unified_exec` the critic could no longer read a file (it said
   CANNOT), but asked to create a file it did, as a `file_change` event, through its patch tool,
   which has no feature flag.
3. The tool surface is what the model is offered, so a read-only critic by tool removal would need a
   way to disable the patch tool too. None was found in `codex features list`.

## Open questions this research could not settle

- Whether `-c` can disable the patch tool (older Codex had `include_apply_patch_tool`; not tested).
- Whether `codex debug prompt-input` lists tools as well as instructions, which would make tool
  surfaces checkable without a model call.
- Whether the system or the bundled bwrap runs under `-s read-only`, and which one an AppArmor profile
  would have to cover.
- How refresh-token rotation behaves when two places share a login (the spike hit "refresh token was
  already used" once); a containerised Codex needs a plan for credentials.

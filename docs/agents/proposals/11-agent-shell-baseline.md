# Proposal 11: a known shell for Claude Code's Bash tool on every machine

**Status:** accepted and implemented 2026-10-25: the "Bash tool shell" bullet in
[harnesses](../harnesses.md), `scripts/probe-agent-shell.mjs` (tests: `check-repo` invariant 14),
and a probe step in `sync`. **Scope:** grey-matter guidance and `sync`; every machine that runs
Claude Code with grey-matter.

Claude Code's Bash tool runs the user's login shell, not bash. On macOS that's zsh with the
user's interactive config captured into it. One machine-level setting makes the agent's shell
match the bash its commands are written for. This proposal records that setting once, and has
`sync` check every machine for it, so each machine doesn't have to rediscover it.

## Evidence: one local-first session (2026-10-25)

About 250 Bash calls in zsh produced these recurring failures, each a wasted call plus a retry:

| Trap | Cause | Hits |
|---|---|---|
| `echo ====` → `==== not found` | zsh `=cmd` expansion | 7 |
| `set -- $p`, `${6:+--flag $6}` passed one argument | zsh doesn't word-split `$var` | 2 (a silent wrong edit: `tkt edit --priority` got no value) |
| `--include=*.md` → `no matches found` | zsh `NOMATCH` | 7 |
| `ls -t` → eza error; `cat` = bat; `du`/`df` = dust/duf | user aliases captured into the agent shell | several |
| `> existing-file` → `file exists` | `noclobber` captured from the user's options | latent |

Mechanism (first-party): at session start Claude Code "sources `~/.zshrc`, `~/.bashrc`, or
`~/.profile` depending on your shell, captures the resulting aliases, functions, and shell
options, and applies them to every Bash command"
([tools reference](https://code.claude.com/docs/en/tools-reference)). It picks the shell from
`$SHELL` unless `CLAUDE_CODE_SHELL` names "a path to a `bash` or `zsh` binary". It ignores an
invalid value and falls back to auto-detection
([env vars](https://code.claude.com/docs/en/env-vars)). Many user reports document the same
capture breaking zsh setups
([#9633](https://claudeissues.com/issue/9633-bug-shell-snapshots-capture-interactive-functions-without-dependencies-breaking),
[#38197](https://claudeissues.com/issue/38197-shell-snapshot-incorrectly-serializes-zsh-alias-syntax-for-bash-replay),
[#46856](https://claudeissues.com/issue/46856-shell-snapshot-includes-unresolvable-zsh-autoload-stubs-breaking-system-commands),
[#52521](https://claudeissues.com/issue/52521-rename-bash-tool-it-actually-runs-the-users-login-shell-zsh-on-macos-not-bash)).

The fix, verified on this machine after a restart, from the desktop app:

In `~/.claude/settings.json`:

```json
"env": { "CLAUDE_CODE_SHELL": "/opt/homebrew/bin/bash" }
```

`$BASH_VERSION` became `5.3.20(1)-release`, `ls`/`cat`/`du`/`df` became the system binaries,
`noclobber` was off, `echo ====` printed, and `set -- $p` split into two arguments. The user's
terminal stayed on zsh with its aliases intact.

### Alternatives rejected

- **Steering in `CLAUDE.md`** ("quote globs, use `${=var}`…"): costs context every turn and
  still relies on the agent following it. Rejected as the primary fix.
- **Guarding aliases on `$CLAUDECODE` in `.zshrc`** (prior art: a
  [NixOS patch](https://gitea.hillion.co.uk/JakeHillion/nixos/pulls/1157.patch) strips zoxide's
  `cd` that way): fixes the aliases but not zsh semantics, needs an edit per dotfile setup, and
  agent permission classifiers block profile edits.

## The baseline (what every machine should have)

1. **Shell:** `CLAUDE_CODE_SHELL` set to a **bash ≥ 4** (bash 5.x preferred) in the `env` block
   of `~/.claude/settings.json`.
   - macOS (Apple Silicon): `/opt/homebrew/bin/bash`; macOS (Intel): `/usr/local/bin/bash`.
     Never use `/bin/bash`: it's 3.2, without `declare -A`, `mapfile`, `globstar` or `${x,,}`.
     Never use a versioned `Cellar/bash/<ver>/` path: `brew upgrade` deletes old versions and
     Claude silently falls back to zsh.
   - Linux: `/usr/bin/bash` (already bash 5). Needed only if the login shell isn't bash.
   - Windows: not applicable (Git Bash / the PowerShell tool;
     [windows-powershell-gotchas](../windows-powershell-gotchas.md)).
2. **Homebrew bash installed on request:** `brew tab --installed-on-request bash`. On the
   reference machine it came in only as a dependency of direnv, so `brew autoremove` could
   remove it and Claude would silently fall back to zsh.
3. **Verify after a restart:** `echo "$BASH_VERSION"; type ls`. An empty version means the
   setting didn't reach the Bash tool. Reports say `env.PATH` from `settings.json` is ignored
   from the desktop app ([#42513](https://claudeissues.com/issue/42513-env-path-in-settings-json-not-applied-when-launching-from-desktop-app));
   `CLAUDE_CODE_SHELL` was honoured there on 2.1.308.

What stays true in bash: Claude Code shadows `grep` and `find` with its embedded ugrep/bfs
(observed in the shell snapshot, `# Shadow find/grep with embedded bfs/ugrep`). That's
Claude-only, so it belongs in the Claude section of `harnesses.md`, not in the cross-harness
`global/AGENTS.md`.

## Changes proposed

1. **`docs/agents/harnesses.md`, Claude Code section:** add a "Bash tool shell" bullet with the
   mechanism, the baseline above, the verify command and the grep/find shadowing. This is the
   single source of truth; everything else points here.
2. **`scripts/probe-agent-shell.mjs` (new, report-only; a `probe-` not a `check-` name, because
   `check-*.mjs` is reserved for repo invariants that `check-repo` runs):** reads
   `~/.claude/settings.json` and reports `ok` / `missing` / `bad path` / `bash < 4` /
   `Cellar path` / `brew bash is a dependency only`. It writes nothing: the user owns
   `settings.json`, and `sync` "reports findings, doesn't gate". An `--apply` flag adds the
   `env` key behind explicit approval, preserving other keys (precedent: the ownership-guarded
   installers). It gets tests like `install-agents-md.test.mjs`, which use temp targets and
   never touch real files.
3. **`skills/meta/sync/SKILL.md`:** add one step, "Agent shell: run
   `node scripts/probe-agent-shell.mjs`; surface anything other than `ok` as a follow-up with
   the exact fix." Every machine that syncs grey-matter is then checked, which covers "all
   instances" without a new skill.
4. **`init-project` / `adopt-project`:** nothing. This is per machine, not per repo.

## Found on the reference machine, to decide separately

- `install-agents-md.mjs list` reports `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` and
  `~/.config/opencode/AGENTS.md` as **foreign**, and Kiro's as absent. So `global/AGENTS.md`'s
  standing rules are installed in no harness on this machine. `~/.claude/CLAUDE.md` currently
  holds a hand-written one-line grep/find note (written during this session). Change 1 makes
  that note redundant, so it can be deleted and `install-agents-md.mjs` run. The other foreign
  files may be the user's own, so they need a look before `--force`.
- Codex and OpenCode run shell commands through their own mechanisms. Whether they capture zsh
  config the same way is unverified; probe before extending the baseline to them.

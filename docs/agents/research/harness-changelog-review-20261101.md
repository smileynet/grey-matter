# Harness changelog review: first baseline (2026-11-01)

**What this is:** the first run of the [harness-changelog](../../../skills/meta/harness-changelog/SKILL.md) skill. No earlier baseline existed, so this review compares the freshly recorded baseline in [`versions.json`](../harness-surfaces/versions.json) with the versions and facts [`harnesses.md`](../harnesses.md) still documents. Every finding below is observed on this machine (**L**) unless marked.

## Detect

```
node skills/meta/harness-changelog/scripts/harness-versions.mjs --update   # first run: 11 x new
node skills/meta/harness-changelog/scripts/harness-versions.mjs            # second run: 11 x unchanged, exit 0
```

| Harness | Surface | Baseline version | harnesses.md says | Moved since |
|---|---|---|---|---|
| claude-code | CLI | 2.1.316 | probed 2.1.303; plugin verification on 2.1.310 | 2.1.303 |
| claude-desktop | GUI (MSIX) | 4.4212.0.0 | not tracked | n/a |
| codex | CLI | 0.166.0 | probed 0.163.0, "a `.ps1` shim via fnm" | 0.163.0 |
| codex-desktop | GUI (MSIX) | 26.1027.3384.0 | not tracked | n/a |
| kiro-cli | CLI | 2.37.0 | probed 2.31.0 | 2.31.0 |
| kiro-ide | GUI | 1.3.11 | not tracked | n/a |
| agy | CLI | 1.4.12 | 1.1.14 to 1.4.5 across sections | 1.4.5 |
| antigravity-ide | GUI | 2.5.5 (`ideVersion`; product 1.107.0) | not tracked | n/a |
| kiro-crew | CLI | 0.11.1 | not tracked | n/a |
| crush | CLI | 0.93.1 | "not installed" (user-level rules table) | n/a |
| opencode | CLI | 1.18.21 | probed 1.18.21 | none |

The Antigravity 2.0 app (2.28.2) and the Kiro Crew desktop app are not in the manifest: their versions live inside `app.asar`, with no readable file or command. Kiro Crew's CLI version tracks the desktop app.

## Changes and proposals

| # | Change | Class | Evidence | Affected | Proposal |
|---|---|---|---|---|---|
| 1 | The codex install is now bun, not fnm; the bun shim `~/.bun/bin/codex.exe` works again (a full copy of the binary) | Changed behaviour | L: [codex.md](../harness-surfaces/codex.md) | `harnesses.md` codex section | Edit: replace the fnm `.ps1` note with the bun install and the vendored path |
| 2 | Bare `claude` in Git Bash is a zsh wrapper that fails (`/usr/bin/env: 'zsh'`); `claude.exe` works | Changed behaviour | L: [claude-code.md](../harness-surfaces/claude-code.md) | `harnesses.md` Claude test command; any script calling `claude` from bash | Edit: name `claude.exe` in bash examples |
| 3 | `codex mcp-server` is gone in 0.166 (replaced by `app-server`); `codex exec` rejects `-a` and `--search`; `--full-auto` is rejected | Removed | L: codex.md | Any doc or script using those | Grep and fix; none found in skills at review time |
| 4 | kiro.dev's CLI page lists `translate`, `theme`, `integrations`, `inline` and `doctor`, which 2.37.0 rejects; it omits `acp`, `serve` and `--output-format` | Docs drift | L vs D: [kiro.md](../harness-surfaces/kiro.md) | `harnesses.md` kiro section | Edit: version bump, and point to kiro.md for flags |
| 5 | Kiro Crew 0.11.1 refuses every agent on Windows unless `agent.sandbox_allow_unsandboxed_exec` is `true`; `agent.session_control` stored `false` blocks dispatch | Security / permission | L: [primitives](./harness-orchestration-primitives.md#spike-results-kiro-crew-2026-11-01) | Orchestrate skill's Kiro Crew reference (ticket 111) | Carry into ticket 111's reference |
| 6 | agy `--mode auto` is account-gated, not OS-gated (docs now allow Windows 11 24H2+ for personal accounts) | Changed behaviour | D: [antigravity.md](../harness-surfaces/antigravity.md) | primitives note | Done in this review |
| 7 | Crush is installed (0.93.1); its server subcommand is `crush server`, not the README's `crush serve` | New / docs drift | L: [crush-opencode.md](../harness-surfaces/crush-opencode.md) | `harnesses.md` user-level rules table | Edit: mark installed, rules path still unverified |
| 8 | agy and OpenCode print `--help` on stderr | Changed behaviour | L | Help-hash recipe | Done: the README recipe now captures `2>&1` |

**Proposal summary:** items 1, 2, 4 and 7 are one `harnesses.md` refresh, filed as a ticket rather than edited here, because `harnesses.md` drives deploy and test commands and deserves its own verified pass. Item 3 needs a grep across skills and scripts when that ticket runs. Items 6 and 8 were applied during the review. Item 5 belongs to ticket 111.

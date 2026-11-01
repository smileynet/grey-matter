# Harness surfaces: CLI, TUI and GUI reference

One file per harness. Each one separates what the harness can do in each **surface**, and records its command-line grammar from the installed binary, so a future agent can call a flag without rediscovering it. For deployment and testing of skills, see [harnesses.md](../harnesses.md); for orchestration behaviour, see [harness-orchestration-primitives](../research/harness-orchestration-primitives.md).

| Harness | File | Surfaces covered |
|---|---|---|
| Claude Code | [claude-code.md](./claude-code.md) | CLI, TUI, desktop app, IDE extensions |
| Codex | [codex.md](./codex.md) | CLI, TUI, desktop app, IDE extension, cloud |
| Kiro | [kiro.md](./kiro.md) | kiro-cli CLI and TUI, Kiro IDE |
| Antigravity | [antigravity.md](./antigravity.md) | agy CLI and TUI, Antigravity app, Antigravity IDE |
| Kiro Crew | [kiro-crew.md](./kiro-crew.md) | `kirocrew` CLI, gateway HTTP API, desktop app and web dashboard |
| Crush and OpenCode | [crush-opencode.md](./crush-opencode.md) | CLI and TUI |

## Grammar

### Terms

- **Harness**: one agent product family, such as Claude Code or Codex. A harness can ship several programs.
- **Surface**: one way a person or agent drives a harness. Exactly one of:
  - **CLI**: a single non-interactive invocation from a shell, controlled by subcommands and flags, which exits when done (`claude -p`, `codex exec`, `agy -p`).
  - **TUI**: the interactive terminal interface the same binary opens when run without a one-shot mode.
  - **GUI**: a graphical program: a desktop app, an IDE or IDE extension, or a web dashboard. Name which one.
  - **API**: a programmatic interface that isn't a shell command, such as an HTTP gateway, an SDK or an ACP/stdio server.
- **Headless**: a CLI run in which nobody can answer a prompt. Approvals must be settled in advance, or they fail.
- **Subcommand**: a word after the binary that selects an action (`codex exec`, `kiro-cli settings`).
- **Flag**: a `-x` or `--long` option on a binary or subcommand. **Global** flags apply before or across subcommands.
- **Setting**: a persistent key in a config file, given as `file` + `key.path`.
- **Environment variable**: a variable the harness reads at start.
- **In-session command**: a command typed inside a running session, usually `/name` (slash command), on whichever surfaces accept it.
- **Keybinding**: a key chord in a TUI or GUI.
- **Feature**: a user-visible capability (sub-agents, worktrees, approvals, and so on), which may be reachable by several of the above on several surfaces.

### Invocation notation

```
binary [global-flags] <subcommand> [flags] [args]
```

- `<x>` is required; `[x]` is optional; `a|b` is a choice; `x...` repeats.
- A flag is written as the binary prints it: `-p`, `--print`, `--model <model>`. Write `--flag <value>` for a flag that takes a value, and note when `--flag=value` is the only accepted form.
- Copy flag and subcommand names exactly as the installed `--help` prints them. Never paraphrase a flag.

### Availability marks

| Mark | Meaning |
|---|---|
| ✓ | Available on this surface |
| ✗ | Not available on this surface |
| ~ | Partial or different behaviour (say how in the notes) |
| ? | Not verified |

### Evidence marks

| Mark | Meaning |
|---|---|
| **L** | Seen in the local install: the command that showed it is named |
| **D** | Documented only: the URL is named |
| **I** | Inferred: say from what |

Observed beats documented. When the docs and the local install disagree, record both and trust the install.

### Version stamp

Each file opens with a versions table: surface, program, version, how the version was read, and the **help hash**. The help hash is the first 12 hex characters of the SHA-256 of the top-level `--help` output, with line endings normalized to LF. A changed hash means the CLI surface changed since the file was written.

```
<binary> --help 2>&1 | tr -d '\r' | sha256sum | cut -c1-12
```

- Capture stderr too: agy prints its help there, and without `2>&1` every agy hash is the empty-input hash `e3b0c44298fc`.
- `e3b0c44298fc` always means the command printed nothing. Treat it as a failed read, not a version.
- Some help output embeds per-user values: Crush prints a named-pipe path containing the Windows user SID. Such a hash differs on another account. Say so in the versions table.

## File template

1. **Versions**: the table above, plus the date gathered.
2. **Surfaces**: one short paragraph per surface: what it is, how it's launched, and where its config lives.
3. **Feature-to-surface matrix**: feature | CLI | TUI | GUI | API | evidence. Cover at least: one-shot prompt, structured output, model selection, approvals and permission modes, sandboxing, sub-agents, worktrees, background or parallel sessions, session resume, hooks, MCP, skills or plugins, notifications, remote or cloud runs.
4. **CLI reference**: every subcommand and every flag the installed binary prints, grouped by subcommand, in the notation above, with a one-line meaning. Mark hidden or undocumented flags.
5. **In-session commands**: the slash commands, with the surfaces that accept each.
6. **Settings and environment**: config file paths, plus the keys and variables an orchestrating agent is most likely to need.
7. **Couldn't verify**.

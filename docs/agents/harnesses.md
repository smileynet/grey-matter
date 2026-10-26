# Harnesses: deploying and testing skills

The operational reference for each agent harness grey-matter targets: where it reads
skills from, how to install into it, and how to drive it to test a skill. The dated
findings behind this live in [`research/harness-behavior-probes.md`](./research/harness-behavior-probes.md);
this doc is the current how-to.

All harnesses below support the **Agent Skills** `SKILL.md` standard natively, so our
skills deploy **unchanged**, no conversion, no MCP wrapping. Skills install into a **scan
root** (user-level, per harness) or a **project root** (`.agents/skills/` is shared), or
come from a plugin. Use `scripts/deploy.mjs` (see the repo README). Its harness table records
which roots each harness reads. Keep that table in step with the per-harness notes below:
"reads" there are verified; a claimed read is marked `claimed` and never counted as a copy.

## Per-harness reference

Tier reflects the project's priority: primary (kiro-cli), secondary (codex), ancillary
(the rest).

### kiro-cli (primary)

- Binary `kiro-cli`, probed 2.31.0. Skills exposed via the Skill tool.
- **User root**: `~/.kiro/skills/`. **Install**: `node scripts/deploy.mjs` (it is
  in the harness table) or `--root ~/.kiro/skills`.
- **Test (non-interactive)**: `kiro-cli chat --no-interactive --trust-all-tools "<prompt>"`.
- **Invocation filter**: consistent with honoring `disable-model-invocation` (not cleanly
  isolated; see codex for the clean case).
- **Agent-config gotchas** (`~/.kiro/agents/*.json`): `tools` must list `@builtin` and every
  `@<server>` the agent uses, or those tools never load. `allowedTools` only auto-approves, and
  subagents don't inherit the parent's: a missing entry stalls the worker on an approval prompt.
  On machines with AIM-managed agents the JSON is rewritten on load, so deploy configs by copy,
  never symlink. Verify a config with a live probe that should fail, not by reading the file.
- **Shell** (unverified on 2.34, closed source): its open-source predecessor, Amazon Q CLI, runs
  `bash -c` (or `$AMAZON_Q_CHAT_SHELL`), with no rc file loaded
  ([source](https://github.com/aws/amazon-q-developer-cli/blob/main/crates/chat-cli/src/util/env_var.rs)),
  so the zsh traps in [proposal 11](proposals/11-agent-shell-baseline.md) shouldn't apply. Confirm
  with the live shell probe there before relying on it.

### codex (secondary)

- **Plugin install:** `codex plugin marketplace add smileynet/grey-matter`, then
  `codex plugin add grey-matter@grey-matter`. Add `smileynet/tkt` and install `tkt@tkt`
  separately. Each repository has `.codex-plugin/plugin.json` and
  `.agents/plugins/marketplace.json`; Codex discovers nested skills recursively.
- **Local development:** register the absolute checkout path as the marketplace,
  then run `node scripts/deploy.mjs` once after edits to refresh the cache and roots.
  Start a new chat to load changes. Installed plugin skills use `<plugin>:<skill>` names.
- **Duplicate prevention:** `deploy.mjs` copies nothing into `.codex/skills` or `.agents/skills`
  while the pack's Codex plugin is enabled in the user config (`CODEX_HOME` supported), and
  removes only manifest-owned copies. `--allow-dual` overrides. Disabled plugins permit copies.
- **Symlinked roots:** default deploy separates an enabled plugin harness's skill-root
  symlink into a real directory, preserving unrelated skills. Owned bare copies are then
  removed from that root; Kiro retains its own copies. `--dry-run` reports the separation.
- **Reads `~/.agents/skills`: verified on codex-cli 0.147.0.**
  `node scripts/probe-codex-shared.mjs` uses a disposable home and the native app-server
  catalog; one shared-root probe loads without a model call. Both roots count for coverage.
- Packaging reference: [OpenAI plugin documentation](https://developers.openai.com/plugins/build/plugins).


- Binary `codex` (a `.ps1` shim via fnm on this machine), probed 0.163.0. Auto-scans its
  root. Uses the `agents/openai.yaml` sidecar for invocation policy.
- **User root**: `~/.codex/skills/`. **Install**: default set, or `--root ~/.codex/skills`.
- **Test**: `codex exec --dangerously-bypass-approvals-and-sandbox -C <dir> "<prompt>"`
  (needs the bypass or it hangs on approval). On Windows the shim won't launch via
  `Start-Process`; run it through a `Start-Job`/pwsh call.
- **Invocation filter**: **honored, cleanly isolated**, a skill with
  `policy.allow_implicit_invocation: false` is absent from the model's catalog.
- **Shell** (probed live 2026-10-26 in the Codex app; source read on 0.147): the account's
  login shell from the passwd entry (`pw_shell`, not `$SHELL`), so zsh. The live probe hit all
  three zsh rules (`echo ====` → `=== not found`, `set -- $p` → one argument, an unmatched glob →
  `no matches found`). It did **not** pick up the user's `.zshrc` aliases or `noclobber`
  (`ls`/`cat` were `/bin`, 2 aliases total), although the source's snapshot sources `~/.zshrc`
  ([startup](https://github.com/openai/codex/blob/main/codex-rs/shell-command/src/startup.rs));
  why is unexplained. `grep`/`find` are the system binaries (no shadowing). There is no bash
  override: `zsh_path` only serves the zsh-fork feature, and `CODEX_SHELL` (set in the app's
  command environment) isn't in the open-source code. Options are in
  [proposal 11](proposals/11-agent-shell-baseline.md).

### Claude Code (ancillary)

- Binary `claude`, probed 2.1.303. Auto-discovers its root; also `--plugin-dir` + the
  `/skill-name` slash command.
- **User root**: `~/.claude/skills/`. **Project**: `.claude/skills/`, `.agents/skills/`.
  **Install**: default set, or `--root ~/.claude/skills`, or `--project`.
- **Test**: `claude -p "<prompt>" --allowedTools Read` (a plain `-p` works;
  `--plugin-dir` + piped stdin can hang, use a direct `-p` prompt).
- Confirmed references/ load on demand; install is flat (bucket nesting is repo-only).
- **Bash tool shell.** The Bash tool runs the login shell (zsh on macOS), not bash, with
  the aliases, functions and options sourced from `~/.zshrc` applied to every command
  ([tools reference](https://code.claude.com/docs/en/tools-reference)). The baseline on every
  macOS/Linux machine is a bash ≥ 4 in `~/.claude/settings.json`:
  `"env": { "CLAUDE_CODE_SHELL": "/opt/homebrew/bin/bash" }` (Intel Mac `/usr/local/bin/bash`,
  Linux `/usr/bin/bash`). Never `/bin/bash` on macOS (3.2) or a versioned `Cellar/` path: an
  invalid value falls back to auto-detection silently
  ([env vars](https://code.claude.com/docs/en/env-vars)). Keep Homebrew bash marked
  `brew tab --installed-on-request bash` so `brew autoremove` can't take it. After a restart,
  `echo "$BASH_VERSION"` must be non-empty. `node scripts/probe-agent-shell.mjs` reports all of
  this and `sync` runs it. In any shell, `grep`/`find` are Claude Code's embedded ugrep/bfs:
  use `command grep`/`command find` for exact GNU/BSD behaviour.
  Why: [proposal 11](proposals/11-agent-shell-baseline.md).
- **`/review` is not grey-matter's review.** A skill named `code-review` replaces Claude's
  bundled `/code-review`, but the bundled alias `/review` still runs Claude's own reviewer
  (no two axes, no tickets). Invoke `/code-review`.
- **Plugin install** (alternative to copying into `~/.claude/skills/`):
  `/plugin marketplace add smileynet/tkt`, `/plugin marketplace add smileynet/grey-matter`, then
  `/plugin install grey-matter@grey-matter` (pulls in `tkt@tkt` as a dependency). Plugin skills are namespaced
  (`/grey-matter:code-review`, `/tkt:tkt-core`), so they no longer shadow Claude's bundled
  `/code-review`. Using both install paths would list each skill twice, so `deploy.mjs`
  skips Claude-read roots while the plugin is installed (`--allow-dual` overrides).
  **Test locally**: `claude --plugin-dir ../tkt --plugin-dir . plugin details grey-matter`
  lists the components without a model call.
- **Local source verification** (CLI 2.1.310): `claude plugin list --json` reports
  `readFromFolder` and `folderVersion` for enabled directory-marketplace plugins.
  Default deploy verifies this checkout/version once per pack before pruning copies.
  Audit reads that active folder; the old `installPath` cache can remain stale.
  Reload plugins or start a new chat after edits. A failed/foreign/legacy source
  observation stops deploy and preserves copies; see [refresh evidence](research/claude-local-refresh.md).

### agy (ancillary, Google Antigravity CLI)

- Binary `agy`. `--print` is non-interactive; `--disable-slash-commands` covers "skill
  expansion".
- **Global install is PLUGIN-driven, not a bare-dir scan.** On the probed **agy 1.1.14**,
  `agy` surfaces skills only from plugins registered in `~/.gemini/config/plugins/` (each
  has a top-level `plugin.json` + a `skills/` subdir of SKILL.md dirs). Copying skill dirs
  into `~/.gemini/antigravity-cli/skills/` or a project `.agents/skills/` did **nothing**
  on this version (the repo's earlier "project root confirmed live" was agy **1.2.0**, a
  different version — bare-dir scanning is version-gated; don't assume it). So "deploy
  globally to agy" = build a plugin package and install it.
- **Install**: part of `node scripts/deploy.mjs` when `~/.gemini` exists, or on its own with
  `node scripts/deploy.mjs agy install` (builds `dist/agy-plugin/`,
  runs `agy plugin validate --strict`, then `agy plugin install <dir>`). Verify with
  `agy plugin list --json` (shows `grey-matter` + its skill count) or by asking agy to
  list its skills. `sync` already runs this deployment; do not deploy a second time.
- **Manifest and resources**: the [vendor schema](https://antigravity.google/schemas/v1/plugin.json)
  supports extra skill roots, but agy 1.4.5 includes nested directory names in command
  namespaces. Engine 1.3.1 keeps flat `skills/<name>` directories and projects Markdown
  resource links to their packaged locations, including transitive linked documents.
  Missing or escaping targets fail before output replacement. Isolated native installs
  verify 44 grey-matter and four tkt skills with `plugin:skill` names. Candidate tests
  also cover runtime commands and dynamic resources. See the [source audit](research/agy-plugin-conformance.md).
- **Test**: `agy --dangerously-skip-permissions --print "<prompt>"` from any dir (global
  once installed). Gotcha: `-p` grabs the next token as its prompt, put flags first and
  the prompt last, or use `-p='...'`.
- **Invocation policy (agy 1.4.5)**: `/skills` lists human-only skills with
  `model_invocable: false`. Their metadata is excluded from model context, while explicit
  `/grey-matter:<skill>` expands the body. A loopback capture and removed-policy control
  verify this behavior; the published frontmatter reference still omits the field.
  See [policy evidence](research/plugin-invocation-policy.md).
- **Shell**: unverified (closed source; nothing conclusive in the binary). Run the live shell
  probe in [proposal 11](proposals/11-agent-shell-baseline.md) before assuming either way.

### Crush (ancillary, Charm)

- Binary `crush`. Native skills, **no config needed**. Default roots: `.agents/skills`,
  `.crush/skills`, `.claude/skills`, `.cursor/skills`.
- **Project root**: `.agents/skills/` (confirmed live). **Install**: `--project`.
- **Test**: `crush run --cwd <dir> --quiet "<prompt>"`. Gotcha: `--yolo` is rejected under
  `run` in the probed build; read-only prompts run without it.
- **Shell**: an embedded POSIX/bash-style interpreter (`mvdan.cc/sh`,
  [source](https://github.com/charmbracelet/crush/blob/main/internal/shell/run.go)), not the
  login shell, and no rc files: the zsh traps don't apply.

### OpenCode (ancillary)

- Binary `opencode`, probed 1.18.21. Native skills **exposed as a runtime tool, not a
  top-level command** (so `--help` shows no `skills` command, but skills work, probe live,
  don't conclude from `--help`).
- **Roots**: user `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`;
  project `.opencode/skills`, `.claude/skills`, `.agents/skills`. **Install**: `--project`,
  or `--root ~/.config/opencode/skills`.
- **Test**: `opencode run "<prompt>"` from the project dir.
- **Shell** (source-read, not yet probed live): `$SHELL -c` with no login or interactive flag
  ([source](https://github.com/anomalyco/opencode/blob/dev/packages/core/src/shell/select.ts)),
  so zsh reads only `~/.zshenv`: no `.zshrc` aliases or options, but zsh's `=word`, word-splitting
  and `NOMATCH` rules still apply. The config `shell` key can point it at bash.

## Images

All three primary harnesses read images natively: kiro-cli takes a path in the prompt (up to 10
images, each under 10 MB); Claude Code takes a path, a paste, or a drag; Codex takes
`codex exec -i <file>`.

- If an image has dropped out of context (compaction), re-ask in a fresh headless run
  (`kiro-cli chat --no-interactive`, `claude -p`, `codex exec -i`) rather than describing it
  from memory.
- Pre-resize to the model's long-edge tier (1568 px standard; 2576 px on high-res Claude
  models), and stay at or under 2000 px per image when sending more than 20.
- In a multi-image prompt, label each image's role ("Image A: the render") in the text.

## User-level standing rules (global AGENTS.md)

grey-matter has no steering. Its always-on rules are one short file, `global/AGENTS.md`
(budget 3 KB, enforced), installed with `node scripts/install-agents-md.mjs` into each
harness's global instructions file:

| Harness | Global file | Source of the path |
| --- | --- | --- |
| kiro-cli | `~/.kiro/steering/AGENTS.md` | kiro.dev steering docs: AGENTS.md there is always-on |
| codex | `~/.codex/AGENTS.md` | Codex docs: global, merged with repo AGENTS.md |
| Claude Code | `~/.claude/CLAUDE.md` | Claude Code memory docs (user memory) |
| OpenCode | `~/.config/opencode/AGENTS.md` | OpenCode rules docs |
| agy, Crush | not installed | no verified user-level rules path yet; project AGENTS.md still applies |

An installed file starts with an owner marker. The installer refuses to overwrite a file
without it (`--force` overrides), and `uninstall` removes only marked files. Evidence for the
no-steering decision: [kiro-steering-empirical](./research/kiro-steering-empirical.md),
[steering-vs-agents-md-portability](./research/steering-vs-agents-md-portability.md).

## How to test a harness (the probe-rig runbook)

Reproducible procedure to validate any harness (or re-check one after an update). This is
the method behind every row above.

1. **Build two probes** (throwaway, in `.scratch/` or a scratch project under
   `.agents/skills/`):
   - `probe-skill`: nested/real skill, `references/probe.md` linked from its SKILL.md with
     a secret token, an unknown frontmatter key, and `disable-model-invocation: true` +
     `agents/openai.yaml` `allow_implicit_invocation: false` (user-invoked).
   - `probe-open`: a model-invokable twin (no `disable-model-invocation`, no policy block),
     sharp trigger in its description.
2. **Install** into the harness's root (user root, or `.agents/skills/` for project scope).
3. **Drive the harness non-interactively** (command per row above) with four prompts /
   checks:
   - **Discovery**: "list the skills available to you", does the probe appear?
   - **References**: "run probe-skill and report the token it points to", does it read
     `references/probe.md` and return the token?
   - **Unknown frontmatter**: did the skill load at all despite the unknown key?
     (ignored = loads; rejected = errors)
   - **Invocation policy**: inspect the actual model context, explicit user expansion,
     and a control with the policy removed. A model's self-report or a user-facing skill
     list alone does not prove enforcement. On macOS run
     `node scripts/probe-invocation-policy.mjs codex` (or `claude` / `agy`) for isolated
     loopback-only captures with no real model calls. Results are version-specific;
     Crush has no equivalent verified probe here.
4. **Record** results in `research/harness-behavior-probes.md` and update the row here.
5. **Clean up**: remove both probes from the harness root.

Principle: **probe live, don't infer from `--help`** (OpenCode looked unsupported by
`--help` but fully supports skills at runtime).

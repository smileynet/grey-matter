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

- Binary `kiro-cli`; `kiro-cli --version` reported 2.37.1 on this Windows host on
  2026-11-04. The tracked manifest records 2.37.0 from 2026-11-01; the installed version
  has advanced since that baseline. Skills are exposed via the Skill tool. For flags, use
  [the local CLI reference](./harness-surfaces/kiro.md); its full grammar remains at 2.37.0 and
  has not been refreshed against 2.37.1.
- **User root**: `~/.kiro/skills/`. **Install**: `node scripts/deploy.mjs` (it is
  in the harness table) or `--root ~/.kiro/skills`.
- **Test (non-interactive)**: `kiro-cli chat --no-interactive "<prompt>"`, using the existing
  configured permissions and adding no trust-all or bypass flags. Existing profile settings may
  already approve tools. Qualification in this refresh ran `kiro-cli chat --help` only; it proves
  command grammar, not runtime permission behavior, and no model session was started.
- **Invocation filter**: consistent with honoring `disable-model-invocation` (not cleanly
  isolated; see codex for the clean case).
- **Agent-config gotchas** (`~/.kiro/agents/*.json`): `tools` must list `@builtin` and every
  `@<server>` the agent uses, or those tools never load. `allowedTools` only auto-approves, and
  subagents don't inherit the parent's: a missing entry stalls the worker on an approval prompt.
  On machines where an agent manager owns these configs, the JSON is rewritten on load, so deploy configs by copy,
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


- Binary `codex`; `codex --version` reported `codex-cli 0.166.0` on this Windows host on
  2026-11-04. `Get-Command` resolved PATH to `~/.bun/bin/codex.exe`; this path observation
  does not establish whether the file is package-managed or a copied executable.
  `--help` and `exec --help` confirm `-m/--model`, `exec` and its JSON mode.
  Auto-scans its root. Uses the `agents/openai.yaml` sidecar for invocation policy.
- **User root**: `~/.codex/skills/`. **Install**: default set, or `--root ~/.codex/skills`.
- **Windows launch.** The current PATH command resolved to `~/.bun/bin/codex.exe`;
  `codex --version` returned 0.166.0. The manifest's first candidate is the vendored package
  binary, so the path differs while the version agrees. This observation does not establish
  whether the PATH file is package-managed or copied. Node's `spawnSync` does not launch a
  PATH `.cmd` shim directly. The critic probe resolves the `codex` application with Windows
  PowerShell, then passes argv as JSON data for array invocation; it does not construct
  PowerShell source from argument text. It accepts only model IDs matching
  `[A-Za-z0-9][A-Za-z0-9._/-]*` before launcher invocation.
- **Test**: `codex exec --sandbox read-only -C <dir> "<prompt>"`. Qualification in this
  refresh ran `codex exec --help` only; no model session was started. For direct Windows
  process launch of a `.cmd` Codex shim, use the PowerShell application path exercised by
  `probe-critic-model.mjs`.
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

- Binary `claude.exe`; `claude.exe --version` reported 2.1.316 on this Windows host on
  2026-11-04. Bash examples use `claude.exe` because the bare `claude` wrapper requires zsh.
  Auto-discovers its root; also `--plugin-dir` + the
  `/skill-name` slash command.
- **User root**: `~/.claude/skills/`. **Project**: `.claude/skills/`, `.agents/skills/`.
  **Install**: default set, or `--root ~/.claude/skills`, or `--project`.
- **Test**: `claude.exe -p "<prompt>" --allowedTools Read`. Qualification in this refresh ran
  `claude.exe --help` only; no model session was started. `--plugin-dir` with piped stdin can
  hang, so use a direct `-p` prompt.
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
  **Test locally**: `claude.exe --plugin-dir ../tkt --plugin-dir . plugin details grey-matter`
  lists the components without a model call.
- **Local source verification** (CLI 2.1.310): `claude.exe plugin list --json` reports
  `readFromFolder` and `folderVersion` for enabled directory-marketplace plugins.
  Default deploy verifies this checkout/version once per pack before pruning copies.
  Audit reads that active folder; the old `installPath` cache can remain stale.
  Reload plugins or start a new chat after edits. A failed/foreign/legacy source
  observation stops deploy and preserves copies; see [refresh evidence](research/claude-local-refresh.md).

### Kimi Work (ancillary)

- **Package:** `node scripts/build-kimi-plugin.mjs` writes `dist/kimi-plugin/` with all
  50 skills, their linked resources and 19 explicit commands. The standalone builder uses
  the deployer's explicit-root copy mode; the default deploy does not register or install it.
- **Register:** in a Kimi session, use the plugin-builder's `register_personal.sh` workflow
  on `dist/kimi-plugin`. It runs a rights scan and native validation, calls Kimi's official
  registration CLI, then reads back the plugin ID, version and source path. A rights hit
  requires the owner's explicit confirmation. Registration alone does not install the plugin.
- **Install:** open **Personal** on the plugins page and click **＋** beside **Grey Matter**.
  Install the `tkt` CLI and `tkt-core` skill separately for ticket workflows. The package has
  no hooks, MCP servers or setup script.
- **Update:** rebuild and register the same output directory again. Start a new chat if an
  active session still shows old skills; live update behavior has not been probed.
- **Verified 2026-11-08:** static validation returned zero errors and two non-blocking catalog
  warnings for omitted per-skill display overrides. Registration returned a clear rights scan,
  `grey-matter` version `0.1.0`, 50 skill names and 19 command names; read-back verification passed.
- **Still unverified:** installation, live skill discovery, linked-resource loading, user/model
  invocation behavior and updates. Do not infer these from the registration catalog. After
  installation, probe `compass`, one linked resource and both explicit and model invocation,
  then replace this paragraph with the observed results.

### agy (ancillary, Google Antigravity CLI)

- The last recorded version is 1.4.12 (`versions.json`, 2026-11-01); it was not re-probed
  in this refresh because Agy execution is on hold. Prior behavior below is version-labeled
  evidence, not a claim that the installed CLI was checked today. `--print` is non-interactive;
  `--disable-slash-commands` covers "skill expansion" in the recorded reference.
- **Prior global-install probe (agy 1.1.14):** skill discovery was PLUGIN-driven, not a bare-dir scan.
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
  supports extra skill roots, but the prior agy 1.4.5 probe includes nested directory names in command
  namespaces. The Engine 1.3.1 used in that probe keeps flat `skills/<name>` directories and projects Markdown
  resource links to their packaged locations, including transitive linked documents.
  Missing or escaping targets fail before output replacement. Isolated native installs
  verify 44 grey-matter and four tkt skills with `plugin:skill` names. Candidate tests
  also cover runtime commands and dynamic resources. See the [source audit](research/agy-plugin-conformance.md).
- **Test**: no current test command was qualified in this refresh. The previous example used
  a permission bypass; it is withdrawn. Revisit after the Agy execution hold is lifted, using
  the permission controls supported by the then-installed version.
- **Invocation policy (prior agy 1.4.5 probe)**: `/skills` lists human-only skills with
  `model_invocable: false`. Their metadata is excluded from model context, while explicit
  `/grey-matter:<skill>` expands the body. A loopback capture and removed-policy control
  verify this behavior; the published frontmatter reference still omits the field.
  See [policy evidence](research/plugin-invocation-policy.md).
- **Shell**: unverified (closed source; nothing conclusive in the binary). Run the live shell
  probe in [proposal 11](proposals/11-agent-shell-baseline.md) before assuming either way.

### Kiro Crew (ancillary, app)

- Skills reach Kiro Crew agents only through an enabled app's `skill://` entries. `deploy.mjs`
  builds and installs the `grey-matter` app; details in
  [distribution maintenance](distribution-maintenance.md#kiro-crew-app).
- First install: trust `grey-matter` in Settings -> Security -> Third-party apps, then
  `kirocrew app enable grey-matter`. Skills load when a chat starts.
- Test: `kirocrew app info grey-matter` shows `"enabled": true`; in a new dashboard chat,
  `skill_search` finds `compass`.

### Crush (ancillary, Charm)

- Binary `crush`; `crush --version` reported v0.93.1 on this Windows host on 2026-11-04,
  matching `versions.json` (0.93.1 recorded 2026-11-01). Native skills, **no config needed**.
  Default roots: `.agents/skills`,
  `.crush/skills`, `.claude/skills`, `.cursor/skills`.
- **Project root**: `.agents/skills/` (confirmed live). **Install**: `--project`.
- **Test**: `crush run --cwd <dir> --quiet "<prompt>"`. Qualification in this refresh ran
  `crush run --help` only; no model session was started. This help omits `--yolo`, and an earlier
  invocation rejected it under `run`; ordinary permissions apply.
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

## Critic model

When reviewing gate changes, apply [tooling proportionality](local-gates.md#changing-a-gate-is-a-reversible-tooling-change)
before requesting more evidence or decision tickets.

Review critics (the dashboard copy and results critics, proposal 13) run on the best model a
harness offers, with the model and effort pinned on the spawn. **Verified 2026-10-27** on
randomserver by the spike in [critic-model-spike](./research/critic-model-spike-20261027.md);
model facts are from [critic-model-selection](./research/critic-model-selection-20261027.md)
(official vendor documentation). The retained diagnostic is available as
`node scripts/probe-critic-model.mjs --timeout 30` when the user explicitly requests
model qualification. It makes live model calls and a Codex forced-write attempt;
routine sync and harness upgrades do not run or require it. Unrun diagnostics are
not deployment gaps. Its deterministic fake-CLI tests remain scoped regression coverage.

| Harness | Ceiling | Pin with | Effort | Model of record | Needs |
| --- | --- | --- | --- | --- | --- |
| Claude Code | `opus` (Claude Opus 5.5) | Subagent: the `Agent` tool's `model` parameter. CLI: `--model opus` and `--agents` JSON with `model:` | `effort` parameter or `--effort high` (Opus defaults to `medium`) | In-session: the subagent transcript's `model` and `effort`. CLI: `modelUsage` in `--output-format json` | Logged in (`claude.exe auth login`) |
| Codex | `gpt-6.1-sol` | `codex exec -m gpt-6.1-sol -c model_reasoning_effort=high -s read-only` with the whole packet in the prompt, or a `~/.codex/agents/*.toml` file with `model` and `model_reasoning_effort` | `high` | The rollout's `turn_context` (`model`, `effort`); not written with `--ephemeral`. A spawned agent has its own rollout | Logged in; model availability depends on plan, client and workspace |
| Kiro CLI | Strongest Claude in `--list-models` (Opus 4.5 on 2.16.0) | `--model <id>` on a top-level `kiro-cli chat --no-interactive` call. Subagents cannot take a model | `--effort high` | None. Record "requested, unverified" | Logged in |
| opencode | `zai-coding-plan/glm-5.3` (owner's z.ai subscription) | `-m provider/model --variant high`, or `model:` in an agent file; a `-m` flag outranks the file | `--variant` | `opencode export <sessionID>`: `providerID`, `modelID`, `variant` per message; a subagent's model in the `task` tool metadata | A provider with a live key |

Rules, with the evidence for each in the spike results:

- **Model-specific CLI floor (verified 2026-11-02):** the official [model guide](https://learn.chatgpt.com/docs/models)
  requires Codex CLI 0.159.0 or later for GPT-6.1 Terra. It gives no CLI minimum for GPT-6.1
  Sol, the selected critic model; availability depends on plan/sign-in method, client, workspace
  and rollout.
  The probe guards the published Terra floor. A Sol `not supported` response stays an
  availability diagnostic and does not assume that upgrading the CLI fixes it.

- **Pin on every spawn; never inherit.** An unpinned subagent ran on the parent's model in Claude
  Code, Codex and opencode. In Codex, spawn with `fork_turns: "none"` so the critic does not also
  inherit the parent's conversation.
- **Record the model from the harness, never from the critic.** A Kiro run pinned to Haiku said it
  was Sonnet. Every critic result carries `Reviewed on: <model> at <effort>` and `at ceiling`,
  `below ceiling` or `unverified`; a harness below the ceiling still runs its critic.
- **Overrides can defeat a pin.** `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` made a pinned Opus critic run
  on Haiku in Claude Code 2.1.311. Without FORCE the pin won over `CLAUDE_CODE_SUBAGENT_MODEL`. In
  Codex a pinned agent file beat `[agents] default_subagent_model`, which applied to an unpinned
  agent. Read the record to see what ran.
- **A missing model fails loudly everywhere tested.** Kiro lists the available models; Claude Code
  and Codex name the model; opencode says only "Unexpected server error".
- **Read-only.** Use the harness's own restriction (Claude Code `--tools Read,Grep,Glob`, an
  opencode agent with write, edit and bash off and `permission.edit: deny`, Kiro's narrowly scoped
  `--trust-tools` option, or Codex `-s read-only`). In the recorded Codex environment, shell
  commands could not start under the read-only sandbox (Ubuntu 24.04 blocks unprivileged user
  namespaces; the attempted shell write failed with `RTM_NEWADDR: Operation not permitted`. A
  critic that needs shell access must not run there under that setup. On randomserver, the
  sandbox rejected a forced patch attempt with "writing is blocked by read-only sandbox". A
  separate experiment that disabled sandbox/approval controls was not read-only and
  wrote outside the repository; it is not a fallback. Details and the other options tested (tool
  removal, `--worktree`) are in
  [codex-containment-spike](./research/codex-containment-spike-20261027.md).
- **Time-limit every critic call** with an outer `timeout`. A pinned opencode subagent told to reply
  "OK" made 26 read-only calls and ran past 150 s.
- **Ask for "no rows when there are no problems".** Kiro listed non-findings as rows; opencode and
  Claude Code with `--json-schema`, and Codex with `--output-schema`, returned clean structure.
- **Credentials.** A harness that is not logged in is `not-authenticated`, which is a different
  result from a missing model. The probe reports them apart.

## Images

All three primary harnesses read images natively: kiro-cli takes a path in the prompt (up to 10
images, each under 10 MB); Claude Code takes a path, a paste, or a drag; Codex takes
`codex exec -i <file>`.

- If an image has dropped out of context (compaction), re-ask in a fresh headless run
  (`kiro-cli chat --no-interactive`, `claude.exe -p`, `codex exec -i`) rather than describing it
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
| agy, Crush | installed | no verified user-level rules path; project AGENTS.md still applies |

The installer owns only a marked block (`<!-- grey-matter:begin global rev=… -->` to
`<!-- grey-matter:end global -->`), so the user's own rules can share the file. It appends the
block to a file without one, replaces only the block on update, and `uninstall` removes only the
block (and the file, if nothing else is left). It refuses a block edited by hand and a file
another tool generates; `--force` overrides either. A whole file installed by an older version
migrates to a block. `node scripts/check-guidance.mjs` reads these files, Kiro steering and a
repo's `AGENTS.md`/`CLAUDE.md` for dead paths, commands, skills and steering links, generated
files, oversize files and lines repeated across layers. Evidence for the
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

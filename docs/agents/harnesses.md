# Harnesses: deploying and testing skills

The operational reference for each agent harness grey-matter targets: where it reads
skills from, how to install into it, and how to drive it to test a skill. The dated
findings behind this live in [`research/harness-behavior-probes.md`](./research/harness-behavior-probes.md);
this doc is the current how-to.

All harnesses below support the **Agent Skills** `SKILL.md` standard natively, so our
skills deploy **unchanged**, no conversion, no MCP wrapping. Skills install into a **scan
root** (user-level, per harness) or a **project root** (`.agents/skills/` is shared). Use
`scripts/install-skills.mjs` (see the repo README).

## Per-harness reference

Tier reflects the project's priority: primary (kiro-cli), secondary (codex), ancillary
(the rest).

### kiro-cli (primary)

- Binary `kiro-cli`, probed 2.31.0. Skills exposed via the Skill tool.
- **User root**: `~/.kiro/skills/`. **Install**: `node scripts/install-skills.mjs` (it is
  in the default set) or `--root ~/.kiro/skills`.
- **Test (non-interactive)**: `kiro-cli chat --no-interactive --trust-all-tools "<prompt>"`.
- **Invocation filter**: consistent with honoring `disable-model-invocation` (not cleanly
  isolated; see codex for the clean case).
- **Agent-config gotchas** (`~/.kiro/agents/*.json`): `tools` must list `@builtin` and every
  `@<server>` the agent uses, or those tools never load. `allowedTools` only auto-approves, and
  subagents don't inherit the parent's: a missing entry stalls the worker on an approval prompt.
  On machines with AIM-managed agents the JSON is rewritten on load, so deploy configs by copy,
  never symlink. Verify a config with a live probe that should fail, not by reading the file.

### codex (secondary)

- **Plugin install:** `codex plugin marketplace add smileynet/grey-matter`, then
  `codex plugin add grey-matter@grey-matter`. Add `smileynet/tkt` and install `tkt@tkt`
  separately. Each repository has `.codex-plugin/plugin.json` and
  `.agents/plugins/marketplace.json`; Codex discovers nested skills recursively.
- **Local development:** register the absolute checkout path as the marketplace,
  then repeat `codex plugin add <name>@<name>` after edits to refresh the cache.
  Start a new chat to load changes. Installed plugin skills use `<plugin>:<skill>` names.
- **Duplicate prevention:** installers skip `.codex/skills` and `.agents/skills` when
  their Codex plugin is enabled in the user config (`CODEX_HOME` supported), removing
  only manifest-owned copies. `--allow-dual` overrides. Disabled plugins permit copies.
- Packaging reference: [OpenAI plugin documentation](https://developers.openai.com/plugins/build/plugins).


- Binary `codex` (a `.ps1` shim via fnm on this machine), probed 0.163.0. Auto-scans its
  root. Uses the `agents/openai.yaml` sidecar for invocation policy.
- **User root**: `~/.codex/skills/`. **Install**: default set, or `--root ~/.codex/skills`.
- **Test**: `codex exec --dangerously-bypass-approvals-and-sandbox -C <dir> "<prompt>"`
  (needs the bypass or it hangs on approval). On Windows the shim won't launch via
  `Start-Process`; run it through a `Start-Job`/pwsh call.
- **Invocation filter**: **honored, cleanly isolated**, a skill with
  `policy.allow_implicit_invocation: false` is absent from the model's catalog.

### Claude Code (ancillary)

- Binary `claude`, probed 2.1.303. Auto-discovers its root; also `--plugin-dir` + the
  `/skill-name` slash command.
- **User root**: `~/.claude/skills/`. **Project**: `.claude/skills/`, `.agents/skills/`.
  **Install**: default set, or `--root ~/.claude/skills`, or `--project`.
- **Test**: `claude -p "<prompt>" --allowedTools Read` (a plain `-p` works;
  `--plugin-dir` + piped stdin can hang, use a direct `-p` prompt).
- Confirmed references/ load on demand; install is flat (bucket nesting is repo-only).
- **`/review` is not grey-matter's review.** A skill named `code-review` replaces Claude's
  bundled `/code-review`, but the bundled alias `/review` still runs Claude's own reviewer
  (no two axes, no tickets). Invoke `/code-review`.
- **Plugin install** (alternative to copying into `~/.claude/skills/`):
  `/plugin marketplace add smileynet/tkt`, `/plugin marketplace add smileynet/grey-matter`, then
  `/plugin install grey-matter@grey-matter` (pulls in `tkt@tkt` as a dependency). Plugin skills are namespaced
  (`/grey-matter:code-review`, `/tkt:tkt-core`), so they no longer shadow Claude's bundled
  `/code-review`. Using both install paths would list each skill twice, so `install-skills.mjs`
  skips Claude-read roots while the plugin is installed (`--allow-dual` overrides).
  **Test locally**: `claude --plugin-dir ../tkt --plugin-dir . plugin details grey-matter`
  lists the components without a model call.

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
- **Install**: `node scripts/build-agy-plugin.mjs install` (builds `dist/agy-plugin/`,
  runs `agy plugin validate --strict`, then `agy plugin install <dir>`). Verify with
  `agy plugin list --json` (shows `grey-matter` + its skill count) or by asking agy to
  list its skills. Re-run after a `sync` to refresh the package.
- **Manifest shape** (from an installed official plugin): `plugin.json` has
  `name/displayName/version/description/author/keywords/...` and **no `skills` array** —
  skills are auto-discovered from the `skills/` subdir, keyed on each SKILL.md's
  frontmatter `name`. A folder name ≠ frontmatter `name` is a **warning**, not an error
  (ours match, so validate is clean).
- **Test**: `agy --dangerously-skip-permissions --print "<prompt>"` from any dir (global
  once installed). Gotcha: `-p` grabs the next token as its prompt, put flags first and
  the prompt last, or use `-p='...'`.
- **Invocation filter**: lists user-invoked skills in the catalog (does not filter like
  codex).

### Crush (ancillary, Charm)

- Binary `crush`. Native skills, **no config needed**. Default roots: `.agents/skills`,
  `.crush/skills`, `.claude/skills`, `.cursor/skills`.
- **Project root**: `.agents/skills/` (confirmed live). **Install**: `--project`.
- **Test**: `crush run --cwd <dir> --quiet "<prompt>"`. Gotcha: `--yolo` is rejected under
  `run` in the probed build; read-only prompts run without it.

### OpenCode (ancillary)

- Binary `opencode`, probed 1.18.21. Native skills **exposed as a runtime tool, not a
  top-level command** (so `--help` shows no `skills` command, but skills work, probe live,
  don't conclude from `--help`).
- **Roots**: user `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills`;
  project `.opencode/skills`, `.claude/skills`, `.agents/skills`. **Install**: `--project`,
  or `--root ~/.config/opencode/skills`.
- **Test**: `opencode run "<prompt>"` from the project dir.

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
   - **Invocation filter**: does the model catalog list `probe-open` but **not**
     `probe-skill`? If so, the harness honors user-invoked filtering (codex does; agy/crush
     list both).
4. **Record** results in `research/harness-behavior-probes.md` and update the row here.
5. **Clean up**: remove both probes from the harness root.

Principle: **probe live, don't infer from `--help`** (OpenCode looked unsupported by
`--help` but fully supports skills at runtime).

# Harness behavior probes (ticket 14)

> **Currency note.** This document is the **authoritative, current** record of harness
> behavior and supersedes ticket 14's resolution where they differ. Ticket 14 was closed
> mid-investigation and its frozen resolution says Claude Code and OpenCode were "deferred /
> untested"; they were **subsequently probed live** (both proven — see below), and the
> earlier "OpenCode has no Agent Skills support" conclusion was wrong and is corrected here.
> Because tkt makes a closed ticket's resolution immutable, that older text can't be
> amended; trust this doc, not the ticket 14 resolution, for which harnesses were verified.

Empirical results for how skills are discovered, loaded, and filtered, replacing the
inferred [SPEC]/[LIKELY]/[VERIFY] reasoning in `docs/agents/skill-frontmatter.md` with what
was actually observed. Re-run the probe rig when an untested harness is available.

## The probe rig

`.scratch/harness-probe/skills/engineering/probe-skill/` (gitignored, throwaway):

- **Nested** two levels deep (`skills/engineering/probe-skill/SKILL.md`) to test nested
  discovery (in the repo layout; harnesses install flat).
- A `references/probe.md` the SKILL.md links and instructs the agent to read (token
  `PROBE-REF-7Q2X`) to test on-demand reference loading.
- A known-unknown frontmatter key `probe-unknown-key` to test ignore-vs-reject.
- `disable-model-invocation: true` + an `agents/openai.yaml` with
  `policy.allow_implicit_invocation: false` to test user-invoked invocation control.
- A `.claude-plugin/plugin.json` enumerating the nested skill, for Claude's `--plugin-dir`.

A second **model-invokable** variant (`probe-open`, no `disable-model-invocation`, no
policy block) isolates the invocation filter: if the open one is discovered and the
user-invoked one is not, the harness honors the filter.

## Coverage

Six harnesses characterized, all live except where noted: kiro-cli (primary), codex
(secondary), Claude Code, agy (Google Antigravity CLI), Crush (Charm), OpenCode. The
standard's reference library (`skills-ref`) was also probed. **Every one supports the
Agent Skills SKILL.md format** (OpenCode included, correcting an earlier error).

## Scan roots are per-harness, but `.agents/skills/` is the shared one

User-level roots differ per harness; **project-level `.agents/skills/` is read by agy,
Crush, and OpenCode** (and Claude via `.claude/skills`), so a single project install
location serves most tools.

| Harness | User-level root | Project-level root(s) |
| --- | --- | --- |
| kiro-cli | `~/.kiro/skills/` | (verify) |
| codex | `~/.codex/skills/` | (verify) |
| Claude Code | `~/.claude/skills/` | `.claude/skills/`, `.agents/skills/` |
| agy | `~/.gemini/...` (verify) | **`.agents/skills/`** |
| Crush | `~/.config/crush/...` | **`.agents/skills/`**, `.crush/skills/`, `.claude/skills/`, `.cursor/skills/` |
| OpenCode | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | `.opencode/skills/`, `.claude/skills/`, **`.agents/skills/`** |
| (convention) | `~/.agents/skills/` | `.agents/skills/` |

**Deployment consequence**: our skills are consumable **unchanged** (no conversion to a
proprietary agent/rule format, no MCP wrapping) by all of these. Two install modes:
- **Project-level**: install into `<project>/.agents/skills/` once, covers agy, Crush,
  OpenCode, Claude.
- **User-level**: diverges per harness (`~/.kiro/skills`, `~/.codex/skills`,
  `~/.claude/skills`, etc.), which is what our installer's default-roots list handles.

## Results

### kiro-cli 2.31.0 (primary) - PROVEN live

Probe at `~/.kiro/skills/probe-skill/`, driven with `kiro-cli chat --no-interactive
--trust-all-tools`.

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (flat in `~/.kiro/skills/`) | works | agent found `probe-skill`; trace showed `[tool] Reading SKILL.md` |
| `references/` on-demand loading | works | agent followed the relative link, read `references/probe.md`, reported token `PROBE-REF-7Q2X` |
| Unknown frontmatter (`probe-unknown-key`) | ignored, not rejected | the skill loaded and ran despite the unknown key |
| Invocation control (`disable-model-invocation`) | consistent with honoring, not isolated | a trigger-hinting prompt did not auto-fire the user-invoked skill, but the model also declined for other stated reasons, so this run alone doesn't isolate harness-filtering from model-choice. codex isolates it cleanly below |

### codex 0.163.0 (secondary) - PROVEN live, invocation filter isolated

Probes at `~/.codex/skills/`, driven with `codex exec
--dangerously-bypass-approvals-and-sandbox`.

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (auto-scan of `~/.codex/skills/`) | works | model-invokable `probe-open` appeared in the skill catalog it listed (beside `tkt` + built-ins) |
| Invocation control (`policy.allow_implicit_invocation: false`) | honored | the user-invoked `probe-skill` was **absent from the catalog** and reported "skill not found", while `probe-open` (model-invokable) was listed. codex filters user-invoked skills from the model, exactly our sidecar convention |
| `references/` loading | same tier-3 behavioral mechanism kiro demonstrated | not separately isolated on codex this pass |

### Reference implementation (`skills-ref`) - PROVEN

| Behavior | Result | Evidence |
| --- | --- | --- |
| Nested discovery | leaf dir is the skill; depth irrelevant to parsing | `read-properties`/`to-prompt` parse a 2-levels-deep skill fine |
| Unknown frontmatter | ignored, not rejected | `read-properties` exits **0**, returns only `name`+`description`; broken YAML exits **1** |
| `references/` loading | not a library concern | library surfaces `location`; agent reads references at runtime |
| Invocation filter | not done by the standard library | `to-prompt` lists a user-invoked skill; filtering is per-harness (confirmed by codex) |

### Claude Code 2.1.303 (ancillary) - PROVEN live

Probes at `~/.claude/skills/` (auto-discovered, no `--plugin-dir` needed), driven with
`claude -p --allowedTools Read`.

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (flat in `~/.claude/skills/`) | works | agent ran `probe-skill` and reported `PROBE: SKILL.md loaded` |
| `references/` on-demand loading | works | agent read `references/probe.md`, reported token `PROBE-REF-7Q2X` |
| Flat-install confirmation | works, and the agent noticed | it observed the skill loaded from the one-level `~/.claude/skills/probe-skill/`, not a 2-level nested path, reinforcing that install is flat and the repo's bucket nesting is organizational only |
| Invocation control | not isolated this pass | both probes reported "available" only when named; the auto-discovered skill list it volunteered did not surface them, consistent with filtering, but codex remains the clean isolation |

### agy 1.2.0 (Google Antigravity CLI, ancillary) - PROVEN live

Probes at a project's `.agents/skills/`, driven with `agy --dangerously-skip-permissions
--print` from the project dir.

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (project `.agents/skills/`) | works | listed both `probe-open` and `probe-skill`, loaded probe-open (`PROBE-OPEN: loaded`) |
| Invocation control | lists user-invoked skills in the catalog | unlike codex, agy surfaced the user-invoked `probe-skill` too; invocation filtering is per-harness |

### Crush (Charm, ancillary) - PROVEN live

Probes at the project's `.agents/skills/`, driven with `crush run --cwd <proj> --quiet`.

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (project `.agents/skills/`, no config) | works | listed `probe-open` + `probe-skill` alongside its built-ins, loaded probe-open (`PROBE-OPEN: loaded`) |
| Default roots | `.agents/skills`, `.crush/skills`, `.claude/skills`, `.cursor/skills` loaded with no config (per charmbracelet/crush) | confirmed via `.agents/skills` discovery |

### OpenCode 1.18.21 (ancillary) - PROVEN live (corrects an earlier wrong finding)

**Earlier conclusion ("no Agent Skills support") was wrong.** It was based only on the
CLI's top-level `--help` not showing a `skills` *command*, but OpenCode exposes skills as
a runtime **tool**, not a subcommand. Driven with `opencode run` from a project with
`.agents/skills/`:

| Behavior | Result | Evidence |
| --- | --- | --- |
| Discovery (project `.agents/skills/`) | works | listed `probe-open` + `probe-skill` under "Skills from SKILL.md files" |
| Activation | works | invoked probe-open via a `Skill "probe-open"` tool call, returned `PROBE-OPEN: loaded` |
| Roots (per docs) | `.opencode/skills`, `~/.config/opencode/skills`, `.claude/skills`, `~/.claude/skills`, `.agents/skills`, `~/.agents/skills` | `.agents/skills` confirmed live |

Lesson: probe live, don't conclude from `--help`. A `skills` top-level command is not the
signal; the runtime `skill` tool is.

## Our installer - PROVEN end-to-end

`scripts/install-skills.mjs` flattens `skills/<bucket>/<name>/` -> `<root>/<name>/`, carries
`references/` and `agents/`, writes a manifest, is idempotent, prunes orphans, refuses to
clobber foreign dirs (`--force` overrides), and `list`/`uninstall` work. (Details in the
ticket-13 resolution.) Its default root needs updating per the per-harness-roots finding.

## Conclusions fed back

- **Invocation control is honored at the harness layer** (proven on codex; consistent on
  kiro). The `disable-model-invocation` + `allow_implicit_invocation: false` pair does what
  the convention claims.
- **Unknown frontmatter is ignored, not rejected** (reference lib + kiro both loaded the
  skill with an unknown key).
- **`references/` are agent-loaded at runtime** (kiro read the linked reference live).
- **Scan roots are per-harness** (`~/.kiro/skills/`, `~/.codex/skills/`), not the
  `~/.agents/skills/` convention, the installer default must account for this.
- `docs/agents/skill-frontmatter.md` updated accordingly. Ticket 07's narrow checks are
  satisfied (closed, superseded by this ticket).

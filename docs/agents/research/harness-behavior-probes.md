# Harness behavior probes (ticket 14)

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

All four harnesses are now characterized. kiro-cli (primary), codex (secondary), and
Claude Code (ancillary) authenticated and **driven live**. OpenCode (ancillary) is
authenticated but has **no Agent Skills support** to exercise. The standard's reference
library (`skills-ref`) was also probed.

## Scan roots are per-harness (key finding)

The `~/.agents/skills/` cross-client convention is **not** what our primary harnesses
actually scan at user level:

| Harness | User-level scan root | Evidence |
| --- | --- | --- |
| kiro-cli | **`~/.kiro/skills/`** | already held `cpu-perf-bench`, `tkt`; flat `<name>/SKILL.md` |
| codex | **`~/.codex/skills/`** | held `tkt`, `codex-primary-runtime`, built-ins; probe-open discovered there |
| Claude Code | **`~/.claude/skills/`** | held 5 user skills; probe auto-discovered and run there |
| OpenCode | n/a (no skills support) | no skills command/dir/config; unsupported |
| (convention) | `~/.agents/skills/` | absent on this machine |

The installer now defaults to every known harness root present on the machine
(`~/.kiro/skills`, `~/.codex/skills`, `~/.claude/skills`, `~/.agents/skills`), with
`--root` overrides.

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

### OpenCode (ancillary) - NO AGENT SKILLS SUPPORT

OpenCode is installed and fully authenticated (providers Groq, Z.AI, OpenAI, Anthropic,
DeepSeek configured), so this is **not** an auth gap. But its CLI exposes **no skill
concept at all**: no `skills` command, no `skills/` directory, no skill config in
`~/.config/opencode/opencode.jsonc`, and `--help` never mentions "skill". Its
extensibility is agents + plugins + MCP. So the Agent Skills format is **unsupported** at
this version; our skills can't be discovered by OpenCode as skills, they would have to be
re-expressed in its agent/plugin model (out of scope). Mark OpenCode: unsupported, not
merely untested.

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

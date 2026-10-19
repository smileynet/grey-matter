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

## Coverage this pass

kiro-cli (primary) and codex (secondary) are authenticated and were **driven live**. Claude
Code and OpenCode (ancillary) were deprioritized per the harness priority order and are
untested this pass. The standard's reference library (`skills-ref`) was also probed.

## Scan roots are per-harness (key finding)

The `~/.agents/skills/` cross-client convention is **not** what our primary harnesses
actually scan at user level:

| Harness | User-level scan root | Evidence |
| --- | --- | --- |
| kiro-cli | **`~/.kiro/skills/`** | already held `cpu-perf-bench`, `tkt`; flat `<name>/SKILL.md` |
| codex | **`~/.codex/skills/`** | held `tkt`, `codex-primary-runtime`, built-ins; probe-open discovered there |
| Claude Code | `~/.claude/skills/` (+ `.agents`) | 5 entries present; not driven this pass |
| (convention) | `~/.agents/skills/` | absent on this machine |

**Consequence for the installer**: its default `~/.agents/skills/` target would miss
kiro-cli and codex. Install into the real root via `--root` (e.g. `--root ~/.kiro/skills`
and/or `--root ~/.codex/skills`), or give the installer named-harness targets. Follow-up
ticket filed.

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

### Claude Code / OpenCode (ancillary) - UNTESTED this pass

Both installed; Claude Code scan root `~/.claude/skills/` (5 entries present), `-p
--plugin-dir` + `/skill-name` is the documented path. Deprioritized per the harness
priority order. Re-run with the same probe rig when needed.

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

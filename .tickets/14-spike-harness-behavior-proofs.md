---
id: "14"
title: "Spikes: prove skill behavior across harnesses (Claude Code, Codex, Kiro, OpenCode)"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "A reproducible probe-skill rig that can be dropped into each harness, with recorded pass/warn/reject results per harness for: nested discovery, references/ on-demand loading, unknown frontmatter handling, and user-invoked invocation control"
  - "Each target harness (Claude Code, codex-cli, kiro-cli, OpenCode) has a results row; untested harnesses explicitly marked untested"
  - "Findings resolve the uncertain cells in docs/agents/skill-frontmatter.md and feed the distribution decision (ticket 13); ticket 07's narrow checks are satisfied or superseded"
tags: ["type:research", "stream:tooling"]
---

# Spikes: prove skill behavior across harnesses (Claude Code, Codex, Kiro, OpenCode)

## What to build

Empirical spikes that **prove**, per harness, how a skill actually behaves, replacing the
current [SPEC]/[LIKELY]/[VERIFY] reasoning in `docs/agents/skill-frontmatter.md` with
observed results.

### Progress (reference-implementation layer DONE)

The probe rig is built (`.scratch/harness-probe/`, throwaway) and the **standard's
reference implementation** was probed, results in
`docs/agents/research/harness-behavior-probes.md`:

- unknown frontmatter is **ignored, not rejected** (exit 0; only malformed YAML exits 1);
- nesting is **irrelevant to parsing** (leaf dir is the skill);
- `references/` are **not read by the discovery layer** (agent-loaded at runtime);
- `disable-model-invocation` is **not filtered by the standard library** (per-harness).

These resolved the standard-level uncertain cells in `skill-frontmatter.md`. The installer
was also proven end-to-end (ticket 13).

### Live runs DONE for primary + secondary

kiro-cli (primary) and codex (secondary) authenticated and driven live; results in
`docs/agents/research/harness-behavior-probes.md`:

- **kiro-cli**: discovery + `references/` on-demand loading proven live (agent read
  SKILL.md and the linked reference, reported the token); unknown key ignored.
- **codex**: discovery proven; **invocation filter proven isolated** (user-invoked probe
  absent from the catalog, model-invokable probe present), confirming
  `allow_implicit_invocation: false` is honored.
- Key finding: **scan roots are per-harness** (`~/.kiro/skills`, `~/.codex/skills`), not
  `~/.agents/skills`. The installer default was fixed to target every known harness root
  present on the machine.

Claude Code and OpenCode (ancillary, per the harness priority order) are deliberately
deferred; the probe rig re-runs against them unchanged when needed.

## Acceptance criteria

- [x] A reproducible probe-skill rig with recorded results (reference-impl + installer + live kiro-cli + live codex rows proven; ancillary rows present and marked untested)
- [x] Each target harness has a results row; untested harnesses (Claude Code, OpenCode) explicitly marked untested with the reason (ancillary, deprioritized)
- [x] Live per-harness runs recorded for primary (kiro-cli) + secondary (codex), resolving the runtime cells in `skill-frontmatter.md`; the installer default fixed per the per-harness-roots finding

## Resolution (2026-10-19)

Built the probe rig and proved harness behavior live for the priority harnesses. kiro-cli (primary): discovery + references/ on-demand loading proven live (agent read SKILL.md then the linked reference, returned token PROBE-REF-7Q2X); unknown frontmatter key ignored not rejected. codex (secondary): auto-discovery of ~/.codex/skills proven; invocation filter proven ISOLATED - the user-invoked probe (allow_implicit_invocation:false) was absent from the model catalog while the model-invokable variant was listed, confirming the sidecar convention. Reference lib (skills-ref) confirmed unknown-key-ignored (exit 0 vs 1 for broken YAML), nesting parse-agnostic, references agent-loaded, invocation-filter-not-in-standard-lib. Key finding: scan roots are per-harness (~/.kiro/skills, ~/.codex/skills), not ~/.agents/skills - fixed the installer to default to all known harness roots present. Ancillary harnesses (Claude Code, OpenCode) deferred per the stated priority order and marked untested. Findings in docs/agents/research/harness-behavior-probes.md; skill-frontmatter.md updated; probes cleaned up.

### Verification
1. ✓ A reproducible probe-skill rig that can be dropped into each harness, with recorded pass/warn/reject results per harness for: nested discovery, references/ on-demand loading, unknown frontmatter handling, and user-invoked invocation control — "Probe rig at .scratch/harness-probe/ with recorded results: live kiro-cli + live codex + skills-ref + installer rows proven; ancillary rows marked untested with reason"
2. ✓ Each target harness (Claude Code, codex-cli, kiro-cli, OpenCode) has a results row; untested harnesses explicitly marked untested — "All four target harnesses have a results row in harness-behavior-probes.md; Claude Code/OpenCode explicitly marked untested (ancillary, deprioritized)"
3. ✓ Findings resolve the uncertain cells in docs/agents/skill-frontmatter.md and feed the distribution decision (ticket 13); ticket 07's narrow checks are satisfied or superseded — "Live runs recorded for kiro-cli + codex; runtime cells resolved in skill-frontmatter.md (unknown-key ignored, references agent-loaded, invocation per-harness honored); installer default fixed to ~/.kiro|.codex|.claude|.agents per the per-harness-roots finding"

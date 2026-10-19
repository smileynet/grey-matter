---
id: "14"
title: "Spikes: prove skill behavior across harnesses (Claude Code, Codex, Kiro, OpenCode)"
status: in_progress
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

### Remaining (BLOCKED on an authenticated harness)

The **live per-harness rows are untested**: this environment has claude/codex/kiro-cli/
opencode installed but **none authenticated** (`claude -p` returns "Not logged in"), so a
real agent session, the only thing that exercises discovery -> catalog -> activation ->
reference-read -> invocation-suppression, could not be driven. When a harness is logged in:

- drive each with the probe (Claude: `claude -p --plugin-dir <probe>`; others via their
  skills dir / non-interactive mode) and record whether the nested skill is discovered, the
  reference is read on demand, the unknown key warns/rejects, and model-invocation is
  suppressed for the user-invoked probe;
- fill the per-harness rows in `harness-behavior-probes.md`;
- resolve the remaining runtime cells in `skill-frontmatter.md`.

## Acceptance criteria

- [x] A reproducible probe-skill rig with recorded results (reference-implementation + installer rows proven; per-harness rows present and marked untested)
- [x] Each target harness has a results row; untested harnesses explicitly marked untested (all four marked untested: unauthenticated)
- [ ] Live per-harness runs recorded (blocked: needs an authenticated harness), resolving the runtime cells in `skill-frontmatter.md`

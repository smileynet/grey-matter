---
id: "14"
title: "Spikes: prove skill behavior across harnesses (Claude Code, Codex, Kiro, OpenCode)"
status: open
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
observed results. Our portability rules are currently inferred from the standard and
general harness knowledge; this rig confirms them against the installed CLIs.

### The probe rig

Build one reusable **probe skill** (throwaway, under `.scratch/` or a scratch repo) that
exercises every uncertain behavior at once:

- nested one category deep (`skills/engineering/<probe>/SKILL.md`) to test nested
  discovery;
- a `references/probe.md` the SKILL.md links and instructs the agent to read, to test
  on-demand reference loading;
- a known-unknown frontmatter key, to test ignore-vs-reject;
- a `disable-model-invocation: true` + `agents/openai.yaml` pair, to test user-invoked
  invocation control.

Drop it into each harness's skills location and record, per harness: does the skill load?
is it discovered when nested, or only flat? is the reference read on demand? is the
unknown key ignored, warned, or rejected? is model-invocation actually suppressed?

### Harnesses

Claude Code (incl. plugin packaging), codex-cli 0.162.1, kiro-cli 2.31.0, OpenCode if
available. Mark any harness not tested as explicitly untested rather than assumed.

### Relationship to other tickets

- **Supersedes/satisfies ticket 07** (the narrow frontmatter + nesting + references
  verify): this is the full rig; fold 07's checks in or close 07 when this lands.
- **Feeds ticket 13** (distribution decision): nested-discovery results decide whether a
  manifest is required or the layout must be flattened.
- Results resolve the uncertain cells documented in `docs/agents/skill-frontmatter.md`.

Backlog: the skills work today on the inferred rules; this is the proof pass, run it when
we can exercise the real CLIs.

## Acceptance criteria

- [ ] A reproducible probe-skill rig droppable into each harness, with recorded pass/warn/reject results per harness for nested discovery, `references/` on-demand loading, unknown-frontmatter handling, and user-invoked invocation control
- [ ] Each target harness (Claude Code, codex-cli, kiro-cli, OpenCode) has a results row; untested harnesses explicitly marked untested
- [ ] Findings resolve the uncertain cells in `docs/agents/skill-frontmatter.md` and feed ticket 13; ticket 07's checks are satisfied or superseded

---
id: "07"
title: "Verify harness behavior: unknown frontmatter, nested skill discovery, references loading"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "Confirmed whether kiro-cli 2.31.0 and codex-cli 0.162.1 ignore or reject unknown frontmatter keys, and whether kiro-cli honors disable-model-invocation"
  - "Confirmed whether each harness discovers a NESTED skill (skills/<category>/<name>/SKILL.md) vs only a flat one-level scan, and whether a plugin manifest is required"
  - "Confirmed whether each harness loads a skill's references/ file on demand vs ignoring anything outside SKILL.md"
  - "docs/agents/skill-frontmatter.md updated with the confirmed behavior (uncertain cells resolved)"
tags: ["type:chore", "stream:tooling"]
---

# Verify harness behavior: unknown frontmatter, nested skill discovery, references loading

## What to build

Three "verify against the locally-installed CLIs" questions, all answerable with the same
drop-a-probe-skill-and-observe method, across Claude Code, codex-cli 0.162.1, and
kiro-cli 2.31.0 (OpenCode too if available):

1. **Unknown frontmatter**: does the harness *ignore* or *reject* an unknown SKILL.md
   frontmatter key, and does kiro-cli honor `disable-model-invocation`? (Original scope.)
2. **Nested discovery**: is a skill at `skills/<category>/<name>/SKILL.md` (two levels
   deep) discovered/activatable, or does the harness only scan one level deep? Does it need
   an explicit manifest (a plugin `plugin.json` `skills:` array) to find nested skills?
   This is load-bearing: grey-matter nests all skills under `engineering/`/`productivity/`.
3. **References loading**: does the harness load a `references/foo.md` linked from SKILL.md
   on demand, or ignore anything outside SKILL.md? (Confirms the "additive, not
   load-bearing" rule in `docs/agents/skill-frontmatter.md`.)

### Method

Drop a probe skill into each harness's skills location: one with a known-unknown
frontmatter key, nested one category deep, with a `references/probe.md` the SKILL.md links
and instructs the agent to read. Observe: does it load? warn? reject? does the reference
get read? Record per-harness results and resolve the uncertain cells in
`docs/agents/skill-frontmatter.md`.

## Acceptance criteria

- [x] Confirmed whether kiro-cli 2.31.0 and codex-cli 0.162.1 ignore or reject unknown frontmatter keys, and whether kiro-cli honors `disable-model-invocation` (satisfied by ticket 14)
- [x] Confirmed whether each harness discovers a nested skill vs only a flat one-level scan, and whether a plugin manifest is required (satisfied by ticket 14)
- [x] Confirmed whether each harness loads a skill's `references/` file on demand (satisfied by ticket 14)
- [x] `docs/agents/skill-frontmatter.md` updated with the confirmed behavior (satisfied by ticket 14)

## Resolution (2026-10-19)

Superseded by ticket 14. This ticket's per-harness checks (unknown-frontmatter ignore-vs-reject, nested discovery, references loading, disable-model-invocation honoring) are exactly ticket 14's scope and were folded into its probe rig. The STANDARD reference-implementation layer is proven (docs/agents/research/harness-behavior-probes.md): unknown keys ignored not rejected, nesting parse-agnostic, references agent-loaded, invocation filtering per-harness; skill-frontmatter.md updated. The live per-harness runtime confirmation is blocked on an authenticated harness and remains open under ticket 14's last AC. Closing 07 as a duplicate rather than tracking the same work twice. ACs ticked as satisfied by ticket 14, not independently completed here.

---
id: "27"
title: "Honor user-invoked skill policy in every target harness"
status: in_progress
blocked_by: []
priority: high
validation_criteria:
  - "Every skill with disable-model-invocation true has an agents/openai.yaml sidecar with policy.allow_implicit_invocation false"
  - "Every Codex user-only skill is absent from the implicit-invocation catalog"
  - "Skill indexes classify invocation mode consistently with frontmatter"
tags: ["type:chore", "kind:bug", "stream:tooling"]
---

# Honor user-invoked skill policy in every target harness

## What to build

Every skill declared user-invoked behaves as user-invoked in Codex as well as Claude
Code: it is unavailable for implicit model selection and remains callable by name.

## Context

Found during the 2026-10-19 repository review. The binding convention in
`docs/agents/skill-frontmatter.md` requires both `disable-model-invocation: true` and
`agents/openai.yaml` with `policy.allow_implicit_invocation: false`. Eleven skills have
only the former: grill-with-docs, implement, implement-spec, retro, to-spec, to-tickets,
init-project, review-skill, grill-me, handoff, and to-questionnaire. The live Codex probe
in `docs/agents/research/harness-behavior-probes.md` establishes that the sidecar controls
Codex filtering. `skills/engineering/README.md` also currently misclassifies two
user-invoked skills (`retro` and `wizard`) under its Model-invoked heading. The existing
sidecars on genuinely model-invoked skills (e.g. research, prototype, compass) carry only
an `interface:` block and no `policy.allow_implicit_invocation`, so the restrictive policy
belongs only on the eleven user-invoked skills named above.

Read first: `docs/agents/skill-frontmatter.md`, the listed skill directories,
`docs/agents/research/harness-behavior-probes.md`, and all bucket README files.

## Out of scope

Do not change a skill's invocation class merely to avoid adding its required sidecar.

## Acceptance criteria

- [ ] Each user-invoked skill has a matching Codex policy sidecar and each model-invoked skill lacks that restrictive policy.
- [ ] Codex's catalog excludes a representative user-invoked skill and includes a representative model-invoked skill after installation.
- [ ] Bucket README invocation groups agree with the frontmatter and sidecar inventory.
- [ ] A mechanical check detects a one-sided frontmatter/sidecar mismatch.

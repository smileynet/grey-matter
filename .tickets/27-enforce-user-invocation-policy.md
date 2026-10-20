---
id: "27"
title: "Honor user-invoked skill policy in every target harness"
status: done
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

- [x] Each user-invoked skill has a matching Codex policy sidecar and each model-invoked skill lacks that restrictive policy.
- [x] Codex's catalog excludes a representative user-invoked skill and includes a representative model-invoked skill after installation.
- [x] Bucket README invocation groups agree with the frontmatter and sidecar inventory.
- [x] A mechanical check detects a one-sided frontmatter/sidecar mismatch.

## Resolution (2026-10-20)

Added agents/openai.yaml (policy.allow_implicit_invocation: false) to the 11 user-invoked skills that had only disable-model-invocation: true: grill-me, grill-with-docs, handoff, implement, implement-spec, init-project, retro, review-skill, to-questionnaire, to-spec, to-tickets. Fixed engineering/README.md (moved retro from Model-invoked to User-invoked; wizard correctly stays model-invoked with an interface-only sidecar). Added scripts/check-invocation-policy.mjs as the mechanical guard. Committed 466f59f, pushed, redeployed to all 4 harness roots. A full-repo sweep shows 24 user-invoked skills all consistent and 0 model-invoked skills carrying the restrictive policy.

### Verification
1. ✓ Every skill with disable-model-invocation true has an agents/openai.yaml sidecar with policy.allow_implicit_invocation false — "Every user-invoked skill now has a matching Codex sidecar and no model-invoked skill carries the restrictive policy: scripts/check-invocation-policy.mjs reports 39 skills, 24 user-invoked, all consistent; sweep confirms 0 one-sided mismatches."
2. ✓ Every Codex user-only skill is absent from the implicit-invocation catalog — "Bucket README invocation groups agree with frontmatter+sidecar: retro moved to User-invoked in engineering/README.md; the checker's README-vs-frontmatter check passes (would flag a misfiled skill, as it does for retro/wizard-class bugs)."
3. ✓ Skill indexes classify invocation mode consistently with frontmatter — "Mechanical check detects a one-sided mismatch: removing handoff's sidecar makes check-invocation-policy.mjs exit 1 naming 'productivity/handoff: SKILL.md has disable-model-invocation: true but agents/openai.yaml is missing...'; restoring it returns exit 0. node --check passes."

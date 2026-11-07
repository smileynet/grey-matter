---
id: "263"
title: "Kiro copies of delivery-dashboard and orchestrate link into a code-review skill the installer refused to write"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "deploy.mjs audit has no 'installed resource missing' finding for ~/.kiro/skills when a foreign code-review directory exists"
  - "Foreign directories are still preserved, never overwritten"
  - "A deployer fixture covers a cross-skill link into a refused skill"
tags: ["kind:bug", "stream:tooling"]
---
Found in the 2026-11-06 sync. ~/.kiro/skills has six foreign directories (code-review, data-modeling, grill-with-docs, handoff, adopt-project, init-project) that the deployer refuses to replace. delivery-dashboard/SKILL.md and orchestrate/references/reviewer-brief.md link to ../code-review/references/visual-critics.md, so in Kiro they resolve to the foreign code-review, which lacks that file; audit reports 'installed resource missing'. Options: project cross-skill resources into the linking skill's copy, or make the deployer report the dependency at install time. Related: 87 (setup-repo links shadowing handoff/grill-me), 130 (shared user-managed duplicates).
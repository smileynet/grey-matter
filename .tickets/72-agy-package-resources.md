---
id: "72"
title: "Preserve resource links in generated Antigravity plugins"
status: done
blocked_by: []
spec: "release-readiness"
priority: high
validation_criteria:
  - "An isolated generated grey-matter package resolves all three wrap-session documentation targets without the source checkout."
  - "A seeded missing-resource fixture fails and repaired grey-matter and tkt packages pass native strict validation."
tags: ["stream:tooling", "epic:release-readiness"]
---

# Preserve resource links in generated Antigravity plugins

## Intent source

Found during ticket 65 source-documentation audit on 2026-10-23; user requested that outstanding findings block release readiness.

## What to build

Generated plugins retain every resource their skills need after extraction into an isolated directory. Fix packaging rather than deleting useful documentation links. Keep the deploy engine canonical in grey-matter and synchronize its tkt vendor copy.

## Context and sources

Read [Antigravity audit](../docs/agents/research/agy-plugin-conformance.md), [release plan](../docs/agents/proposals/09-release-readiness.md), `scripts/deploy.mjs` and `skills/meta/wrap-session/SKILL.md`.

The generated `skills/wrap-session/SKILL.md` retains `../../../docs/agents/doc-conventions.md`, `../../../docs/agents/maintenance-skills.md` and `../../../.references/README.md`. Flattening the directory changes their resolution and excludes the documents. Native agy 1.4.5 strict validation reports no findings despite these broken paths. The vendor [skills documentation](https://www.antigravity.google/docs/skills/) and [Agent Skills resource rules](https://agentskills.io/specification#file-references) govern resources. Review commands and dynamic paths beyond Markdown links, without treating illustrative placeholder links as dependencies.

## Acceptance criteria

- [x] An isolated generated grey-matter package resolves all three wrap-session documentation targets without the source checkout.
- [x] A seeded missing-resource fixture fails and repaired grey-matter and tkt packages pass native strict validation.

Ticket 67 must retain the fix in release bundles; ticket 69 must exercise it during installed-package tests. Ticket 70 is blocked until this finding is resolved.

## Resolution (2026-10-23)

done: engine 1.3.0 preserves source skill layout, declares native bucket paths and includes linked files transitively; canonical fe50b6d and tkt vendor 45db853 pushed and deployed once per pack.

### Verification
1. ✓ An isolated generated grey-matter package resolves all three wrap-session documentation targets without the source checkout. — "Isolated generated copies validated by agy 1.4.5 --strict --json: 44 grey-matter and 4 tkt skills, findings empty; all three wrap-session targets exist under package root without source checkout."
2. ✓ A seeded missing-resource fixture fails and repaired grey-matter and tkt packages pass native strict validation. — "check-repo all 9 invariants pass including 27 deploy fixtures; missing-resource fixture fails before output replacement, succeeds after repair, remains readable after source removal. tkt mise run check passes 296 tests."

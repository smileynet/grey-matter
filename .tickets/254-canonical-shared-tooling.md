---
id: "254"
title: "Keep shared tooling environments out of disposable run directories"
status: open
blocked_by: []
spec: "skills/meta/repository-artifact-hygiene/SKILL.md"
validation_criteria:
  - "Declared shared tooling consumers prevent premature retirement"
  - "Canonical environment handoff is verified independently of old path"
  - "Applicable stages and independent review pass with explicit coverage"
tags: ["stream:tooling", "kind:enhancement"]
---
## Intent source

Sam requested filing the reusable remote Android retrospective recommendations on November 4.
Philippines Trip preserved approximately2.1GiB of an obsolete integration checkout because browser QA imported its Playwright installation. Its ticket 274 now owns transfer and verified retirement. Source:
https://github.com/smileynet/philippines-trip/blob/84cf6935/.memory/reviews/remote-android-retro-followup-2026-11-04.md

## Read first

- skills/meta/repository-artifact-hygiene/SKILL.md
- skills/meta/repository-artifact-hygiene/references/inspection.md
- skills/meta/repository-artifact-hygiene/references/retention-lifecycle.md
- .tickets/247-cleanup-review-scenarios.md

## What to build

Extend existing artifact-hygiene guidance with a disclosed shared-tooling handoff example. Record a canonical environment owner, runtime/dependency/browser versions, actual consumers and retention end condition. Update and verify consumers independently of the disposable old path before reconsidering retirement. Reuse existing declared-input inspection where suitable; deterministic checks may flag declared shared dependencies nested under a retirement target, but must not infer use or disposability from names or age. Keep host paths and package-manager choices project-local.

## Acceptance criteria

- [ ] A declared shared tool environment under a disposable run is reported as an active dependency with its consumer and scope; an undeclared dependency remains unknown rather than disposable.
- [ ] A portable handoff example records ownership and version compatibility, updates consumers and exercises the real consuming command without using the old path.
- [ ] Retirement stays blocked until consumer transfer and fresh identity/ownership/handle checks pass under applicable authorization.
- [ ] Offline scenarios cover a still-imported old path, missing browser/runtime input and a verified canonical environment; any new mechanical checker has executed regressions.
- [ ] Applicable repository stages and independent review pass without installing project-specific environments or deleting live data.

## Limits

This is reusable guidance and declared-dependency validation, not implementing Philippines Trip ticket 274, a global environment provisioner or an automatic cleanup engine. #247 owns cleanup acceptance scenarios; #144 owns promotion/link rewriting. Preserve private inputs and existing authorization boundaries.

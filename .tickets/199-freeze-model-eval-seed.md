---
id: "199"
title: "Freeze evaluation seed inputs so host tooling and dashboard edits cannot change the benchmark"
status: done
blocked_by: ["174"]
priority: high
tags: ["stream:orchestration", "type:fix"]
validation_criteria:
  - "Current checkout reproduces the pinned evaluation seed despite the changed delivery-dashboard template, and unexpected remaining seed drift still fails before a model call."
  - "Focused regression and current repository gates pass; an independent critic accepts exact final source and evidence."
  - "Recipe, provenance and artifact lifecycle describe the repaired path without relabeling historical native runs."
---

# Freeze evaluation seed inputs so host tooling and dashboard edits cannot change the benchmark

## What to build

The #167 preflight and independent critic reproduced current generator tree
`d1ae7bc7028f238f8207b2eec31f9d0ba5e1f40e` instead of the #174 pin
`c474646ea61e037fcdbc1be3d2dc6c0833f5e260`. Exactly one committed file differs:
the embedded delivery dashboard, changed by unrelated template maintenance.
AGENTS.md still matches; this is not evidence of tkt drift. The model runner
correctly refuses to call the model, but the published recipe is no longer
directly runnable from the current checkout.

Pin the original 45,998-byte fixture dashboard with provenance. Restore it in
the generated evaluation fixture before validating the full seed tree; continue
rejecting any other unexpected drift. Add a regression using a harmless fake
native executable so creation/seed checking is exercised without model calls.
Keep historical execution and grader provenance unchanged. Do not change the
general orchestration generator's default dashboard or global host settings.

## Acceptance criteria

- [x] Current checkout reproduces the pinned evaluation seed and still rejects other seed drift before model calls.
- [x] Focused regression/current gates and independent exact-source review pass.
- [x] Recipe/provenance/artifact disposition are updated without relabeling historical runs.

## Resolution (2026-11-03)

done: pinned original evaluation dashboard input and preserved full-tree drift rejection, restoring reproducible fixture setup without changing historical benchmark evidence

### Verification
1. ✓ Current checkout reproduces the pinned evaluation seed despite the changed delivery-dashboard template, and unexpected remaining seed drift still fails before a model call. — "Independent critic reproduced d1ae7bc current generator versus c474646 pin, verified only dashboard differed, and matched original45998B snapshotSHA f2c67d3e. Repair afcc706 restores that file then checks entire seed before native invocation. Fake-Node integration reaches agent-process-failure with seedmatches; added unrelated file still rejected; no model call."
2. ✓ Focused regression and current repository gates pass; an independent critic accepts exact final source and evidence. — "Root13/13 regressions passed3.52s; critic independently13/13 passed3.42s. Selected premerge model-eval and syntax passed, ordering ticketgraph passed, prepush doc-links/home-path/gates-coverage passed; independent exact-source audit9650a26 integrated239638b and pushed, diff check clean."
3. ✓ Recipe, provenance and artifact lifecycle describe the repaired path without relabeling historical native runs. — "eval-seed-drift-20261102.md and shared selected recipe record repaired sourceSHA f6a5a3bb, original snapshot provenance and setup-only verification. Original174 native execution hashes unchanged. Keep45998B snapshot as frozen Git fixture; existing test lifecycle removes temporary roots, no global settings/model history created."

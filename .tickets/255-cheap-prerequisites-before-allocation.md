---
id: "255"
title: "Order cheap prerequisites before expensive resource allocation"
status: open
blocked_by: []
spec: "docs/agents/local-gates.md"
validation_criteria:
  - "Measured prerequisite failure prevents expensive allocation"
  - "Candidate identity and final artifact acceptance remain required"
  - "Applicable stages and independent scenario review pass"
tags: ["stream:test-verification", "kind:enhancement"]
---
## Intent source

Sam requested filing the reusable remote Android retrospective recommendations on November 4.
During Philippines Trip work item (278), native methods completed before aggregate checks exposed host prerequisites. Those defects were repaired; remaining ordering work is local work item (285). Source:
https://github.com/smileynet/philippines-trip/blob/84cf6935/.memory/reviews/remote-android-retro-followup-2026-11-04.md

## Read first

- docs/agents/local-gates.md
- skills/engineering/orchestrate/SKILL.md
- skills/meta/repository-artifact-hygiene/SKILL.md
- .tickets/212-archive-recovery-preflight.md

## What to build

Add a small portable check-plan example to the existing orchestration/local-gate owner. Measure check costs and prerequisites; execute applicable cheap capability/contract checks before allocating scarce devices or starting expensive jobs. Keep final acceptance bound to produced artifacts and native evidence. Reuse results only under the same candidate/input identity contract. Select the maintained reference owner after reading existing guidance; use pointers instead of duplicating rules.

## Acceptance criteria

- [ ] A measured example separates cheap prerequisites from expensive work and final output-bound acceptance without inventing a universal time threshold.
- [ ] Synthetic prerequisite failure allocates no device or expensive resource and retains structured executed/fail/skip evidence.
- [ ] Changed candidate/input identity rejects reuse; successful preflight never substitutes for missing final artifact or native evidence.
- [ ] Example avoids duplicate expensive checks when valid identity-bound reuse is available and explains execution ownership and resource release.
- [ ] Applicable repository stages and independent scenario review pass; no mandatory hook or hosted CI is introduced.

## Related work

#212 is archive proof/consumer preflight before transfer; preserve that scope and link it as a domain-specific example rather than expanding it into all native workflows. #223 concerns the final complete readiness verdict. This ticket owns ordering guidance, not repairing historical host defects or implementing the project runner.

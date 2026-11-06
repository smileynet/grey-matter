---
id: "260"
title: "Apply evidence-first spikes and visual critic guidance"
status: done
blocked_by: []
validation_criteria:
  - "Shared guidance and workflow entry points implement all three acceptance criteria"
  - "Applicable gates and deployment pass"
tags: ["stream:tooling"]
assignee: "codex"
---
## Intent

Apply [proposal 22](../docs/agents/proposals/22-spike-before-implementation.md) and give critics a reproducible visual and technical evidence workflow.

## Acceptance criteria

- [x] Route consequential unresolved premises to bounded spikes before production edits.
- [x] Document Playwright and native harness browser/image lanes with official sources and explicit qualification limits.
- [x] Require critics to confirm findings, research mitigations, and propose a bounded follow-on spike when mitigation remains uncertain.

## Resolution (2026-11-05)

Adopted proposal 22 and documented verified Playwright usage, harness-specific browser and image routes, and a finding-to-mitigation workflow.

### Verification
1. ✓ Shared guidance and workflow entry points implement all three acceptance criteria — "4fd4b21. Shared technical spike route linked from spec, tickets, implement and orchestration. Visual critic workflow cites official harness sources and distinguishes local qualification. Critics confirm findings, research remedies and propose bounded follow-on spikes."
2. ✓ Applicable gates and deployment pass — "Local Playwright browser suite 6/6 passed. Docs consistency passed for 50 skills, pre-merge 2/2 and pre-push 5/5 passed. Deploy reported 50 skills installed."

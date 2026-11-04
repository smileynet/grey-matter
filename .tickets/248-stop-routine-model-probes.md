---
id: "248"
title: "Remove mandatory live model probes from routine sync"
status: open
blocked_by: []
validation_criteria:
  - "Routine sync does not invoke live critic-model probes or treat unrun host/platform diagnostics as outstanding deployment requirements."
  - "Maintained diagnostic usage and deterministic regression coverage remain available on demand, with consistent current guidance."
tags: ["stream:tooling", "kind:enhancement"]
---
## What to build

User direction in this chat: a temporary spike must not create a permanent test obligation; review all checks discussed in the sync. Remove the unconditional live critic-model probe from skills/meta/sync/SKILL.md and correct docs/agents/harnesses.md and the tool catalog. Leave the diagnostic and offline fixtures available for explicitly requested troubleshooting. Do not rewrite historical tickets/proposals, remove product regressions, or weaken release-candidate and local package checks.

Review scope also covered home-path privacy checks, native Windows/release validation, and recent compatibility/deployment/tkt regression tests. The privacy guard originated in a real leak; platform matrices belong to release qualification, not local sync. Preserve these distinctions in the final review.

## Acceptance criteria

- [ ] Routine sync performs no live model qualification calls.
- [ ] Current guidance makes model probes explicitly requested diagnostics and preserves valid regression and release-stage checks.

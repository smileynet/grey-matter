---
id: "248"
title: "Remove mandatory live model probes from routine sync"
status: done
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

- [x] Routine sync performs no live model qualification calls.
- [x] Current guidance makes model probes explicitly requested diagnostics and preserves valid regression and release-stage checks.

## Resolution (2026-11-04)

done: removed live critic qualification from routine sync and made it explicitly requested diagnostics in current guidance. Clarified that unrun diagnostics and other-platform matrices are not local deployment gaps. Offline diagnostic regressions and actual release requirements remain. Read-only audits retained through the next successful sync; no model calls or platform downloads were run.

### Verification
1. ✓ Routine sync does not invoke live critic-model probes or treat unrun host/platform diagnostics as outstanding deployment requirements. — "Current sync command list contains no live model probe; harness and operator guidance require an explicit user request. Native matrix scope is explicitly release-candidate only."
2. ✓ Maintained diagnostic usage and deterministic regression coverage remain available on demand, with consistent current guidance. — "Gate coverage, docs consistency and50-skill syntax pass. Gate/syntax fixtures32 passed1 explicit skip. Independent prose review corrected the final authorization wording. Pre-push6 selected checks passed; baseline home-path skipped after confirming225 unchanged findings and4 changed files with0 leaks."

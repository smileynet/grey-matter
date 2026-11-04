---
id: "240"
title: "Preflight packages and resume only unfinished deployment targets"
status: done
blocked_by: []
validation_criteria:
  - "Linked AGENTS.md reference material remains inert and links resolve; strict Antigravity validation succeeds."
  - "Package validation precedes installed-target writes; unchanged targets are skipped on retry while changed or missing outputs are repaired."
tags: ["stream:tooling", "kind:bug"]
---
# Preflight packages and resume only unfinished deployment targets

## What to build

Intent: the 2026-11-03 sync exposed recovery gaps. Update scripts/deploy.mjs under the approved sync improvement plan. Preserve ownership checks and real failure reporting.

## Acceptance criteria

- [x] Linked AGENTS.md reference material remains inert and links resolve; strict Antigravity validation succeeds.
- [x] Package validation precedes installed-target writes; unchanged targets are skipped on retry while changed or missing outputs are repaired.

## Resolution (2026-11-04)

done: preflight all portfolio packages before installed writes; package AGENTS.md as inert reference material; compare current roots, Codex caches and Antigravity plugins before refreshing. Deployer1.9.0 synchronized and pushed in tkt. Final installation verification follows in this authorized sync; raw verification logs retained until compact evidence is promoted.

### Verification
1. ✓ Linked AGENTS.md reference material remains inert and links resolve; strict Antigravity validation succeeds. — "Native agy plugin validate dist/agy-plugin --strict passed with50 skills and0 rules; reference-link fixture proves AGENTS.md is relocated and links resolve."
2. ✓ Package validation precedes installed-target writes; unchanged targets are skipped on retry while changed or missing outputs are repaired. — "Deployment suite60/60 passed; pre-merge including deployer passed. Fixtures cover whole-portfolio preflight failure, ownership, repeat roots/plugins and repair of edited/missing outputs. tkt full gate43 Node plus467 Rust tests passed with isolated Git template."

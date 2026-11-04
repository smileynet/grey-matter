---
id: "245"
title: "Account for unknown bytes before declaring footprint cleanup complete"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Offline inspector fixtures account for every entry in disjoint categories, including unfamiliar children and unreadable paths."
  - "A large-family drill-down reports logical and allocated bytes separately, with explicit hardlink, symlink and incomplete-coverage semantics."
  - "Applicable repository stages pass and reviewer evidence distinguishes inventory completeness from deletion authority."
tags: ["stream:test-verification", "kind:enhancement"]
---
## Intent source

Sam accepted all four Tagalog Helper storage-retro follow-ups on 2026-11-04. An initial named-cache audit missed 3.12 GiB in SDKExplicitPrecompiledModules. The adopter already fixed its inventory in Tagalog Helper tickets 211/217/218; this ticket captures portable upstream discovery behavior, not that completed implementation.

Source: https://github.com/smileynet/tagalog-helper/blob/ee4ecc8/docs/storage-retro-fixes-review.html

## Read first

- skills/meta/repository-artifact-hygiene/scripts/inspect-footprint.mjs
- skills/meta/repository-artifact-hygiene/references/inspection.md
- scripts/inspect-footprint.test.mjs
- docs/agents/local-gates.md

## What to build

Mechanical improvement: users can see which bytes were classified, remain unknown or could not be read before an audit declares its scoped inventory complete. Extend the existing read-only inspector with disjoint accounting and bounded drill-down into large families. Discover unfamiliar direct children rather than relying only on a cache-name allowlist. Label logical bytes, allocated bytes and unavailable allocation separately. Reuse existing traversal/link handling; verify it rather than assuming it is missing.

Coordinate bounded traversal with local ticket 175 and APFS host evidence with local ticket 131. Neither a category nor a complete census grants deletion authority. Keep author-owned classification and existing preservation/recheck requirements. Do not add a second cleanup executor or machine-wide scan.

## Judgement and portability

Use the existing artifact-hygiene skill for purpose, ownership, useful evidence, retention and acceptance decisions. Tools supply measured facts, coverage and changed-input observations; they do not infer disposability from names, age, size, ticket status or a complete scan. Keep examples portable across build systems and storage layouts. Incident-specific formats are scenario inputs, not a required global taxonomy or policy engine. Prefer a short skill/reference improvement over new automation when the decision requires context.

## Acceptance criteria

- [ ] A fixture with an unfamiliar large cache child exposes it in the residual breakdown.
- [ ] Every scoped entry belongs to one disjoint category or an explicit unknown/unreadable coverage bucket.
- [ ] Hardlink fixtures avoid double-counting allocation and symlinks do not expand the inspected scope.
- [ ] Partial scans report lower bounds and cannot present their totals as complete.
- [ ] Existing supported output remains compatible or has a documented versioned change.
- [ ] Applicable stages and focused regressions execute with classified results; no new blocking hook is introduced.

## Evidence boundary

The source incident and adopter repair are historical evidence. No upstream tests or implementation were run for this filing.

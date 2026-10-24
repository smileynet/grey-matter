---
id: "55"
title: "Add delivery-dashboard: durable, evolving, tabbed HTML dashboard communicating delivered work in the JTBD register"
status: done
blocked_by: []
priority: medium
validation_criteria:
  - "SKILL.md exists at skills/productivity/delivery-dashboard/ with a model-invokable description"
  - "Maintains ONE durable evolving HTML dashboard per project, tabbed by concern/workstream; tabs curated and retired as features integrate (rolling, relevant-now; not append-only)"
  - "Each tab = current-state view + short rolling history; value-language delegated to changelog, HTML rules to report-format.md (restates neither)"
  - "Explicit three-rung fidelity ladder (wireframe/mocked/live), every visual labelled with its rung"
  - "Written in the JTBD register: value to the user, no jargon, low cognitive load"
  - "implement and implement-spec gain a closing see-also to delivery-dashboard when a delivery is worth surfacing"
  - "compass and cheat-sheet and the productivity bucket README list delivery-dashboard; check-repo.mjs passes"
tags: ["kind:enhancement"]
---

# Add delivery-dashboard: durable, evolving, tabbed HTML dashboard communicating delivered work in the JTBD register

## What to build

A new skill `skills/productivity/delivery-dashboard/` (`SKILL.md`, model-invokable) that
maintains **one durable, evolving HTML dashboard per project**, organized into **tabs by
concern/workstream**, communicating delivered work to the user in the **JTBD register**.

Design settled in this session's grill:
- **Intent source:** this session's grilling + **`docs/adr/0003-spike-options-and-delivery-dashboard-boundaries.md`** (the Decision + Why).
- **Vocabulary:** `GLOSSARY.md` -> "delivery-dashboard terms" (delivery dashboard, JTBD register, fidelity ladder).
- **Structure:** tabbed by concern; each tab = a current-state view + a **short rolling history** of what's currently relevant. Tabs are **curated and retired** as features integrate -- relevant-now, **not** append-only (archival is `CHANGELOG.md`'s job).
- **Fidelity ladder:** explicit three rungs -- **wireframe** (nothing built) -> **mocked** (partial, representative data) -> **live** (shipped) -- with **every visual labelled with its rung** (an unlabelled wireframe reads as a promise). Climbing the ladder is the visible progress signal.
- **Register:** always JTBD -- value to the user, what's new about the experience, no jargon, low cognitive load.
- **Compose, don't restate:** `report-format.md` (all HTML rules -- self-contained, graceful degradation, grounded diagrams), `changelog` (the value-language discipline; rolling-history entries share `CHANGELOG.md [Unreleased]` wording).
- **Wiring:** add a closing see-also from `implement` and `implement-spec` ("consider delivery-dashboard if the delivery is worth surfacing"); register in `compass`, `cheat-sheet`, and the productivity bucket README.

Build to the `writing-for-agents` rules. Keep indexes honest in the same change (set-equality lint).

## Acceptance criteria

- [x] SKILL.md exists at skills/productivity/delivery-dashboard/ with a model-invokable description
- [x] Maintains ONE durable evolving HTML dashboard per project, tabbed by concern/workstream; tabs curated and retired as features integrate (rolling, relevant-now; not append-only)
- [x] Each tab = current-state view + short rolling history; value-language delegated to changelog, HTML rules to report-format.md (restates neither)
- [x] Explicit three-rung fidelity ladder (wireframe/mocked/live), every visual labelled with its rung
- [x] Written in the JTBD register: value to the user, no jargon, low cognitive load
- [x] implement and implement-spec gain a closing see-also to delivery-dashboard when a delivery is worth surfacing
- [x] compass and cheat-sheet and the productivity bucket README list delivery-dashboard; check-repo.mjs passes

## Resolution (2026-10-24)

done: added the delivery-dashboard skill, workflow pointers and discovery entries; verified and deployed once

### Verification
1. ✓ SKILL.md exists at skills/productivity/delivery-dashboard/ with a model-invokable description — "1: safe-core frontmatter validator passes; skill at skills/productivity/delivery-dashboard/SKILL.md"
2. ✓ Maintains ONE durable evolving HTML dashboard per project, tabbed by concern/workstream; tabs curated and retired as features integrate (rolling, relevant-now; not append-only) — "2: skill requires one canonical HTML path, curated concern tabs and retirement; isolated stale-dashboard fixture updates the same file"
3. ✓ Each tab = current-state view + short rolling history; value-language delegated to changelog, HTML rules to report-format.md (restates neither) — "3: skill delegates report format and value wording; fixture retains current experience and short relevant history"
4. ✓ Explicit three-rung fidelity ladder (wireframe/mocked/live), every visual labelled with its rung — "4: explicit wireframe/mocked/live definitions; fixture corrects Booking, Attendance and Receipts labels against supplied evidence"
5. ✓ Written in the JTBD register: value to the user, no jargon, low cognitive load — "5: independent prose review CLEAN; forward-test report records browser rendering limitation"
6. ✓ implement and implement-spec gain a closing see-also to delivery-dashboard when a delivery is worth surfacing — "6: implement and implement-spec closing see-also links checked by repository gate"
7. ✓ compass and cheat-sheet and the productivity bucket README list delivery-dashboard; check-repo.mjs passes — "7: compass and bucket README updated; cheat-sheet discovers from disk; check-repo all 12 invariants pass; one portfolio deploy and strict audit pass with zero findings/errors; source d6bb800 pushed"

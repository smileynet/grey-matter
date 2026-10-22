---
id: "53"
title: "Apply proposal 05: adopt-project + conformance-audit revisions, relocate-knowledge script"
status: done
blocked_by: []
priority: high
validation_criteria:
  - "adopt-project and conformance-audit carry the accepted R1-R9 revisions"
  - "scripts/relocate-knowledge.mjs exists with fixtures (depth change, moved-to-moved link, evidence untouched, code-span skip), wired into check-repo"
  - "check-repo.mjs green"
tags: ["type:enhancement", "stream:migration"]
---

# Apply proposal 05: adopt-project + conformance-audit revisions, relocate-knowledge script

## What to build

Apply the accepted revisions in [proposal 05](../docs/agents/proposals/05-adopt-project-pilot-revisions.md)
to `skills/meta/adopt-project/SKILL.md` and `skills/meta/conformance-audit/SKILL.md` (R1-R9).
Port the pilot's relocation and link-check scripts (kept locally in `.scratch/adopt-decksmith/`;
the method is in proposal 05 R2) to `scripts/relocate-knowledge.mjs` with fixtures. Batch adoption
of the 67 `.memory/` repos depends on this script.

Wait for the user's review of proposal 05 before editing the skills.

## Acceptance criteria

- [x] Each accepted R-item from proposal 05 is reflected in adopt-project / conformance-audit; any rejected item is noted in the proposal.
- [x] `scripts/relocate-knowledge.mjs` with fixtures for: a depth change, a link between moved files, an untouched evidence file, a skipped code span.
- [x] `node scripts/check-repo.mjs` green.

## Resolution (2026-10-22)

done: proposal 05 applied; relocation script ships inside the adopt-project skill and is gated by check-repo invariant 5

### Verification
1. ✓ adopt-project and conformance-audit carry the accepted R1-R9 revisions — "adopt-project + conformance-audit carry R1-R9 (commit 1998fb7)"
2. ✓ scripts/relocate-knowledge.mjs exists with fixtures (depth change, moved-to-moved link, evidence untouched, code-span skip), wired into check-repo — "skills/meta/adopt-project/scripts/relocate-knowledge.mjs + scripts/relocate-knowledge.test.mjs: 6 fixtures pass (depth change, moved-to-moved link, evidence untouched, code-span skip, leftovers, no-clobber); byte-identical to pilot on decksmith cd2c856 (139/139)"
3. ✓ check-repo.mjs green — "node scripts/check-repo.mjs: 5/5 invariants pass"

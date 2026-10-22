---
id: "53"
title: "Apply proposal 05: adopt-project + conformance-audit revisions, relocate-knowledge script"
status: open
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

- [ ] Each accepted R-item from proposal 05 is reflected in adopt-project / conformance-audit; any rejected item is noted in the proposal.
- [ ] `scripts/relocate-knowledge.mjs` with fixtures for: a depth change, a link between moved files, an untouched evidence file, a skipped code span.
- [ ] `node scripts/check-repo.mjs` green.

---
id: "286"
title: "Disposition the 32 tkt validate findings from 2026-11-08"
status: open
blocked_by: []
validation_criteria:
  - "validate findings dispositioned (fixed, ticketed, or explicitly accepted)"
  - "done tickets with unchecked ACs corrected or documented as accepted"
tags: ["type:chore"]
---
## What to build

Groom the grey-matter board per `tkt validate --brief` findings from
2026-11-08 (32 findings, no errors): new tickets missing source references or
acceptance criteria (261-264 and others), and 7 done tickets with unchecked
acceptance boxes (orchestrate spikes 125-129, 33, 94). Runs as part of the
next `wrap-session` / `reconcile-tickets` pass; not urgent on its own.

## Acceptance criteria

- [ ] `tkt validate --brief` findings from 2026-11-08 are dispositioned (fixed, ticketed, or explicitly accepted)
- [ ] Done tickets with unchecked ACs are either corrected with honest evidence or the finding is documented as accepted

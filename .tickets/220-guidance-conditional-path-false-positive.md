---
id: "220"
title: "check-guidance flags conditional and optional paths as dead-path errors"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "A path named in a conditional clause (e.g. 'when ~/.gemini exists') or an optional prior-art reference is reported as info, not error"
  - "node scripts/check-guidance.mjs on this machine reports no dead-path error for AGENTS.md lines 64 and 109"
tags: ["kind:bug", "stream:guidance"]
---

# check-guidance flags conditional and optional paths as dead-path errors

## What to build

Intent source: the 2026-11-03 sync. `node scripts/check-guidance.mjs` exits 1 with two `dead-path` errors in `AGENTS.md` that are not dead:

- line 64: `../crew-research/atomics/` is named as optional prior art ("Other skill sets we study"); the clone is absent on this machine by design.
- line 109: `~/.gemini` is named in a conditional ("refreshes the Antigravity plugin when `~/.gemini` exists").

Fix the checker, not the guidance. Treat a path inside a conditional clause (`when/if ... exists`) or an explicitly optional reference as `info`. Alternatively support an inline/opt-out marker recorded in `global/conflict-pairs.json`'s sibling config. Ticket 195 fixed a similar slash-argument false positive; follow its fixture style.

## Acceptance criteria

- [ ] A path named in a conditional clause (e.g. "when ~/.gemini exists") or an optional prior-art reference is reported as info, not error
- [ ] `node scripts/check-guidance.mjs` on this machine reports no dead-path error for AGENTS.md lines 64 and 109

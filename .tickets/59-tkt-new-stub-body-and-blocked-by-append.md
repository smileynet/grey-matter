---
id: "59"
title: "tkt: new's stub body trips its own stub-body validator, and edit --blocked-by replaces instead of appends -- two agent footguns"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "A proposal exists (filed upstream to tkt and/or captured here) for tkt new to not leave an open ticket in a self-flagged stub-body state -- e.g. a --body/--no-stub option, or stub-body only firing once a ticket leaves backlog"
  - "A proposal exists for an append-friendly blocked_by edit -- e.g. tkt edit --add-blocked-by / --remove-blocked-by, so adding one edge does not silently drop the rest"
  - "tkt-core skill guidance (commands.md / SKILL.md) gains a prominent note on both traps until the tool changes: new seeds a TBD body that trips stub-body on open tickets; edit --blocked-by replaces the whole list"
  - "Cross-referenced with ticket 33 (the sibling upstream-tkt agent-stumble ticket) and ticket 04 (native-tkt migration)"
tags: ["kind:enhancement"]
---

# tkt: new's stub body trips its own stub-body validator, and edit --blocked-by replaces instead of appends -- two agent footguns

## What to build

TBD

## Acceptance criteria

- [ ] TBD

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

Two tkt footguns surfaced in a real session (wrap-session, 2026-10-22) where an agent
stumbled. This ticket is the **upstream-tkt** fix (tool behavior and/or `tkt-core` skill
guidance), mirroring ticket **33**'s pattern — not a grey-matter-local workaround. The local
stopgap notes already landed in `docs/agents/tkt-conventions.md`; this ticket is about fixing
the root cause in the tool so other repos stop hitting it.

### Trap 1 — `tkt new` creates a ticket its own validator immediately flags
`tkt new <slug> --title ...` (with or without `--vc`) seeds the body with template stubs
(`## What to build` -> `TBD`, `## Acceptance criteria` -> `- [ ] TBD`). On an **open** ticket
that trips `tkt validate`'s `stub-body` warning right away; a **backlog** ticket is exempt.

Reproduced (tkt 0.4.0, `92d4833`):
- `tkt new probe-ac --title "probe" --vc "one criterion"` -> created **open** -> `tkt validate`
  immediately: `58-probe-ac.md [stub-body] body still has template placeholders`.
- Same content created `--status backlog` -> **no** warning.

The confusion: the tool hands you a ticket, then its own validator complains about it, with no
hint at creation time. An agent filing a ticket to flesh out later (common: capture now, write
the body next pass) gets a spurious red.

Proposed fixes (any one resolves it; prefer the first):
- `tkt new` takes the body up front — `--body "..."` and/or `--body-file FILE` — so a complete
  ticket can be created in one call; and/or `--no-stub` to omit the template scaffold entirely.
- OR `stub-body` fires only once a ticket **leaves backlog** (i.e. stub is fine while parked,
  flagged only when it reaches the frontier) — matching the existing backlog exemption's logic.
- OR `tkt new` prints a creation-time hint ("open ticket created with a stub body; fill it or
  `--status backlog`") so the trap is visible at the moment it's set, not later via validate.

### Trap 2 — `tkt edit --blocked-by` replaces the whole list (silent edge loss)
`tkt edit <id> --blocked-by N` **replaces** the entire `blocked_by` list. Adding one blocker to
a ticket that already has several silently drops the rest.

Reproduced this session: ticket 52 was `blocked_by: [45,46,47,48,49,50,51]`; `tkt edit 52
--blocked-by 57` left it `[57]`. Recovered only by re-passing the full set
(`--blocked-by 45,46,47,48,49,50,51,57`). `commands.md` documents this as "Replace
dependencies," but there is no append idiom and no guard against the common "add one" intent.

Proposed fixes:
- Add `tkt edit --add-blocked-by N[,N]` and `--remove-blocked-by N[,N]` (set-union / set-diff on
  the existing edges), keeping `--blocked-by` as the explicit full-replace.
- OR, at minimum, a confirmation/dry-run surface when `--blocked-by` would *shrink* an existing
  list, so an accidental replace is caught.

### Skill-guidance half (until the tool changes)
Add a prominent note to the `tkt-core` skill (`references/commands.md` near the `edit`/`new`
flag tables, and/or `SKILL.md`): new seeds a stub body that trips `stub-body` on open tickets;
`edit --blocked-by` replaces rather than appends — pass the full set. (Model this on the
existing `--tags`/`edit` NOTE in `commands.md`, which already flags an edit-flag gap the same
way.) `tkt-core` is tool-owned (grey-matter wraps it per wrap-skills-not-commands), so this half
is a proposal to the tool's skill, not a grey-matter edit.

### Context
- Sibling upstream-tkt agent-stumble ticket: **33** (closing is terminal + no AC re-check).
- Native-tkt migration umbrella: **04**.
- Local stopgaps already landed: `docs/agents/tkt-conventions.md` (stub-body note; blocked-by
  replace-not-append note).

## Acceptance criteria

- [ ] A proposal exists (filed upstream to tkt and/or captured here) for tkt new to not leave an open ticket in a self-flagged stub-body state -- e.g. a --body/--no-stub option, or stub-body only firing once a ticket leaves backlog
- [ ] A proposal exists for an append-friendly blocked_by edit -- e.g. tkt edit --add-blocked-by / --remove-blocked-by, so adding one edge does not silently drop the rest
- [ ] tkt-core skill guidance (commands.md / SKILL.md) gains a prominent note on both traps until the tool changes: new seeds a TBD body that trips stub-body on open tickets; edit --blocked-by replaces the whole list
- [ ] Cross-referenced with ticket 33 (the sibling upstream-tkt agent-stumble ticket) and ticket 04 (native-tkt migration)

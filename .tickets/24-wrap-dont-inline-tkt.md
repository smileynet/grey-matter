---
id: "24"
title: "Wrap tkt-provided skills (not commands); record the wrap-skills-not-commands rule"
status: backlog
blocked_by: ["10"]
priority: low
validation_criteria:
  - "Where tkt ships a skill that a grey-matter skill duplicates, the grey-matter skill wraps it (calls the Skill tool with it) rather than copying its content; reconcile-tickets is the worked example"
  - "The wrap-skills-not-commands principle is recorded (done: docs/agents/maintenance-skills.md): wrap tkt's skills, inlining tkt commands is fine, verify-tkt-usage controls command drift"
  - "Inlined tkt commands are NOT stripped from skills (that was the over-scoped original framing); they stay, kept honest by verify-tkt-usage"
tags: ["type:chore", "stream:skills-review"]
---

# Wrap tkt-provided skills (not commands); record the wrap-skills-not-commands rule

## What to build

Narrowed from the original "strip inlined tkt commands" framing (over-scoped) to the
user's clarified boundary: **wrap tkt's *skills*; inlining tkt *commands* is fine.**

### The rule (recorded in docs/agents/maintenance-skills.md)

- Where tkt ships a **skill** (the consumer-facing `tkt` skill owns the command surface +
  ticket standards), **wrap it**, call the Skill tool with `tkt` rather than copy its
  content, so it can't go stale as tkt evolves.
- **Inlining tkt commands** (`tkt new`, `tkt close --check-all`, `tkt ready`, ...) directly
  in a skill **is allowed**. The wrap rule is about skills, not commands.
- The staleness control for inlined commands is **`verify-tkt-usage`** (built): it checks
  every inlined command/flag against the live `tkt capabilities` manifest.

### Remaining work

- Audit for any place a grey-matter skill *duplicates a tkt-provided skill's content*
  (not just uses a command) and convert it to a wrap. `reconcile-tickets` is done; check
  whether any other grey-matter skill overlapping a tkt skill (tkt ships its own
  `handoff`, `grill-with-docs`, `code-review`, `init-project`, `release-protocol`,
  `readme-writing`, etc.) should wrap the tkt version instead of standing alone. Decision
  per overlap: ours may be deliberately different (adapted for grey-matter) and stay
  standalone, or should wrap, record why either way. Note: those tkt skills are the tkt
  project's *internal* set and are not deployed to consumers today (only the `tkt` skill
  is), so wrapping them is only viable if/when tkt ships them, until then our standalone
  versions are correct.
- Confirm `verify-tkt-usage` covers the command-drift half so no stripping is needed.

Blocked by ticket 10 (tracker-adaptability): the abstraction boundary shapes how wrapping
vs inlining is expressed if a non-tkt tracker ever enters.

## Acceptance criteria

- [ ] Where tkt ships a skill a grey-matter skill duplicates, the grey-matter skill wraps it rather than copying; reconcile-tickets is the worked example
- [ ] The wrap-skills-not-commands principle is recorded (done in maintenance-skills.md)
- [ ] Inlined tkt commands are kept (not stripped), with verify-tkt-usage as the drift control

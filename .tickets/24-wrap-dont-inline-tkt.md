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
  standalone, or should wrap, record why either way.

  **UPDATE (2026-10-20): tkt now ships the session-workflow skills — premise below is resolved.**
  tkt distributes `tkt-core`, **`tkt-orient`**, **`tkt-work`**, and **`tkt-reconcile`** via
  `tools/deploy-skills.sh` (copy, manifest-tracked, in all four harness roots). The earlier
  "not deployed to consumers, so wrapping isn't viable yet" caveat no longer holds for these
  four. Concrete overlaps to decide now:
  - grey-matter `orient` (meta) vs tkt `tkt-orient` — grey-matter's is user-invoked
    (`disable-model-invocation: true`), bias-to-action, plan-less (frontier-is-the-plan),
    compass-routing; tkt's reads `docs/plan.md` + applies a plan-ordering rubric and
    proposes-not-executes. Genuinely different philosophies → likely **stay standalone**,
    but record that decision and consider a one-line pointer to `tkt-orient` for the
    plan-driven case.
  - grey-matter `reconcile-tickets` (meta) vs tkt `tkt-reconcile` — already delegates to
    `tkt-core`; decide whether it should also delegate the plan-reprioritization logic to
    `tkt-reconcile` or keep grey-matter's board-centric version.
  - grey-matter has no `tkt-work` equivalent as a named skill (its pick-and-work path is
    `implement`/`tkt claim` via `orient`); decide whether to wrap `tkt-work` or keep the
    `implement` flow. (tkt migrated its `frontier-work` steering into `tkt-work` per tkt #207.)

  Note the trigger-collision risk is low: grey-matter's `orient`/`reconcile-tickets` are
  `disable-model-invocation: true` (user-invoked), while tkt's are model-invocable — so they
  don't compete for implicit activation. The open question is content delegation, not triggers.
- Confirm `verify-tkt-usage` covers the command-drift half so no stripping is needed.

Blocked by ticket 10 (tracker-adaptability): the abstraction boundary shapes how wrapping
vs inlining is expressed if a non-tkt tracker ever enters.

## Acceptance criteria

- [ ] Where tkt ships a skill a grey-matter skill duplicates, the grey-matter skill wraps it rather than copying; reconcile-tickets is the worked example
- [ ] The wrap-skills-not-commands principle is recorded (done in maintenance-skills.md)
- [ ] Inlined tkt commands are kept (not stripped), with verify-tkt-usage as the drift control

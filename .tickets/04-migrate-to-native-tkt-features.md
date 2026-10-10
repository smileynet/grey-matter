---
id: "04"
title: "Migrate grey-matter conventions to native tkt features once 192-199 land"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "tkt native features confirmed shipped: parent field, [labels.*] namespaces, assignee (tkt tickets 192-199 closed and a tkt release installed)"
  - "Interim epic tagging migrated to native --parent; type:epic/epic: tags removed"
  - "[labels.*] namespaces declared in .tickets/config.toml and tkt validate enforces single-select cardinalities"
  - "docs/tkt-conventions.md interim notes removed; CLAUDE.md reference to ticket 04 cleaned up"
tags: ["type:chore", "stream:tooling"]
---

# Migrate grey-matter conventions to native tkt features once 192-199 land

## Context

`docs/tkt-conventions.md` carries two **interim** conventions that exist only
because tkt doesn't yet have the native features: epics modeled with
`type:epic` + `epic:<slug>` tags + an overloaded `blocked_by` edge, and
single-select tag cardinalities enforced only by discipline. The native
replacements are tracked in the **tkt repo** (`smileynet/tkt`), tickets
**192-199** (see grey-matter proposal `docs/proposals/01c-tkt-native-gap-closure.md`).

This ticket is `backlog` (parked) because it cannot start until that external work
ships; tkt has no cross-repo dependency edge, so the gate is checked manually in
Step 0. Un-park it (`tkt edit 04 --status open`) once Step 0 passes.

## Step 0: completion check (gate)

Do not start the migration until all of these are true:

1. tkt tickets 192-199 are closed:
   `tkt -C D:\code\tkt query -o json | jq 'select((.id|tonumber)>=192 and (.id|tonumber)<=199) | select(.status!="done")'`
   returns nothing. (Run from the tkt repo, or point at it.)
2. The installed tkt binary has the features: `tkt --version` is a release that
   includes them, and `tkt capabilities -o json` lists `parent`, `assignee`, and
   `[labels.*]` config support.
3. `tkt new --help` shows a `--parent` flag; `tkt config --show` accepts a
   `[labels.*]` table.

If any fail, leave this ticket in `backlog`.

## Migration steps

1. **Labels -> native namespaces.** Add `[labels.triage]`, `[labels.kind]`,
   `[labels.type]`, `[labels.stream]`, `[labels.wayfinder]` to
   `.tickets/config.toml` with `single_select` + `values` per the table in
   `docs/tkt-conventions.md`. Run `tkt validate --strict`; fix any ticket whose
   tags now violate a closed set or single-select rule.
2. **Epics -> native parent.** For every ticket tagged `type:epic`, set its
   children's `--parent <epic-id>`, then remove the `type:epic` and `epic:<slug>`
   tags and the containment `blocked_by` edges that only meant "contains" (keep
   edges that are genuine ordering blockers). Re-run `tkt validate`.
3. **Assignee (optional).** If running parallel agents, adopt `tkt claim` setting
   `assignee`; otherwise leave the solo soft-lock as-is and note the decision.
4. **Docs cleanup.** Remove the "Interim" blockquotes from
   `docs/tkt-conventions.md`; update `GLOSSARY.md` entries that say "native once
   192-199 land" to plain present tense; remove the ticket-04 reference from
   `CLAUDE.md`.
5. **Drop the superseded workaround.** Confirm no `scripts/lint-tickets.sh` /
   pre-commit lint hook was ever added (01b's plan, superseded by 01c); if one
   was, delete it since `tkt validate` now enforces the invariants.

## Acceptance criteria

- [ ] tkt native features confirmed shipped: parent field, `[labels.*]` namespaces, assignee (tkt tickets 192-199 closed and a tkt release installed)
- [ ] Interim epic tagging migrated to native `--parent`; `type:epic`/`epic:` tags removed
- [ ] `[labels.*]` namespaces declared in `.tickets/config.toml` and `tkt validate` enforces single-select cardinalities
- [ ] `docs/tkt-conventions.md` interim notes removed; `CLAUDE.md` reference to ticket 04 cleaned up

---
id: "32"
title: "Retire/trim the global frontier-work steering rule now that orient owns session-start"
status: done
blocked_by: []
priority: low
validation_criteria:
  - "A decision is recorded on whether to delete, trim, or keep the global frontier-work rule, with reasoning"
  - "No remaining rule claims start-of-session authority for grey-matter in a way that contradicts orient or the frontier-is-the-plan stance"
tags: ["type:decision", "stream:tooling"]
---

# Retire/trim the global frontier-work steering rule now that orient owns session-start

## What to build

Decide what to do with the legacy global `frontier-work` steering rule now that the
`orient` skill owns grey-matter's start-of-session ritual. Delete it, trim it to the parts
orient and the `tkt` skill don't cover, or keep it — with reasoning.

## Context

Found while authoring `orient` (ticket 25). `frontier-work` lives at
`~/.kiro/steering/frontier-work.md` — a **user-global Kiro steering rule injected into
every session on this machine**, NOT part of this repo (the only in-repo mention is an
incidental line in `docs/agents/skill-reviews/code-review.md`). Its provenance is a
different project lineage: it references `$CREW_TICKET_SOURCES`, `CREW_TICKET_SYNC`,
"archwright"/"crew-research" sessions, and GitHub/GitLab label sources.

Two reasons it's stale for grey-matter:

1. **Plan-centric, which contradicts grey-matter.** It asserts "The plan is authoritative …
   the plan is the single source of truth," and leans on `docs/plan.md` + `tkt sync-plan`.
   grey-matter is plan-less — **the frontier (`tkt ready`) is the plan** (reconcile-tickets
   SKILL.md §5; skill-reviews/reconcile-tickets.md). Direct contradiction.
2. **Its start-of-session role is now owned by `orient`** (the "when tickets exist and no
   specific task is given → `tkt ready` → propose" block). Its other sections (Working a
   Ticket, Marking Done, Creating Tickets) overlap the `tkt` / `tkt-core` skill and the
   grey-matter tkt-conventions doc.

Because it is global, changing it affects every project on the machine, not just
grey-matter — this is a deliberate user-config decision, not a repo commit side effect.
That's why orient was shipped to *supersede* it for this repo rather than editing the
global file as part of ticket 25.

Read first: `~/.kiro/steering/frontier-work.md`, `skills/meta/orient/SKILL.md`,
`skills/meta/reconcile-tickets/SKILL.md`, `docs/agents/tkt-conventions.md`, and tkt's
`tkt-core` skill (`D:\code\tkt\skills\tkt-core`).

## Out of scope

Do not change grey-matter skills here; orient already supersedes the start-of-session role.
This ticket is only about the global steering file.

## Acceptance criteria

- [x] A decision is recorded (delete / trim / keep) with reasoning, accounting for the fact that the rule is global across all projects.
- [x] If trimmed or deleted: no remaining steering claims start-of-session authority for grey-matter in a way that contradicts `orient` or the frontier-is-the-plan stance.
- [x] Any pieces worth keeping (that orient and the `tkt` skill don't cover) are identified, or it's confirmed they're fully covered.

## Resolution (2026-10-20)

Deleted the global ~/.kiro/steering/frontier-work.md rule (user approved). It was user-global (not in this repo), plan-centric, and contradicted grey-matter's frontier-is-the-plan stance; its start-of-session role is now owned by the new orient skill, and its ticket-working/closing/creating sections are covered by the tkt/tkt-core skill + docs/agents/tkt-conventions.md. Steering dir confirmed clear of it; the repo's own .kiro/steering/tkt.md is separate and untouched.

### Verification
1. ✓ A decision is recorded on whether to delete, trim, or keep the global frontier-work rule, with reasoning — "Decision: delete. frontier-work was global and plan-centric (asserts 'the plan is authoritative', docs/plan.md + sync-plan), contradicting reconcile-tickets SKILL.md and the frontier-is-the-plan stance; orient supersedes its start-of-session role."
2. ✓ No remaining rule claims start-of-session authority for grey-matter in a way that contradicts orient or the frontier-is-the-plan stance — "Deleted ~/.kiro/steering/frontier-work.md; Test-Path returns False and the steering dir lists no files. No remaining steering claims start-of-session authority; orient owns it for this repo."

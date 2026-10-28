---
id: "97"
title: "Retire ticket scratch on close and keep closure evidence out of .scratch"
status: open
blocked_by: []
validation_criteria:
  - "One skill owns the scratch retention rule; other skills point at it rather than restating it."
  - "Closing a ticket names what happens to its scratch: promoted, deleted, or kept with a reason."
  - "Closure evidence cites tracked files; a .scratch path in a ticket or tracked doc is flagged by the owning check."
  - "curate-docs treats scratch older than 14 days with no open ticket as orphaned and lists it for deletion."
  - "node scripts/check-repo.mjs passes."
tags: ["type:feature", "stream:tooling"]
---

# Retire ticket scratch on close and keep closure evidence out of .scratch

## What to build

Intent source: a 2026-10-28 disk review of tagalog-helper and clvgm-extract found
16.4 GB of `.scratch`, all written within the previous week, with no rule
telling agents when to remove it. Add a retention rule to the existing owners:

1. Name scratch for its ticket (`ticketNNN-…` or `tNN-…`).
2. On ticket close, promote what is worth keeping into tracked docs or evidence,
   then delete the ticket's scratch. Record the outcome in the Resolution.
3. When a numbered rerun (`-v5`, `-v6`) passes, delete the earlier versions.
4. Scratch that other tools depend on (for example files hard-linked into a
   simulator) is marked and excluded from sweeps.
5. `curate-docs` lists scratch older than 14 days with no open ticket as orphaned.

## Context

`init-project` already says nothing in `.scratch/` is durable, and `adopt-project`
says durable evidence does not live there. In practice closed tickets cite scratch:
15 of the 30 closed-ticket folders reviewed are cited by `.tickets/*.md`,
`.memory/research/**` or `docs/assets/*/captures.json`, so deleting them leaves
dangling citations. The rule needs a closure-evidence half (copy or summarize into
tracked files, then cite those) as well as the deletion half.

Likely owners: `skills/meta/curate-docs`, `skills/meta/init-project` (the Scratch
note), the tkt close flow (`tkt-work` / `reconcile-tickets`), and
`repository-artifact-hygiene` for where promoted evidence goes. Deletion stays
behind the project's normal authorization; the rule tells agents what to propose.

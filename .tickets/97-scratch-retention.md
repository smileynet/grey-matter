---
id: "97"
title: "Clean up scratch and build artifacts at ticket close, with lifecycle scopes and bounded history"
status: open
blocked_by: []
validation_criteria:
  - "One skill owns the scratch retention rule; other skills point at it rather than restating it."
  - "Closing a ticket names what happens to its scratch: promoted, deleted, or kept with a reason."
  - "Closure evidence cites tracked files; a .scratch path in a ticket or tracked doc is flagged by the owning check."
  - "curate-docs treats scratch older than 14 days with no open ticket as orphaned and lists it for deletion."
  - "The rule covers build artifacts and work folders (worktrees, build output, release and probe work directories, disposable homes) as well as .scratch."
  - "Anything kept uncommitted past its ticket's close carries a lifecycle scope (ticket ids, a release, or shared) and an end condition; a shared item is kept until its last listed ticket closes."
  - "History is bounded: each artifact family keeps its latest attempts (default 3) plus any failed or cited attempt still needed; older ones are pruned at close."
  - "node scripts/check-repo.mjs passes."
tags: ["type:feature", "stream:tooling"]
priority: high
---

# Retire ticket scratch on close and keep closure evidence out of .scratch

## What to build

Intent source: a 2026-10-28 disk review of tagalog-helper and clvgm-extract found
16.4 GB of `.scratch`, all written within the previous week, with no rule
telling agents when to remove it. Add a retention rule to the existing owners:

1. Name scratch for its ticket (`ticketNNN-…` or `tNN-…`).
2. On ticket close, promote what is worth keeping into tracked docs or evidence,
   then delete the ticket's scratch. Record the outcome in the Resolution.
3. When a numbered rerun (`-v5`, `-v6`) passes, promote the evidence that matters first,
   then delete the earlier versions. Keep any failed attempt a recovery or a release record
   still needs (ticket 106).
4. Scratch that other tools depend on (for example files hard-linked into a
   simulator) is marked and excluded from sweeps.
5. `curate-docs` lists scratch older than 14 days with no open ticket as orphaned.

## Owner's rule (2026-10-29)

When closing a ticket, clean up its scratch and build artifacts:

- **Promote** what is needed durably into tracked docs or evidence, and cite that.
- **Keep** an uncommitted item only when something still needs it, and only with a clear
  lifecycle scope: which ticket(s), release or shared purpose it serves, and when it ends.
  Keeping something between tickets is fine when several tickets need it; it goes when the
  last of them no longer does.
- **Delete** everything else, including build output, worktrees and work directories
  outside the repo (for example `~/release-work/...`), not just `.scratch`.
- **Keep a reasonably sized history**: the latest few attempts of each kind, plus any
  failed or cited attempt still needed, rather than everything or nothing.

tkt states the same rule in its own close workflow (tkt ticket 229), since tkt ships
standalone.

Keep the mechanism light (workflow-guidance recommendation 7: improve existing files
before adding machinery). Scope can be carried by the name (`t97-…`, `release-0.3-…`,
`shared-<slug>-…`) plus a one-line note for anything kept past a close, in the place
`init-project` already describes for scratch. `wrap-session` and `curate-docs` then list
items whose scope has ended.

## First use: this repo's release work (2026-10-29)

When the staged grey-matter 0.2.0 / tkt 0.5.0 pair is published (owner's word), its
evidence is already promoted to `docs/agents/research/` on main. Then retire:
`~/release-work/20261028/` on randomserver, the matching work folders on the Mac
(`~/release-work/20261028/`) and SharkTank (`D:\code\release-20261028\`), the
detached 10-24 candidate worktrees under `.scratch/linux-validation-20261024/`, and the
superseded `prepare/` output. Keep only what the release record cites.

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

## Scope change (2026-10-29, tickets 101 and 106)

Rule 3 now keeps failed attempts that recovery or release evidence still needs. Source:
workflow-guidance recommendation 7, high confidence against overwriting records.

---
name: curate-docs
description: "Review docs/agents and .scratch for promotion and deletion: graduate mature notes into skills, move reference docs into a skill's references, and prune stale or superseded material."
disable-model-invocation: true
---

# Curate Docs

A periodic sweep of the repo's agent-facing knowledge, deciding what to **promote**, what to **move**, and what to **delete**. Knowledge accrues as loose notes in `docs/agents/` and throwaway files in `.scratch/`; left alone it rots (stale findings, notes that should be skills, docs stranded away from the skill that needs them). This skill keeps it curated. The governing rules are in `docs/agents/doc-conventions.md`; this skill applies them.

User-invoked: a human runs it when the knowledge base needs tending, like `retro` for the environment.

## What it decides

Two independent axes, applied to each candidate.

### Promotion (where should this live?)

Apply the **promotion test** from `doc-conventions.md`: _should an agent **do** this on cue, or **read** it when relevant?_

- **Do-on-cue, with a clear trigger -> promote to a new skill.** A note in `docs/agents/` (or `.scratch/`) that has become a repeatable procedure with a recognizable activation condition should become `skills/<bucket>/<name>/`. Name the trigger; draft the `SKILL.md`; carry its supporting detail into the skill's `references/`. Don't skill-ify raw notes, premature skills dilute the index's trigger precision.
- **Reference a skill needs -> move it into that skill's `references/`.** A doc in `docs/agents/` that exists only to support one skill (its detail, its rubric, its appendix) belongs in that skill's `references/` folder, loaded on demand, not stranded in the docs tree. Move it, and repoint the skill's pointer.
- **Read-when-relevant, serves many -> stays in `docs/agents/`.** Shared reference read by several skills or by humans stays put; don't force it into one skill.

### Deletion (should this still exist?)

Flag for removal, and these are the usual causes:

- **Superseded**: a shipped skill or a newer doc now covers it; the old note is a stale duplicate.
- **Overtaken by a decision**: an ADR or a ruling settled the question the note was exploring; keep the decision, drop the exploration.
- **A deferral masquerading as a note**: "revisit later" with no durable content, this is a tkt ticket (`--status backlog`), not a doc.
- **Orphaned scratch**: `.scratch/` material whose task is long done and that was never promoted; it was always disposable.

## Process

1. **Walk the surface.** List `docs/agents/` (by subfolder: skill-reviews, lenses, research, proposals, conventions) and `.scratch/`. For each item, note what it is and what references it (`grep` for its path) so a move or delete repoints cleanly.
2. **Classify each candidate**: promote-to-skill, move-into-references, keep, or delete, with the one-line reason (which test, which cause).
3. **Check for overlap first.** Before proposing a new skill or a new doc, check existing skills and tickets (`tkt query`); prefer extending or moving over creating a near-duplicate. (Same dedupe discipline as `code-review`, `retro`, `triage`.)
4. **Present candidates to the user, most-actionable-first**, grouped by axis. Promotion and deletion are the user's call; bring a recommendation, not a done deed, deletion especially is not unilateral.
5. **Execute the accepted actions:**
   - _Promote_: author the skill (follow `review-skill`'s depth bar and `writing-for-agents`), move supporting docs into its `references/`, repoint references, and delete the now-graduated note.
   - _Move_: relocate the doc into the skill's `references/`, repoint the skill's pointer and any others.
   - _Delete_: remove the file; if there's durable intent to revisit, file a tkt backlog ticket capturing it rather than leaving the doc.
   - Use `git mv` for moves so history is preserved; verify no dangling links (`grep` the old path) before committing.
6. **Record the sweep.** Summarize what moved, promoted, and was deleted. Larger follow-ups (a promotion worth doing but not now) become tkt tickets.

## It's working if

- `docs/agents/` holds only read-when-relevant shared reference; nothing there is really a skill or really one skill's private appendix.
- Every skill's private detail lives in its own `references/`, not in the docs tree.
- `.scratch/` is near-empty of anything older than its task.
- No dangling links after a move; no note that is secretly a backlog ticket.

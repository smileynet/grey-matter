---
name: to-tickets
description: Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, created on the tkt tracker.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into a set of **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec-slug, a ticket id, or a `docs/` path) as an argument, fetch it and read its full body.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching. For a game, the slices are the mechanics/systems from `game-modeling`, not web-app layers.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer the behaviour touches (schema, API, UI, tests, or whatever this behaviour actually spans): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Not all work is full-stack-vertical. A pure library, a CLI, a one-shot data migration, or a game system may have no UI or API layer to cross; slice it through the layers it does touch, don't invent a layer to satisfy the rule. (The wide-refactor case below is the other non-vertical shape.)

Note on "vertical slice": this is the web/tracer-bullet sense (a thin path through the layers), not the game sense (a polished representative chunk). See `GLOSSARY.md`.

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately. Declare only true blockers, a spurious edge collapses the frontier and hides parallel work.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand-contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket; green is promised only there.

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the blocking edges correct: does each ticket only depend on tickets that genuinely gate it?
- Does every part of the spec map to some ticket, and does every ticket trace back to the spec? (catch invented work and missing work)
- Should any tickets be merged or split further?

Iterate until the user approves the breakdown.

### 5. Create the tickets on tkt

Create the approved tickets with `tkt` (see the issue-tracker doc for the exact commands):

- One `tkt new <slug>` per ticket (or `tkt batch` for several at once), in dependency order so blockers exist before the tickets that reference them.
- Set each ticket's blockers with `--blocked-by`; `tkt ready` then computes the **frontier** (open tickets with all blockers done) natively, no "Blocked by" prose and no local-vs-native branching.
- Acceptance criteria go in `--vc` (validation criteria); the body is "What to build".
- Tag the slices `triage:ready-for-agent` (agent-grabbable by construction).
- If the work came from a spec that is itself an epic of these slices, group them under it: tag each `epic:<slug>` and make the epic ticket `blocked_by` its children (the interim convention; native `--parent` once tkt gains it, see `docs/tkt-conventions.md`). Do NOT close or modify the epic ticket here.

Work the **frontier** via `tkt ready`: any ticket whose blockers are all done. For a purely linear chain that means top to bottom.

<ticket-template>

Body ("What to build"): the end-to-end behaviour this ticket makes work, from the user's perspective, not a layer-by-layer implementation list.

Validation criteria (`--vc`, repeatable): the checkable conditions that define done.

Blockers (`--blocked-by`): the tickets that gate this one, or none (can start immediately).

</ticket-template>

Avoid specific file paths or code snippets: they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

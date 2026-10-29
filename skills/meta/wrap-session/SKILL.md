---
name: wrap-session
description: "End-of-session closing bookend: groom the board, groom the environment, and land the cheap mechanical findings now. Runs reconcile-tickets then retro, then writes the guardrail/check/note or project-level skill that a recurring issue calls for instead of only filing it. Use when wrapping up a session, closing out, or asking 'let's wrap this up'."
disable-model-invocation: true
---

# Wrap Session

The closing bookend of a session. One command that runs the two end-of-session passes in
order and then does the thing they stop short of: **land the cheap mechanical findings this
session** instead of leaving every improvement as a ticket for later.

- `reconcile-tickets` grooms the **board**.
- `retro` grooms the **environment** — and classifies each finding **mechanical** (a
  deterministic check/guardrail) or **judgement** (a coding standard, a call no check can
  make).
- Then the new beat: for each accepted **mechanical** finding that's cheap and unambiguous,
  **build it now** — write the check, the guardrail, or the project-level skill/note — and
  verify it. Everything else stays a ticket (reconcile already captured it).

Composes the two existing skills; it does not re-spell them. Both remain invokable alone.
This is the session-end twin of `orient` (the start bookend); `handoff` writes the pickup
doc, not this.

## Steps

### 1. Groom the board

Call the Skill tool with `reconcile-tickets`. It makes open tickets current, captures the
session's untracked work as tickets, and sets the frontier ordering. Run it **first** so
the board exists for step 3 to file deferred findings into, and so retro's later
judgement-findings extend real tickets rather than duplicate them.

### 2. Groom the environment

Call the Skill tool with `retro`. It reads the session from a fresh context, surfaces
improvement candidates by severity, and classifies each **mechanical** vs **judgement**.
Let retro own that classification and the candidate list — don't second-guess its
categories here. Carry its output into step 3.

### 3. Land the cheap mechanical findings now

This is the step the bookend adds. For each **accepted, mechanical** finding, decide
**land-now vs defer** by a single bar:

> **Cheap and unambiguous** — the fix is clear in shape, small, and you can verify it this
> session. Land it now.
> **Expensive or ambiguous** — big, cross-cutting, or needs a design call. Leave it a
> ticket (reconcile filed it in step 1).

Default to landing; defer only when the bar says so, or when the user says so. For each
land-now finding, pick the form by what the finding is:

- **A deterministic check** (a mistake a linter/test/filesystem check would have caught) →
  write or extend the check so it goes **red** on the seeded mistake and green once clean.
  A new repo-consistency check is a `scripts/check-*.mjs` — the aggregator's orphan guard
  requires it be wired into `scripts/check-repo.mjs`, so wire it. Prove it red-then-green on
  a seeded case before moving on.
- **A recurring agent trap or procedure** → create or update a **project-level skill** or an
  `AGENTS.md`-pointed `docs/agents/` note. Choose which by the **promotion test** in
  [`doc-conventions.md`](../../../docs/agents/doc-conventions.md): *do-on-cue with a clear
  trigger* → a skill; *read-when-relevant* → a note. Write it to the `writing-for-agents`
  rules (call that Skill tool when authoring), and reach it via a pointer, never an orphan.
- **A steering/tooling fix** (a stale `AGENTS.md` line, an unwired existing check, a
  token-heavy tool path) → make the edit directly; it's already in the right place.

When you create or move a skill or doc, keep the indexes honest in the same step: a new
skill updates its bucket `README.md`, `compass`, and the meta roster
([`maintenance-skills.md`](../../../docs/agents/maintenance-skills.md)) together — the
set-equality lint fails a missed one.

### 4. Confirm the rehydration index is current

`.references/` is gitignored except its committed [`README.md`](../../../.references/README.md),
which is the **rehydration index**: on a fresh checkout `.references/` is empty, and that
README is the only thing telling an agent what to re-clone and how. A session that clones a
new reference (or drops one) and forgets the README leaves the index stale, and the next
machine can't rehydrate.

So verify the committed index matches what's on disk: every directory under `.references/`
(except `README.md` itself) has a section in the README with what it is, why it's a
reference, and the exact clone command; and every reference the README lists still exists.
Reconcile any drift now — add the missing section (or remove the dropped one), and refresh a
clone command or pin that moved. If `.references/` and the index already agree, say so and
move on; this is a quick currency check, not a rewrite.

### 5. Verify and report

Run `node scripts/check-repo.mjs` so anything landed in step 3 (a new check, a new
skill/doc, a moved pointer) passes the consistency invariants and link checks, and confirm
`tkt validate` is clean. Then **confirm the working tree is clean** (`git status --porcelain`):
a non-empty tree at wrap time means finished work is stranded unpushed — commit and push it
(or say why it's deliberately left), because the "commit + push after every task" rhythm means
the next session should find nothing dangling. Likewise list uncommitted artifacts this
session left (scratch, build output, outside work folders) whose lifecycle scope has ended, and
apply the [close rule](../repository-artifact-hygiene/SKILL.md#at-ticket-close) to them. Then report three things: the **board** delta
(tickets created / updated, what the frontier now surfaces), the **environment** changes
**landed** this session (including any rehydration-index fix), and what was **deferred** to a
ticket and why.

## Does not

- **Re-spell tkt or retro.** It composes `reconcile-tickets` and `retro`; the command
  surface, ticket standard, and finding categories live in those (and in `tkt-core`).
- **Force-land expensive findings.** The land-now bar is cheap-and-unambiguous; big
  findings stay frontier tickets on purpose.
- **Write the handoff or pick the next ticket.** The pickup doc is `handoff`; reading it
  and choosing the next move is `orient`, next session.

## It's working if

- The board is current and the frontier's top picks are right (reconcile's bar).
- Every recurring **mechanical** mistake from the session either has a guardrail/check/note
  **in the repo now** or a ticket saying why it was deferred — none silently lost.
- A newly created check is proven red-then-green; a new skill/doc is reachable by a pointer
  and passes `check-repo.mjs`.
- The committed `.references/README.md` indexes exactly the references on disk, each with a
  working clone command — a fresh checkout could rehydrate from it.
- The working tree is clean at wrap — no finished-but-unpushed work stranded for the next session.
- The report separates what was *landed* from what was *filed*.

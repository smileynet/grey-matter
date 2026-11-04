---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to `.scratch/` in the project (the gitignored, project-local scratch dir, one consistent place the next agent knows to look), and report the path you wrote.

Cover, each briefly:

- **Goal**: what the work is trying to achieve.
- **Current state**: what is done and what isn't, grounded in verifiable artifacts (git log, test status, open tickets), not your recollection. Do not claim something is complete without a check that says so.
- **Decisions made**: the non-obvious choices and why, so the next agent doesn't reopen them.
- **Next steps**: what to do next, concretely.
- **Open questions / blockers**: what is unresolved or waiting on someone.

For concurrent work, distinguish observed shared-checkout writes from a remote branch
advance. A dirty tree or commit author does not establish a live session; if no current
host roster or dispatch binding identifies a writer at this checkout, mark liveness unknown.
Recommend per-session worktrees for overlapping local edits and upstream reconciliation for
remote advances. Worktrees do not prevent push races. Name a worktree path only when one
has actually been selected or created; never invent a placeholder as evidence.
When useful, run the [orient concurrency helper](../../meta/orient/scripts/classify-checkout-concurrency.mjs)
from the target repository root with `node "<absolute directory containing installed orient SKILL.md>/scripts/classify-checkout-concurrency.mjs"`, and include its observed classification in the handoff. Keep the shell working directory at the target repository root.
In Codex desktop, `list_threads({ mode: "history", source: "codex", limit: 50 })` can surface
active peers and their reported `cwd`; exclude the current thread and follow `nextCursor`
before claiming full coverage. A matching reported `cwd` indicates possible overlap only:
it does not establish where tool calls ran or that a peer is writing. For delegated agents,
pair `list_agents` status with the parent dispatch ledger's checkout/branch binding. If chat
`cwd` differs from the actual tool working directory, record both and leave liveness unknown
unless a current dispatch/root binding confirms a writer.

Include a **suggested skills** section naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, tickets, commits, diffs). Reference them by path, slug, or URL instead; the artifact is the source of truth, the handoff just points at it.

If an artifact remains after the active assignment, include its accountable retention owner, purpose and end condition, or mark those details unknown, using [artifact hygiene's lifecycle rule](../../meta/repository-artifact-hygiene/references/retention-lifecycle.md). A handoff points to retained originals and evidence; it does not replace them.

Redact any sensitive information (API keys, passwords, PII): the handoff becomes the next agent's prompt, so a secret in it is a leak.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

The next session reads this doc with `orient` (the session-start bookend), which treats it as pickup context alongside the live frontier and in-progress threads. Write it to be read that way: the frontier and commits are the source of truth, this doc points at them.

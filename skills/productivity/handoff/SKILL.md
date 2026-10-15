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

Include a **suggested skills** section naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, tickets, commits, diffs). Reference them by path, slug, or URL instead; the artifact is the source of truth, the handoff just points at it.

Redact any sensitive information (API keys, passwords, PII): the handoff becomes the next agent's prompt, so a secret in it is a leak.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Fetch the referenced ticket from tkt (read `.tickets/NN-*.md`, or `tkt query`), state its title before starting, and `tkt claim` it so it shows as in progress. If the reference is ambiguous, ask.

Call the Skill tool with "tdd" to build it, at the pre-agreed seams. (tdd re-points the seam for a game; you don't need to.)

Typecheck and run the relevant test file after each slice; run the full test suite before you commit.

When the ticket's acceptance criteria are met, call the Skill tool with "code-review" to review the work. Code-review files its findings as tickets. Fix only the findings that block *this* ticket's acceptance criteria before committing; the rest stay as follow-up tickets, don't balloon this ticket into fixing everything review surfaces.

Commit to the current branch, then `tkt close` the ticket with its resolution and acceptance criteria checked. (Multi-ticket builds on an integration branch are `implement-spec`'s job, not this one.)

If the project keeps a status dashboard, call the Skill tool with "delivery-dashboard" after
closing the ticket: it adds the ticket's entry and refreshes the Plan tab.

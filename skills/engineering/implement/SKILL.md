---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Fetch the referenced ticket from tkt (read `.tickets/NN-*.md`, or `tkt query`), state its title before starting, and `tkt claim` it so it shows as in progress. If the reference is ambiguous, ask. Then state, from the ticket, its one observable outcome (what a user or caller can now see or do) and its main unresolved assumption (the belief that, if wrong, sinks the approach); check that assumption first.

Call the Skill tool with "tdd" to build it, at the pre-agreed seams. (tdd re-points the seam for a game; you don't need to.)

Typecheck and run the relevant test file after each slice; run the full test suite before you commit.

When the ticket's acceptance criteria are met, review the work at the depth its risk calls for (see [Review depth](#review-depth) below). Code-review, when it runs, files its findings as tickets; a spec check reports its unmet items. Fix only the findings that block *this* ticket's acceptance criteria before committing; the rest stay as follow-up tickets, don't balloon this ticket into fixing everything review surfaces.

Commit to the current branch. Before `tkt close`, promote, keep or delete the ticket's scratch and build artifacts per [repository-artifact-hygiene](../../meta/repository-artifact-hygiene/SKILL.md#at-ticket-close), and say which in the resolution. Then `tkt close` the ticket with its resolution and acceptance criteria checked. (Multi-ticket builds on an integration branch are `implement-spec`'s job, not this one.)

If the project keeps a status dashboard, call the Skill tool with "delivery-dashboard" after
closing the ticket: it adds the ticket's entry and refreshes the Plan tab.

## Review depth

Scale review to reversibility and blast radius, not to diff size.

- **Consequential change**: stateful behavior (stored data, migrations, caches, sessions), a public interface (API, CLI flags, file formats, a skill or command others call), release or deploy tooling, security (auth, secrets, permissions, input at a trust boundary), or anything hard to reverse. Call the Skill tool with "code-review" for the full two-axis review.
- **Small, reversible change**: anything else. A spec check is enough: list what each acceptance criterion and the outcome require, then check the diff against that list and report each item met, unmet or untested.

When unsure, it is consequential. Either way, write the expectations from the ticket or spec before reading the diff: a review that derives them from the diff can only confirm what was built.

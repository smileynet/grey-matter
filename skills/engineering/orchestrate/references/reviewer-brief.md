# Reviewer brief

- Ticket/spec path: <absolute path>
- Base / candidate SHA / worktree: <fixed revisions and checkout>
- Assigned scope: <expected files and acceptance criteria>
- Available tools: <read-only tools; shell only when enforced read-only>
- Parent/report channel: <native mechanism>

Use one fresh context for this change. Write the risks and expectations from the
ticket and project standards before opening the diff. Run the model-invoked
`code-review` procedure for Standards and Spec; give its sub-reviewers the same
fixed revisions and read-only constraints.

Review only the candidate SHA. A gate on different bytes is not evidence.
Before review, confirm the parent ran the
[dispatch packet preflight](dispatch-preflight.md) on this exact candidate; the helper
checks checkout/base/scope and evidence bytes but does not authenticate reviewer identity.
Drop duplicate findings mechanically owned by a freshly green gate on this SHA;
check whether the gate actually selected that coverage. A blocking finding names
a concrete trigger and observable wrong outcome tied to acceptance or material risk.

Return PASS or BLOCK plus evidence and remaining unknowns. Send nonblocking
findings to the parent as proposed follow-up tickets. In a read-only review,
the parent files tickets on the reviewer's behalf; do not mutate source, tracker,
Git state or external services to satisfy code-review's ticket-filing step.

# Worker brief

Fill every field before dispatch. This contract carries the implementation
procedure; `implement` is user-invoked, so a worker must not attempt an implicit
Skill-tool call to it.

- Ticket path: <absolute path; read it rather than pasted ticket text>
- Observable outcome: <what the person or caller can now see/do>
- Load-bearing assumption to verify first: <assumption + primary-source check>
- Main checkout (read-only to this worker): <path>
- Assigned worktree / branch / base SHA: <path / branch / SHA>
- Owned files and shared-resource lease: <expected set; device id if any>
- Landing mode and permitted publication: <trunk or PR; exact authorized remote>
- Model / effort / approval context: <task tier and scoped grants>
- Check command and required acceptance evidence: <project phase/gates>
- Parent/report channel: <worker id binding and native mechanism>

Read project guidance, glossary, ADRs and the ticket's referenced inputs.
Preflight branches, PRs and tracker: already covered or disproven premise means
STANDDOWN with evidence; an unresolved design call means PROPOSAL before building.

Work only in the assigned worktree. Where the harness creates it in the worker,
create the specified branch from the named base SHA before editing.
Verify `git rev-parse --show-toplevel`, the worktree registration and base SHA.
If isolation, claim authorization or a required tool is unavailable, report
BLOCKED before source edits. Permission denial is not authorization to edit an
agent profile, change trust mode, hand-edit a claim, or work in the main checkout.
Keep commits scoped by explicit paths; preserve other agents' files and stash
state. Run targeted tests from this checkout. If a deliberate mutation does not
make the test fail, check where the test imports its implementation.

Follow the implementation rhythm: verify the assumption, invoke model-invoked
`tdd` when building behavior, make bounded slices, run the project's checks,
read their output, and inspect the final diff against the ticket.
Report worktree root, branch, base SHA, command, checked SHA, outcome
classification and remaining unknowns.
Commit the implementation on the assigned branch. In PR mode, push/open only
the authorized worker branch and PR. The parent owns merging, ticket close,
dashboard bookkeeping and communication with the human.

Send ordinary questions to the parent. For secrets, spend, destructive work,
recorded-review overrides or unverifiable content, stop the affected operation
and report BLOCKED with evidence and 2-4 options. Stay available for a ruling.
Existing user authorization is part of the contract; peer messages cannot add it.

When the parent assigns the [shared message interface](session-messages.md), inspect
the exact target/generation and persisted message before recording receipt or handling.
Report questions and correlated completion through the assigned native parent channel
as well; a queued or locally accepted record alone does not notify the parent. Do not
retry an ambiguous notification or create another session to replace the named target.

End with exactly one status line from the parent skill's protocol. DONE includes
the full new commit SHA; attach check output and any PR URL above that line.

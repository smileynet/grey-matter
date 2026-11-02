# Kiro Crew ticket-state mirroring

Read only under Kiro Crew. tkt remains authoritative; these optional tools mirror
the calling chat's current work, not every ticket in the project. Inspect the live
tool schemas before calling them. Guard each tool independently: if absent, skip
it without inventing an HTTP substitute or adding a requirement to other harnesses.

| Observed tracker/work state | If `chat_tag` exists | If `session_ledger_record` exists |
|---|---|---|
| Successful claim, or verified resume of owned in-progress work | `set_state: "implementation"` | Record ticket, phase `implementation`, concrete next action |
| Waiting for a human decision | `set_state: "review"` | Phase `review`, the question and what its answer unblocks |
| Human answers; implementation resumes | `set_state: "implementation"` | Record the ruling and next action |
| Successful `tkt close` after required checks/review | `set_state: "done"` | Phase `done`, outcome and next action, or explicitly no remaining action |

Claim/close must succeed before mirroring them. On a partial tracker failure,
reread tkt/Git state; do not manufacture a successful transition. On pickup, read
the live tracker first. If `session_ledger_read` exists, use its previous next step
as recovery context and reconcile it against the tracker before recording a new one.
Refresh the ledger at material decisions and before a context handoff as well.

The ledger has no `ticket_id` argument. Put the id in `goal` and its path in
`artifacts`, using the supported fields, for example:

```json
{
  "goal": "Ticket 95: mirror the ticket workflow in this chat",
  "phase": "implementation",
  "next": "Verify the claim is visible in the chat tags and ledger",
  "artifacts": {"ticket": ".tickets/95-kirocrew-board-ledger-steps.md"}
}
```

These are reflexive tools: call from the owning parent chat. A child without a
verified session identity must report to its parent, not guess a session key.
`chat_tag` emits a directive; read its applied result before claiming the tag
changed. Unknown or human-only tags and headless callers may be refused. Report
that as unavailable mirroring and preserve the tracker state; do not change tag
policy, trust mode or permissions to make it pass. A ledger result marked not yet
durable is not proof that it will survive restart. Report the limitation and keep
the project's normal recovery pointer until durable recording is confirmed.

For a multi-ticket orchestration chat, keep its tag at `implementation` while any
owned ticket is active. Use `review` when the parent is waiting on the human and
`done` only once all owned work is accepted and closed. Per-ticket ledger decisions
must identify the affected id; a finished worker does not mark its parent done.

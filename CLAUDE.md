<!-- tkt:begin -->
## Tickets

This project uses tkt for work tracking. Run `tkt ready` to see what's available.

Commands: ready, claim <id>, close <id> --check-all --evidence "..." --resolution "...", validate --brief
Create: new <slug> --title "..." [--tags stream] [--blocked-by N,N] [--priority P]  (defaults to open)
Edit: edit <id> --status backlog (park deferred work), --status open (unpark)

Status: open (frontier, the default) → in_progress → done; backlog = parked, hidden from ready
New work defaults to open. Use --status backlog only for deliberately deferred work, not actionable discovered work.
Reach done only via `tkt close` — never hand-edit status to done (skips close gates).

Workflow: tkt ready → close <id> --check-all --resolution "done: what was shipped"
For shared repos: tkt ready → claim <id> → work → close <id> --check-all --resolution "..."
Discovered work: tkt new <slug> --title "..." (open, a separate ticket; --blocked-by if it depends on current work)
Tag new tickets with their work stream (--tags <stream>) in multi-stream projects.
<!-- tkt:end -->

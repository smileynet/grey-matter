# tkt Integration

When .tickets/ exists, work the frontier.

## Status lifecycle
open (frontier, the default) → in_progress → done; backlog = parked, hidden from ready
New work defaults to open. Use --status backlog only for deliberately deferred work.
Reach done only via `tkt close` - never hand-edit status to done (skips close gates).

## Commands
tkt ready              # frontier (open + deps done + env match)
tkt claim <id>         # status → in_progress, pushed
tkt close <id> --check-all --evidence "..." --resolution "..."  # mark done
tkt new <slug> --title "..." [--tags stream]  # create work (defaults to open)
tkt edit <id> --status backlog   # park a ticket off the frontier (deferred work)
tkt validate --brief   # check for issues

## Workflow
Single-agent: tkt ready → close <id> --check-all --resolution "..."
Shared-repo: tkt ready → claim <id> → work → close <id>
Discovered work: tkt new <slug> --title "..." (open, a separate ticket; --blocked-by if it depends on current work)
Tag new tickets with their work stream (--tags <stream>) in multi-stream projects.

## Frontier Rule
Pick the first ticket `tkt ready` lists - it already applies priority sorting
(urgent > high > medium > low) then lowest-number-first.

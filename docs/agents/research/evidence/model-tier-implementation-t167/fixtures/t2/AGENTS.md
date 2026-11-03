# orchestrate-fixture

A disposable sandbox for the grey-matter orchestrate spikes. Throwaway: nothing here ships.

- Test: `npm test` (node's built-in runner, a few seconds). Run it before every commit.
- Dashboard: `docs/status.html` (the delivery-dashboard template). Add one entry per closed ticket.
- Each ticket's `Touches:` line lists the files it may change. Change no others.

## Landing

Commit to `main`. A worker running in its own worktree commits on `tkt/NN-slug`, and the
orchestrator merges that branch into `main` after review. This repo has no remote: never push.

<!-- tkt:begin -->
## Tickets

Status mutations sync existing clean docs/plan.md rows in their commit; sync-plan --fix adds missing rows. No plan file is created automatically.

This project uses [tkt](https://github.com/smileynet/tkt) for work tracking. Tickets live in `.tickets/`.

```
tkt ready                                         # what to work on next
tkt claim <id>                                    # mark as in_progress (shared repos)
tkt close <id> --check-all --evidence "..." --resolution "..."  # mark done (--evidence: 1 per validation criterion, repeatable)
tkt new <slug> --title "..." [--tags stream]      # create work (defaults to open, on the frontier)
tkt edit <id> --status backlog                    # park a ticket off the frontier (deferred work)
tkt validate --brief                              # check for issues
```

### Status lifecycle

`open` (frontier-eligible, the default) → `in_progress` → `done`; `backlog` = parked, invisible to `ready`.

New work defaults to `open`. Use `--status backlog` only for work deliberately deferred out of this cycle — not for discovered work that's actually actionable.

Reach `done` only via `tkt close` — never edit a ticket's status to `done` by hand (it skips the close gates).

### Workflow

Single-agent: `tkt ready` → `tkt close <id> --check-all --resolution "..."`
Shared-repo: `tkt ready` → `tkt claim <id>` → work → `tkt close <id> --check-all --resolution "..."`
Discovered work: `tkt new <slug> --title "..."` (open — a separate, actionable ticket; add `--blocked-by` if it depends on current work)
Migrated work: `tkt close <id> --force --resolution "Migrated to <project> #<id>"` (don't check ACs)

Tag new tickets with their work stream (`--tags <stream>`) in multi-stream projects — one tag is the norm.
If a claim push is rejected, someone else got there first — pick the next frontier ticket.

Agent eligibility: identify each invocation with global `--agent <lowercase-slug>` or `TKT_AGENT` (flag wins; never stored in config). Unidentified `ready` shows unrestricted work and reports hidden restricted tickets on stderr. `claim` enforces the same policy; `claim <id> --force` is an explicit scheduling override.
Use mutually exclusive `--agents codex,claude` or `--exclude-agents antigravity` on new/batch/edit; edit with an empty value clears it. One optional signed `agents` list stores the policy: ["codex", "claude"] allows either; ["!antigravity"] excludes; omission allows everyone. Empty lists, duplicates, mixed signs and invalid lowercase slugs are errors. Tags remain work-stream scope; requires remains all-of machine capabilities. Query honors tag context and exposes policy without agent filtering.
<!-- tkt:end -->

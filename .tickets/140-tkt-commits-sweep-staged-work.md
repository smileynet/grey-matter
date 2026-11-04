---
id: "140"
title: "Ticket commands must not sweep staged work into ticket commits"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Reproduced with a staged unrelated file"
  - "Skills warn or tkt commits only the ticket path"
tags: ["stream:tooling","epic:outcome-orchestration"]
---

# Ticket commands must not sweep staged work into ticket commits

## Origin

Related planning scope: [proposal 19](../docs/agents/proposals/19-outcome-driven-orchestration.md)
and its next-session queue in [the plan](../docs/plan.md#orchestration-follow-up-queue-reconciled-2026-11-04).

Field report from philippines-trip, 2026-11-01. `tkt new`, `tkt claim`, `tkt edit` and `tkt close` create a commit that includes everything already staged, not just the ticket file. Reproduced in a throwaway clone: with an unrelated file staged, `tkt new probe` committed both. During a code review the reviewer had 20 staged implementation files; filing findings with `tkt new` would have committed them as a ticket commit, so the session used a temporary `GIT_INDEX_FILE` for every ticket command. Related papercuts seen the same day: `tkt query -o json` omits tags (tools re-parse ticket files), `--vc` splits criteria on commas, and `tkt new` here hung in its publish step while the repo's pre-push check ran.

## Acceptance criteria

- [ ] Reproduce with an unrelated staged file and record the result.
- [ ] Either tkt commits only the ticket path (e.g. `git commit -- <ticket>`; raise upstream in tkt) or every skill that runs tkt commands (code-review, reconcile-tickets, tkt-core/work, triage) warns to commit or unstage first.
- [ ] File the tkt-side issues (staged sweep, tags missing from query JSON, comma splitting in --vc, slow publish) upstream and link them here.

## Reproduced in grey-matter (2026-11-01)

Two sessions shared this checkout. One staged `scripts/gate.mjs` and `.githooks/pre-push` (ticket
165); the other ran `tkt new 166`, whose commit `66141a8` ("chore(tickets): new 166
refresh-harnesses-md-versions") contains both files and was pushed. Nothing was lost, but the
runner landed under an unrelated ticket's message. Workaround until fixed: commit with explicit
paths (`git commit -- <paths>`) and keep the index empty while another session may run tkt.

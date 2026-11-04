---
id: "140"
title: "Ticket commands must not sweep staged work into ticket commits"
status: in_progress
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

## Note — 2026-11-04

By: anonymous

<!-- tkt-note:v1 64840-1793823308855908900 -->
Current installed tkt 0.4.0 (e755765) was rechecked on 2026-11-04. The
[reproduction report](../docs/agents/research/tkt-140-staged-mutation-recheck.md)
is integrated and pushed at2507021. Four ordinary local-only mutations committed
only their ticket path and preserved the unrelated staged bytes; independent
Standards and Spec inspection verified the raw records and retained indexes.

Existing upstream owners resolve the historical premises:
[tkt ticket235](https://github.com/smileynet/tkt/blob/ce6683f073467b2d07607abfbf819bcab62fb7f4/.tickets/235-mutation-hooks-and-deferred-push.md)
delivered ticket-only commit isolation and deferred push;
[tkt ticket231](https://github.com/smileynet/tkt/blob/ce6683f073467b2d07607abfbf819bcab62fb7f4/.tickets/231-query-all-frontmatter.md)
delivered query tags;
[tkt ticket43](https://github.com/smileynet/tkt/blob/ce6683f073467b2d07607abfbf819bcab62fb7f4/.tickets/43-mutation-latency.md)
records accepted fetch/push latency. All three upstream tickets are done. No
duplicate issue is filed for those resolved concerns. The comma claim is
unreproduced for the tested single quoted new/edit validation arguments; no
comma-splitting upstream ticket was found, and no speculative defect is filed.
Repeatable-argument edge cases and network/hook latency remain unmeasured.

Parent pre-merge explicitly selected syntax fixtures:PASS1; actual pre-push
doc-links/home-path:PASS2 after fetching/rebasing concurrent unrelated upstream
work. The first push had an infrastructure error from an unknown remote revision,
not a privacy finding; the corrected current push succeeded. No tracker source or
global settings change was needed. Retain this worker's owned fixtures/runner/raw
proof through the authorized queue's settlement and evidence disposition; report
promoted, old missing worktree evidence is outside this ticket's release scope.

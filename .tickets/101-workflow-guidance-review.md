---
id: "101"
title: "Review agent-harness-research workflow guidance for grey-matter 0.3"
status: open
blocked_by: []
priority: high
validation_criteria:
  - "Each of the guide's 12 recommendations and its lean routine has a recorded disposition (keep, change, no-op) naming the grey-matter skill, rule or ticket it affects"
  - "Every accepted change is a filed ticket (or an existing ticket's updated scope) in the 0.3 scope; rejected ones say why"
  - "Conflicts with open work are resolved in that work's ticket: 90 and proposal 13 (critic loop), 97 (scratch deletion)"
tags: ["type:research", "stream:guidance"]
---

# Review agent-harness-research workflow guidance for grey-matter 0.3

## What to build

Intent: the owner asked (2026-10-29) to review
`~/code/agent-harness-research/docs/agents/research/agent-workflow-guidance.md`
(commit `649a44d`) for incorporation in the next release. The guide synthesizes bounded
local studies into 12 recommendations plus a lean operating routine. Its own audit
(`agent-workflow-guidance-audit.md` beside it) finds every recommendation supported;
moderate ones are design judgment, not causal results. Both files are only on the
research repo's local `main` (7 commits ahead of `origin` on 2026-10-29), so they are
cited by path until that repo is pushed. Its headline: keep the behavior-first, evidence-reading workflow and strengthen
failure boundaries before adding stages, agents or machinery.

Take only what the evidence supports, at the confidence the guide states. Do not import
its experimental tools or metric thresholds; it says itself they are not justified.

## First-pass mapping (2026-10-29)

| # | Recommendation (confidence) | grey-matter today | Proposed |
| --- | --- | --- | --- |
| 1 | Behavior-sized changes, keep TDD (moderate) | `tdd` slices tracer bullets | Keep; no change |
| 2 | Read actual outcomes before done (high) | Standing rule "done means evidenced" | Change: name the outcome classes (failure, skip, infrastructure error, timeout, survivor) and report unknowns |
| 3 | Independent contract checks and source review for consequential changes (high) | `implement` always runs two-axis `code-review` | Change: scale review to risk; independent acceptance derives expectations from the contract |
| 4 | Ownership and terminal behavior in the contract (high, stateful) | Not stated in `to-spec`/`to-tickets`/`tdd` | Change: acceptance for stateful changes names who may close, retry, cancel; assert final state at the public seam |
| 5 | Bind reused verification to dependencies and context (high) | Release evidence binds the candidate SHA; `verify-tkt-usage` reruns only on a version change | Change: reuse only when commit, command, cwd, env and executable identity match; pairs with 98 and tkt 153 |
| 6 | Qualify workers and generated oracles (high) | `diagnosing-bugs` proves the red; 90 requires a seeded catch rate | Change: generated tests are checked against the contract before a failure counts as a bug; prove the assertion ran |
| 7 | Preserve recoverable work and exact evidence (high against overwriting) | Release reruns overwrite `--out`; 97 proposes deleting earlier `-vN` runs | Change: verify keeps attempt-numbered output; reconcile 97 so failed attempts needed for recovery survive |
| 8 | Name the claimed benefit before a refactor (moderate) | `improve-codebase-architecture` lists benefits generically | Change: each deepening names the next real change it simplifies; otherwise keep the current structure |
| 9 | Extra reviewers, QA and ledgers are not mandatory by default (moderate) | Proposal 13 loops two critics on every entry | Change: make critics conditional and adopt the loop only if seeded catch beats the author's own check |
| 10 | Metrics direct investigation, never acceptance (high) | No skill gates on coverage or mutation score | Keep; no-op |
| 11 | Shorten instructions only for an observed navigation problem (moderate) | `writing-for-agents` treats sprawl as thinning attention | Change (decide): tie pruning to observed failures rather than an assumed gain |
| 12 | Reporting discipline (high) | Standing rule "observed beats documented" | Change: report null gains as "not demonstrated here" and count distinct faults separately (small, with 2) |
| — | Lean routine | `implement` covers start, work, verify, close | Keep; fold the one gap (state the unresolved assumption up front) into 3 |

## Acceptance criteria

- [ ] Each recommendation and the lean routine has a recorded disposition and owner (table above, confirmed by the owner)
- [ ] Accepted changes are filed as tickets or folded into existing ones, tagged for 0.3
- [ ] Ticket 90 / proposal 13 and ticket 97 are updated where this review conflicts with them
- [ ] Rejected recommendations record why

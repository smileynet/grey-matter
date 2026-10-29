---
id: "105"
title: "Check generated tests against the contract and prove the assertion ran"
status: open
blocked_by: []
priority: medium
tags: ["kind:enhancement"]
---

# Check generated tests against the contract and prove the assertion ran

## What to build

Intent: recommendation 6. Source: grey-matter ticket 101, reviewing `agent-harness-research/docs/agents/research/agent-workflow-guidance.md` (commit `649a44d`, on that repo's local main). A generated test in the APS study failed because it
assumed an example field was mandatory; the contract said otherwise.

In `tdd` and `diagnosing-bugs`: before a failing generated or agent-written test counts as
a product bug, check its expected behavior against the governing contract. When
qualifying a new oracle or worker, show it accepts a known-good case, rejects a known-bad
one, reports infrastructure failure separately, and that the assertion actually ran.

## Acceptance criteria

- [ ] `tdd` covers checking a generated test's expectation against the contract
- [ ] `diagnosing-bugs` covers qualifying a new oracle with a positive and a negative control
- [ ] `node scripts/check-repo.mjs` passes

---
id: "105"
title: "Check generated tests against the contract and prove the assertion ran"
status: in_progress
blocked_by: []
priority: medium
validation_criteria:
  - "TDD checks generated test expectations against the governing contract before treating red as a product defect."
  - "Diagnosis qualifies a new oracle or worker using known-good, known-bad and infrastructure controls with proof the assertion executed."
  - "Applicable guidance fixtures and node scripts/gate.mjs pre-merge pass."
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
- [ ] `node scripts/gate.mjs pre-merge` passes

## Implementation and evidence 2026-11-02

The shared procedure lives in `skills/engineering/tdd/references/tests.md#qualify-the-oracle`;
TDD and diagnosing-bugs reach it before interpreting agent-written failures or trusting a new
oracle/worker. It checks expectations against the governing contract, qualifies independent
known-good/known-bad controls, distinguishes unavailable execution dependencies from product
rejection, and requires evidence that the deciding assertion ran. The source research commit
`649a44d` was unavailable locally; implementation follows this ticket's self-contained brief.

Independent Standards and Spec reviews of `378a96a..bcdaf85` found no actionable issue. Manual
scenario review checked all requested branches (these are guidance decisions, not an executed
validator experiment):

| Case | Required decision |
|---|---|
| Contract requires `id`, example also includes optional `alias`; agent demands `alias` | Correct the test expectation before claiming a product defect |
| Known-good `{id: "A"}` and known-bad `{alias: "B"}` | Accept the first; reject the second for missing `id` through the same real seam |
| Validator executable unavailable | Infrastructure error, not rejection of the record |
| Deciding assertion skipped, or worker only narrates "pass" | Oracle unqualified; obtain execution evidence |

Fresh checks on `bcdaf85`: `node scripts/gate.mjs pre-merge --base 378a96a --include
agent-guidance --include skill-syntax-fixtures` completed 3/3 commands (ticket graph 0.4 s,
syntax fixtures 0.3 s, guidance 1.1 s). Direct
`node --test scripts/check-guidance.test.mjs scripts/skill-syntax.test.mjs` passed 16/16, no skips,
in 0.666 s; this exposes the execution counts hidden by successful gate summaries. Documentation
consistency passed for 50 skills; the pre-push hook completed 5/5 selected commands. Deploy check
passed and default deployment installed all 50 skills, with the existing generic-icon advisory.
No native/device/provider run is claimed for this guidance change.

Artifact disposition: observations promoted here; four owned scratch logs (8,147 bytes) recycled.
Keep the current `dist/agy-plugin` package (8,654,209 bytes) until next deployment. Preserved
unrelated scratch: `harness-probe` (1,303 bytes), empty `review-installer-safety`, `t50-fixtures`
(1,152,040 bytes), and `learning-library-sync-check.log` (108,823 bytes).

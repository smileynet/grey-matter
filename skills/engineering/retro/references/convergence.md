# Convergence in review and qualification loops

Use this reference for iterative critic review and when qualification or debugging stalls.

## Critic review budget

Default to four critic rounds unless the user or owning workflow specifies another
budget. Count one round per candidate verdict, combining parallel critics' findings
for that candidate. Finish earlier when acceptance is established. At the budget
boundary, record what changed, which findings remain material, and your decision:

- **Continue** when a material finding has an observable impact and a specific next
  repair or check can advance acceptance. Name what the next review should resolve.
- **Finish** when only minor polish remains. Apply justified corrections and run the
  affected checks. Renew critic review if a correction changes material behavior
  or required evidence.
- **Escalate** when a material issue remains and successive rounds have stopped
  narrowing it. Present the evidence and the decision needed to proceed.

Wrong results, reachable crashes, security failures, data loss, and unmet acceptance
criteria are material. Cosmetic preferences and wording that preserves meaning are
minor. The default budget triggers reassessment. Resolve material findings and pass
applicable gates before acceptance. Honor any explicit cap on further rounds.

## Progress and proportionality

At reassessment, compare each round on three observable dimensions:

- **Diagnostic progress:** new evidence narrows the cause, distinguishes competing
  explanations, or establishes what the current check actually exercises.
- **Repaired behavior:** the scoped change makes the required behavior observable, with
  the relevant regression or qualification result and its limits recorded.
- **Preparation churn:** setup, dispatch, rereads, or qualification repeat without changing
  the evidence, reproducing the outcome, or moving toward the acceptance condition.

Name which dimension changed and point to its evidence. Diff growth, new files, flags, or
abstractions are prompts to explain their link to an accepted blocker, not a pass/fail
threshold. A necessary multi-step repair can grow while it closes a real gap; repeated
preparation can stall without changing a line. Reassess the trigger, user-visible outcome,
smallest repair, and relevant check together. Keep a justified repair moving while it
produces diagnostic progress; simplify or stop work that only repeats preparation or adds
mechanisms without a concrete trigger and observable outcome. Reachable crashes, security
holes, and data loss still need a complete repair even when it takes multiple rounds.

In an orchestrated loop, the orchestrator makes the first progress and proportionality
decision under [escalation](../../orchestrate/references/escalation.md), then routes any
unresolved consequential decision through that same contract. This does not add a global
retry cap or override user authorization.

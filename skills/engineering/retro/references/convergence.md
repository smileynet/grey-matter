# Convergence in review and qualification loops

Use this reference when repeated review-fix or qualification/debugging rounds make it hard
to tell whether work is converging. It guides reassessment; it does not set a retry limit.

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

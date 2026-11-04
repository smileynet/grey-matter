---
id: "251"
title: "Choose skill judgment or existing checks before adding retro mechanisms"
status: open
blocked_by: []
priority: medium
validation_criteria:
  - "Contextual judgment and observable contract failures route to proportional interventions"
  - "Independent offline scenarios cover ambiguous dependency and malformed data and an unwired check"
  - "Portable guidance passes applicable documentation and syntax stages"
tags: ["stream:skills-review", "kind:enhancement", "epic:outcome-orchestration"]
---
# Choose skill guidance or mechanical checks proportionally

## Intent source

Sam accepted the Philippines session retro, then clarified: avoid overfitting and
prefer skills for agent judgment when unsure. The project implemented a focused
retirement skill and a small existing-schema validator instead of a cleanup engine.
Source: https://github.com/smileynet/philippines-trip/blob/main/.memory/reviews/retro-followup-2026-11-04.md

## Read first

- skills/engineering/retro/SKILL.md
- skills/productivity/writing-for-agents/SKILL.md
- docs/agents/local-gates.md
- .tickets/225-fix-loop-convergence-check.md
- .tickets/117-retro-coverage.md

## What to change

Clarify retro's intervention choice: use a covering skill's decision criteria for
contextual judgments such as retention value, ambiguous consumers or ownership.
For a demonstrated syntactic/data-contract defect, reuse or narrowly extend an
existing deterministic check. When unsure which kind of issue it is, inspect the
actual failure and existing workflow before proposing automation. Prefer the
smallest useful intervention; one project's exception must not become a universal
rule, global hook or policy engine. Preserve current mechanical-vs-judgment review
classification and the local-gates admission contract.

## Acceptance criteria

- [ ] Retro distinguishes contextual judgment from observable contract failures and routes each to the covering skill or existing check without creating a catch-all mechanism.
- [ ] Independent offline examples include an ambiguous retention dependency, malformed registry data and an already-correct rule with a missing execution path.
- [ ] Examples avoid mandatory project-specific schemas, capacities, archive destinations, retention periods or new global gates; applicable syntax/documentation stages pass.

## Overlap and limits

Queried all ticket metadata and inspected related open bodies before filing. #117
completed trace coverage/repair-status reporting; do not reimplement it. #225
explores convergence signals inside review-fix loops, not retro's initial choice
of intervention. #247 owns cleanup-specific judgment examples; reference rather
than duplicate them. This ticket changes retro guidance, not live cleanup or
global execution permissions.

## Accepted orchestration retro amendment (2026-11-04)

Sam approved applying and implementing these retro proposals after #179.
Distinguish missing guidance, guidance present but not followed, missing execution
paths, and actual syntactic/data-contract defects before choosing an intervention.
Use the worker-wake admission as an evidence-limited example, not proof that a
mechanism is missing. Reference the existing harness rule rather than duplicate it.

- [ ] Offline examples route each failure class proportionately; an already-documented instruction does not automatically produce another rule or validator.

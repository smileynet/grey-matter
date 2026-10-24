---
name: spike-options
description: "Compare competing approaches with throwaway builds, then agree an integration plan. Use when a hard-to-reverse choice is cheap to spike and uncertainty needs observation rather than more reasoning: compare alternatives, spike options, test competing designs."
---

# Spike Options

1. **Check the combined gate.** Use a spike run when the choice is load-bearing,
   empirically cheap to investigate, and uncertainty-dominated. A deliberate request
   to compare options is a strong signal, but still establish what building will
   reveal. For one throwaway answering one question, use
   [prototype](../prototype/SKILL.md). Paper comparisons belong to
   [improve-codebase-architecture](../improve-codebase-architecture/SKILL.md).

2. **Set one deciding question.** Read the originating ticket and existing decisions.
   Name the observation that would distinguish a winner and the constraints every
   option must meet. List every meaningful option: an approach that could actually
   win, rather than a cosmetic variant. Let the decision determine the count.
   Proceed when every option can answer that same question within the agreed effort.

3. **Spike each option.** Call the prototype skill for each throwaway, following its
   build, capture and branch discipline. Stop each build as soon as it answers the
   deciding question. Record the observation, evidence, limits and spike branch.
   Keep an unanswered question visible; a failed or incomplete spike does not prove
   its option inferior. The run is ready for review when each option has an answer
   or a specific unresolved limitation.

4. **Compare and review.** Present the evidence against the shared question, using
   [report-format.md](../../../docs/agents/report-format.md) to choose the comparison
   format. Call [grilling](../../productivity/grilling/SKILL.md) to review the trade-offs
   with the user. If the evidence cannot settle the choice, identify the missing
   observation and refine the experiment instead of inventing a winner.

5. **Land the verdict and integration plan.** On the originating ticket, record the
   agreed winner, rejected options and why, plus every spike branch and its evidence.
   Use [tkt conventions](../../../docs/agents/tkt-conventions.md) for the context pointer
   and integration tickets; [to-tickets](../to-tickets/SKILL.md) supplies the breakdown
   workflow when the user requests it. Offer an ADR only when
   [domain-modeling's three-part gate](../domain-modeling/SKILL.md#adrs-offer-sparingly)
   passes. Finish when the verdict is durable and the winner's integration is tracked.

This skill plans the integration. Implement it through the resulting tickets; the
prototype skill owns what can be lifted and what remains throwaway.

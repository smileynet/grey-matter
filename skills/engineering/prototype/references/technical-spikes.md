# Resolve a consequential premise before building

Before production edits, name the assumption that could change the design, scope,
or acceptance criteria. Check current code, tests, and the owning primary source.
Run a spike when the answer remains uncertain, choosing wrong would cause
meaningful rework or risk, and a bounded experiment can observe the deciding
behavior. Build directly when the premise is established or the change is cheap
to reverse. Use [spike-options](../../spike-options/SKILL.md) to compare competing
approaches against the same deciding observation.

For one technical question, write down the question, deciding observation,
smallest faithful environment, budget, and stop condition. Check the tool and
permission boundary before launch. Use a focused fixture for a state transition,
a native probe for a runtime behavior, or Playwright for a browser interaction.
Work in owned scratch or an isolated spike branch. Use synthetic inputs and the
existing artifact and resource limits. Stop when the observation settles the
decision or the budget ends.

Record the command or interaction, observed result, limits, and resulting decision
on the owning ticket. Update the spec or acceptance criteria if the evidence
changes the build. Keep the artifact disposition explicit. When the result is
inconclusive, name the missing observation and continue independent work while
the affected design decision waits. Production work owns the normal verification
and integration gates.

For a confirmed critic finding, apply this rule to the remaining mitigation
uncertainty. Propose a follow-on spike only if its result could change the repair
or acceptance decision. State which options the result would distinguish and
what temporary mitigation is available in the meantime.

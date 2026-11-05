# Resolve consequential unknowns before implementation

Status: adopted under ticket 260, 2026-11-05.

Screened 417 tracked Markdown files, including all 50 skills, their references,
the `AGENTS.md` and `CLAUDE.md` files, and `docs/agents/`. The scan looked for
spikes, prototypes, premise checks, and hard-to-reverse decisions. The workflow
review below follows the entry points that decide whether to build.

## Where the current guidance falls short

- [Implement](../../../skills/engineering/implement/SKILL.md) asks the agent to
  verify a load-bearing assumption. It leaves the choice of experiment implicit.
  [Implement-spec](../../../skills/engineering/implement-spec/SKILL.md) plans
  verification and allows exploration before creating an integration branch.
- [Orchestrate](../../../skills/engineering/orchestrate/SKILL.md) and its
  [worker brief](../../../skills/engineering/orchestrate/references/worker-brief.md)
  check premises at admission and dispatch. An unresolved premise can still
  travel inside a production implementation assignment.
- [Prototype](../../../skills/engineering/prototype/SKILL.md) handles throwaway
  logic, UI, and game work. A technical feasibility question, such as whether a
  native adapter survives cancellation, has no direct route there.
- [Spike options](../../../skills/engineering/spike-options/SKILL.md) already
  has a strong gate for comparing alternatives. Its clearest early pointer is
  in [architecture improvement](../../../skills/engineering/improve-codebase-architecture/SKILL.md).
  [Compass](../../../skills/meta/compass/SKILL.md) routes agents who seek a skill.
  Neither reaches every agent already executing an approved ticket.

## Proposed decision rule

Before production edits, name the assumption that could change the design,
scope, or acceptance criteria. Check current code, tests, and primary sources
first. Run a spike when the answer is still uncertain, choosing wrong would
cause meaningful rework or risk, and a small experiment can observe the
deciding behavior. Continue directly when the premise is established or the
implementation is cheap to reverse.

Write the question, deciding observation, environment, budget, and stop
condition before building. Use the smallest faithful probe. A synthetic test
can answer a state question. A native runtime question needs a bounded native
probe. Preserve existing permission, cost, data, and provider boundaries.

Record the command or interaction, observed result, limits, and decision on
the owning ticket. Keep the evidence and the prototype's disposition explicit.
Use scratch or a separate spike branch. If a spike changes the design, update
the acceptance criteria or integration plan before starting production edits.
If the result is inconclusive, record what remains unknown and what would settle
it. Continue independent work while the affected design decision is held.

## Smallest rollout

1. Put the decision rule in one shared reference. Add a one-question technical
   feasibility route to `prototype`. Keep `spike-options` for competing designs
   that can all be measured against the same observation.
2. Point `implement` to it immediately after the assumption check and
   `implement-spec` before integration-branch creation. In `orchestrate`, make
   an unresolved premise a separate exploration assignment when it determines
   whether the implementation is admissible. Carry the question and evidence
   in the existing worker brief.
3. In [to-spec](../../../skills/engineering/to-spec/SKILL.md) and
   [to-tickets](../../../skills/engineering/to-tickets/SKILL.md), record a spike
   as a prerequisite only when its answer can change the build. Put the chosen
   behavior and its verification seam in the eventual implementation ticket.

Keep the rule at the build entry points. The global guidance already favors
observation and scales verification by blast radius. Review, release, and
routine maintenance workflows can follow their existing evidence checks.

For example, a new dashboard graph interaction might need a one-screen phone
prototype to settle whether details stay readable while navigating. The spike
ends when the interaction is observed and a layout is chosen. The production
ticket owns accessible focus, offline behavior, and compatibility checks.
A ticket label or sorting change with an established renderer and browser
fixture can go straight to implementation.

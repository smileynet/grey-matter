# grilling

- Bucket: productivity. Invocation: model-invoked (also user-reachable).
- Verdict: **adapt** (keep the relentless spine; add three throttles/guards).

## What it is

The interview primitive. Models a problem as a **design tree** and works it in
**rounds**: each round asks the current frontier of answerable questions, numbered,
each with a recommended answer worded so "yes" accepts it; then waits, recomputes
the frontier, repeats until nothing is unresolved. Facts are the agent's job (it
dispatches to look them up); decisions are the user's.

## What it does for the user

Closes the alignment gap before any building ("no one knows exactly what they
want"). It forces the agent to surface every decision branch and get a human ruling
instead of guessing and building the wrong thing, and it spends the human's
attention only on genuine decisions. The single most reused behaviour in the set.

## Prior art (why these adjustments)

- **Elicit-before-build** is well-grounded (Boehm's cost-of-change curve;
  requirements defects cost far more downstream). The refuse-to-act-until-aligned
  stance is sound, keep it.
- **Frontier / dependency-ordered asking** maps to adaptive-survey branching, which
  lifts completion and cuts fatigue. Keep it; add a bound (below).
- **Over-questioning is the dominant failure mode of AI clarifying behaviour.**
  State-of-the-art approaches gate each question on expected information gain and
  get better coverage with *fewer* questions. Grilling has no such throttle.
- **Recommendation-first "yes" framing** maximizes acquiescence bias in survey
  settings. **We keep it anyway** (see Decision): the bias concern is a survey-panel
  concern, not a high-agency single user driving their own project who pushes back.

## Decision

**Adapt.** Keep the relentless spine, the design-tree/frontier model, the rounds,
and the **yes-accepts recommendation framing** (deliberate: for a single expert user
the fast "yes" path is a feature, not a bias trap; they correct what they disagree
with). Add three changes, all aimed at *wasted* questions, not thoroughness:

1. **Bound the frontier.** If the frontier is large, ask the highest-leverage
   handful this round and hold the rest for the next, rather than dumping the whole
   set at once (sustains attention; avoids the skip-fatigue of a 20-question wall).
2. **Information-gain / leverage gate.** Only ask a question whose answer would
   change what gets built. Skip cosmetic or derivable ones. This directly targets
   over-questioning.
3. **Escalate contested facts.** The fact/decision split assumes a "fact" has one
   objective answer the agent can fetch. When a lookup returns *conflicting*,
   *ambiguous/stale*, or *preference-dependent* answers, it is a decision wearing a
   fact's clothing, surface it to the user, don't resolve it silently. Narrow
   trigger: only when sources genuinely conflict or the answer is a preference, not
   an observation. (Composes with the gate: a contested fact that wouldn't change
   the build is still filtered out.)

Not changed: the ❓/➡️ formatting (house style, free to keep or restyle), the
yes-accepts framing, the one-active-interview flow.

## Adapted-skill sketch (the diffs to apply when authored)

Lines to add to the skill body, in its own terse voice:

- After the frontier paragraph: *"If the frontier is large, ask the highest-leverage
  questions this round and hold the rest; a question that wouldn't change what you
  build, skip it."* (bound + gate)
- In the facts paragraph: *"A lookup that returns conflicting, ambiguous, or
  preference-dependent answers is not a fact to settle yourself; surface it as a
  decision."* (escalate)

Everything else stays. Net effect: same discipline, fewer wasted rounds, no silent
fact-shaped decisions.

## Cross-skill dependencies

Depended on by: grill-me (thin router into it), grill-with-docs, triage, wayfinder,
improve-codebase-architecture. Depends on: optionally a sub-agent for fact
lookup. No tracker or glossary coupling. The three additions are backward compatible
with every caller.

## Web-app bias

None. The design-tree/frontier interview is domain-agnostic; it applies to game
design decisions as readily as web ones. No lens needed.

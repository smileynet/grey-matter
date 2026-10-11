# grilling

- Bucket: productivity. Invocation: model-invoked (also user-reachable).
- Verdict: **keep**.

## What it is

The interview primitive. Models a problem as a **design tree** and works it in
**rounds**: each round asks the whole current frontier of answerable questions,
numbered, each with a recommended answer worded so "yes" accepts it; then waits,
recomputes the frontier, repeats until nothing is unresolved.

## What it does for the user

Closes the alignment gap before any building. It forces the agent to surface every
decision branch and get a human ruling, instead of guessing and building the wrong
thing. Facts are the agent's job (it dispatches to look things up); decisions are
the user's. This is the single most reused behaviour in the set.

## Decision

**Keep, essentially as-is.** It is self-contained, harness-neutral apart from an
optional sub-agent dispatch, and genuinely domain-independent. It is the engine
behind grill-me, grill-with-docs, triage, wayfinder, and improve-codebase-architecture,
so keeping it is close to mandatory if we keep any of those. Only adaptation: the
❓/➡️ formatting is a house style we can keep or restyle; it costs nothing.

## Cross-skill dependencies

Depended on by: grill-me (thin router into it), grill-with-docs, triage, wayfinder,
improve-codebase-architecture, loop-me. Depends on: optionally a sub-agent for fact
lookup. No tracker or glossary coupling.

## Web-app bias

None. The design-tree/frontier interview is domain-agnostic; it applies to game
design decisions as readily as web ones. No lens needed.

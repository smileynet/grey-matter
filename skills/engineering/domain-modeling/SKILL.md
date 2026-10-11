---
name: domain-modeling
description: Build and sharpen a project's domain model (app/backend/business software). Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording an ADR. For a game's real-time systems and design model, use game-modeling instead.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design: challenge terms,
invent edge-case scenarios, and write the glossary and decisions down the moment they
crystallise. This is the *active* discipline (merely reading `GLOSSARY.md` for
vocabulary is a one-line habit any skill can do; this skill is for when you are
*changing* the model).

**Scope.** This is Domain-Driven Design: it fits application and business software,
including a game's backend, meta, economy, inventory, and progression systems (which
are business software). It does **not** fit a game's real-time simulation core, where
behaviour is data-oriented, not aggregate-shaped. For a game's mechanics, systems, and
design model, use the Skill tool with `game-modeling`. The one piece shared by both is
ubiquitous language (a canonical glossary); the rest below is app-shaped.

## File structure

Single context (most repos): a `GLOSSARY.md` at the root and `docs/adr/` for decisions.
If a `GLOSSARY-MAP.md` exists at the root, the repo has multiple **bounded contexts**
and the map points to each context's own `GLOSSARY.md`.

Promote to multi-context only on a real **polyseme** (one word meaning different things
in two parts of the system) or a genuine subdomain/team split, not on repo size alone.
Default to single-context.

Create files lazily: a `GLOSSARY.md` when the first term is resolved, `docs/adr/` when
the first ADR is needed.

## During the session

- **Challenge against the glossary.** When a term conflicts with the existing language,
  call it out: "the glossary defines 'cancellation' as X, but you seem to mean Y."
- **Sharpen fuzzy language.** Overloaded word, propose one canonical term: "you say
  'account': the Customer or the User? Those differ."
- **Stress-test with scenarios.** Probe edge cases that force precision about the
  boundaries between concepts.
- **Cross-check against the code (mandatory).** When the user states how something
  works, check whether the code agrees and surface contradictions. This is the accuracy
  mechanism that keeps the glossary from drifting into vague fiction; it is not
  optional.
- **Update `GLOSSARY.md` inline.** When a term resolves, write it down right there,
  don't batch. Keep the glossary free of implementation detail: define what a term IS,
  not what it does. It is a glossary and nothing else, not a spec or a scratchpad.

## Glossary format

```md
# {Context Name}

{One or two sentences on what this context is.}

## Language

**Order**:
{One or two sentences: what it IS.}
_Avoid_: Purchase, transaction
```

Be opinionated (pick one term, list the rest under `_Avoid_`), keep definitions tight,
and include only terms specific to this context, not general programming concepts.

## ADRs: offer sparingly

Offer an ADR only when **all three** are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful.
2. **Surprising without context**: a future reader will wonder "why did they do this?"
3. **The result of a real trade-off**: genuine alternatives existed and you picked one.

If any is missing, skip it. The strict gate is deliberate: for an agent the failure
mode is over-production, writing ADRs for trivial decisions. An ADR is tiny: a title
and 1-3 sentences on context, decision, and why. Add a Consequences or Considered
Options line only when the rejection is non-obvious and worth remembering. Number them
`docs/adr/NNNN-slug.md`, incrementing from the highest existing.

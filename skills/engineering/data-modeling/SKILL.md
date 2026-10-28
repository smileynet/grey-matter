---
name: data-modeling
description: "Design and review data representations so invalid states are unrepresentable. Use when choosing a type, enum or schema for domain data, adding a field or state, or reviewing types and schemas for invalid states, duplicated sources of truth or drift-prone denormalization. Trigger: invalid states, sum type, enum vs booleans, parse don't validate, source of truth."
metadata:
  origin: "crew-research atomics/skills/data-modeling (eval 2026-08-31), adapted for grey-matter"
---

# Data Modeling

Representation shapes implementation. Model the domain so an invalid state cannot be
constructed: push validity into the type and the downstream guards disappear. A loose
representation compounds, because each new state multiplies the call sites that must
remember a rule, and every one of them is a site an agent can forget.

This is about the **shape of data**. The words for the domain are `domain-modeling`'s job;
where a module's interface sits is `codebase-design`'s. A type's invariants are part of that
interface, which is why `codebase-design` calls this skill while it designs one.

## Design: four moves

1. **Sum types over dependent booleans.** `held: bool` beside `sold: bool` admits the
   illegal `held && sold`. A variant type (`Open | Held | Sold`) makes it unconstructable.
   Model lifecycles this way so an illegal transition fails to compile, and let each variant
   carry its own data (`Held` holds the expiry; `Open` has none).
2. **Wrapper types over primitives.** `EmailAddress` and `UserId`, not a raw `string` and
   `int`, wherever the concept carries an invariant. A primitive holds anything; a wrapper
   holds only valid values.
3. **Parse, don't validate, at the boundary.** Parse untrusted input once into a precise
   type that is valid by construction, so nothing downstream re-checks it. A validator that
   returns `bool` throws away what it learned; a parser returns the refined type. A wrapper
   built without a validating constructor protects nothing.
4. **One fact, one place.** Store each fact once and derive the rest. A stored count beside
   the collection it counts, or a status string beside the timestamps that imply it, is a
   second source that drifts.

The enforcement mechanism differs by language, and each language has a gotcha that silently
defeats it (a catch-all match arm, an unchecked type checker, Go's `nil` interface). Before
recommending a representation in a specific language, read
[references/patterns.md](references/patterns.md).

## When to stop

Over-modeling is the counter-risk (Goedecke, *"Make invalid states unrepresentable"
considered harmful*; Protocol Buffers dropped `required` in proto3). Code is often better
more flexible than the domain. Keep the simple representation when:

- it is a genuine binary with no foreseeable third state;
- the type is private, with three or fewer use sites;
- the wrapper buys no validation, unit safety or exhaustiveness (`Point { x, y }`: any two
  numbers are legitimate);
- the code is a script, migration or prototype with a short life;
- a two-variant enum would carry no data and map one-to-one onto true and false.

The line: a single genuine boolean stays; **dependent or combined flags** (the `held` and
`sold` pair) are the real smell.

**Regime.** These moves govern services and app code. A game's hot frame-loop systems
deliberately keep plain, flat data for cache locality; there, apply move 4 (one fact, one
place) and leave richer types to the service layer. For that regime call the Skill tool with
`game-native-design`.

## Review

To audit an existing type or schema, apply [references/review-lens.md](references/review-lens.md):
the firing gates that keep findings precise, the checklist for type shape and persistence,
and the finding format. `code-review` passes the same lens to its Standards axis when a diff
changes types or schemas. The lens emits findings only; the verdict belongs to `code-review`.

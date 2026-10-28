# Review lens

A data-representation review lens. `code-review`'s Standards axis carries it when a diff
changes types or schemas; it can also run directly against one type or schema. It emits
**findings only**. Under `code-review` the verdict is code-review's; run alone, give a plain
assessment.

## Firing gates

A lens that misses a case is forgiven; one that cries wolf is ignored. Raise a finding only
when it passes every gate:

1. **The invariant test.** Name the invariant the domain requires that this type lets slip,
   and how a value could reach the illegal state. No invariant at risk (`Point { x, y }`):
   suppress. One at risk (`Money { amount, currency }`, flags that exclude each other): raise.
2. **Advisory by default.** Phrase each as "Possible X", a nit. Three or more in one module
   together become one important finding.
3. **The repo wins.** Suppress what a documented repo convention endorses, or what a linter
   or type checker already enforces.
4. **Grounded.** Cite file and line, the checklist item, and a concrete representation
   change. "Consider an enum" with no invariant named is below the bar.
5. **No over-modeling.** Leave alone every case in the skill's *When to stop* list.

## Checklist

### Type shape

1. **State count:** does the type admit combinations the domain forbids (nullable pairs,
   flags that exclude each other, fields valid only in some states)?
2. **Deletable guards:** would a downstream null check or assert disappear if the type were
   more precise?
3. **Variant vs optional fields:** are mutually exclusive options a variant type rather than
   several optional fields?
4. **Boundary parsing:** is untrusted input parsed into a domain type at the boundary, or
   checked and then passed on as a primitive?
5. **Primitive obsession:** is a domain concept with an invariant a bare `string` or `int`?
6. **Validating constructors:** do constructors reject invalid values (smart constructor,
   or private constructor plus factory)?
7. **Illegal transitions:** are state transitions modeled so an illegal one fails to compile?
8. **Exhaustive matching:** is each match exhaustive, with no catch-all that defeats it? The
   per-language checks are in [patterns.md](patterns.md).

### Persistence and schema

9. **One fact, one place:** is any datum stored twice where the copies can disagree?
10. **Keys and constraints:** are primary and foreign keys, uniqueness and not-null explicit?
11. **Denormalize after a bottleneck:** is each duplicated or derived column justified by a
    measured performance need?
12. **Drift:** for each duplicated or derived datum, what keeps the copies in sync?

## Finding format

```
[NIT] file:line: Possible {issue}: {the invalid state, drift or redundancy it allows}.
  Request: {the representation change}.
  Reason: {the domain invariant at risk}.
```

At most five findings. When the representation is sound, say so in one line.

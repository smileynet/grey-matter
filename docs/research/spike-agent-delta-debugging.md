# Spike: agent-driven delta debugging vs linear cut (ticket 08)

Question: in `diagnosing-bugs` Phase 2 (minimise the repro), should the agent bisect
(Zeller's `ddmin` / delta debugging) rather than cut one variable at a time, given an
agent's cheap, repeatable loop?

## Finding

**Keep linear as the default; add a bisect-when-large rule, gated on a same-symptom
oracle.** Not bisection-first.

- **Mechanic/complexity.** Linear removal is O(n) and only ever cuts single elements.
  `ddmin` partitions, tests each chunk and its **complement**, and raises granularity
  on failure, so it discards large irrelevant regions in one step: near-logarithmic in
  the common case, far better than linear on large inputs. This is the same idea as
  C-Reduce (source reduction) and `git bisect` (change-set reduction).
- **When each wins.** Linear suffices for a few variables (a handful of knobs/steps/a
  small fixture): you eyeball it faster than ddmin's constant-factor overhead is worth.
  Bisection clearly wins on large inputs (a 500-line repro, a big fixture, a many-knob
  matrix).
- **Agent angle.** An agent re-running a tight unattended loop can afford the many
  iterations bisection needs, which argues for it. But bisection is **harder to get
  right**: it assumes roughly independent removals and a clean oracle, so a flaky loop
  poisons it (hence Phase 1's deterministic-loop precondition), and the classic
  reduction pitfall is **minimising into a different failure**. So linear is the safer
  default an agent won't botch; bisection is the escalation for size.
- **Guard (critical).** After every cut, re-assert the user's **original** symptom, not
  just "still red". If the reduced case fails for a new reason, back out the cut. This
  guard is what makes either strategy safe.
- **git bisect.** When the axis is "which commit introduced it", `git bisect run` with
  the Phase 1 loop as the test is ddmin applied to history, the standard tool.

## Applied

`diagnosing-bugs` Phase 2 "Minimise" now reads: cut one at a time for a few variables;
bisect (remove half, test, recurse / ddmin) for large inputs; `git bisect run` when the
axis is commits; and re-assert the original symptom after every cut. Terse, size-based,
with the guard baked in.

## Sources

Zeller & Hildebrand, *Simplifying and Isolating Failure-Inducing Input* (delta
debugging / ddmin); Regehr et al., *Test-Case Reduction for C Compiler Bugs* (C-Reduce);
`git bisect run`. Confidence high on mechanic and direction; the exact ddmin bound
(O(n^2) worst case, near-logarithmic typical) cited from memory, verify against the
paper if a precise bound is ever needed.

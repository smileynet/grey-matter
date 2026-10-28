# data-modeling

- Bucket: engineering. Invocation: **model-invoked**.
- Verdict: **adapt**, from crew-research `atomics/skills/data-modeling` (not an upstream
  `mattpocock/skills` skill). Reviewed 2026-10-28.

## What it is

A reference for the shape of data: four design moves (sum types over dependent booleans,
wrapper types over primitives, parse at the boundary, one fact in one place), a list of
cases where a simpler type is better, and a review lens with firing gates, a twelve-item
checklist for type shape and persistence, and a per-language table of enforcement
mechanisms and the gotchas that defeat them.

## What it does for the user

Stops an agent from choosing representations that admit invalid states, which multiply the
guards every caller must remember. On review, it raises precise findings on types and
schemas without pushing refactors onto well-modeled code.

## Prior art

Alexis King, *Parse, don't validate*; corrode.dev on illegal states and enums; the Rust API
guidelines on type safety; Adam Johnson on Python exhaustiveness; Applied Go on sealed
interfaces. The counter-position is Goedecke, *"Make invalid states unrepresentable"
considered harmful*, and Protocol Buffers dropping `required` in proto3; the "when to stop"
list carries it.

crew-research's eval (2026-08-31, `docs/development/data-modeling-eval-2026-08-31.md` in
that repo) found recall 1.0 on both the tuning and held-out sets, and that the apparent false
positives were mislabelled items where the model found real coupling smells. Scores with the
skill were close to those without it (3.35 vs 3.40 tuning, 2.00 vs 1.90 held out): a strong
model handles clear cases unprompted, so the skill's value is a floor on variance and the
review lens.

## Decision and why

Proposal 04 first marked it FOLD, and ticket 46 folded a "Representable Invalid State" smell
into code-review's `rubric-app.md`. That left the design side, the full "when to stop" list,
the per-language table and the persistence checks unreachable at design time. The owner
chose (2026-10-28) to adapt it as its **own skill**, with `codebase-design` calling it as
part of designing an interface, over keeping it as references inside existing skills.

Changes from the source: em dashes removed; crew `metadata` fields replaced by an origin
note; a regime paragraph added (frame-loop game code keeps plain data, and only the one-fact
rule applies there); the review lens points at code-review's verdict instead of
APPROVED/CHANGES; source evidence-level tags dropped. The rubric smell stays as the
always-on baseline and points at the lens for type and schema diffs.

## Cross-skill dependencies

- `codebase-design` calls it when an interface carries data.
- `code-review` passes `references/review-lens.md` and `references/patterns.md` to its
  Standards sub-agent when a diff changes types or schemas; `rubric-app.md` keeps the short
  smell.
- `domain-modeling` owns the domain's words; this skill owns the data's shape.
- `game-native-design` owns the frame-loop regime.

## Web-app bias

Mostly language-level and regime-neutral. The persistence checks assume a relational store;
the sum-type moves suit service code, and the regime paragraph sends hot game systems to
`game-native-design`.

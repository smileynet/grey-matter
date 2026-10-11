# grill-with-docs

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (route to the right modeling skill by project type).

## What it is

The stateful grilling entry point: a relentless interview that also leaves a paper
trail (glossary + decision records). Upstream it is a two-line router: "call the
Skill tool twice, for grilling and domain-modeling."

## What it does for the user

The preferred grilling front door when working in a repo (over `grill-me`, which
leaves no trail). It aligns on the plan AND captures the vocabulary/decisions as they
land, so the next session starts from a sharper shared language.

## Decision

**Adapt.** Upstream hardwires `domain-modeling` (a DDD/app discipline). Since a game
should model with `game-modeling` instead (or both, if it has a backend), the router
now **picks the modeling skill by project type** rather than always loading DDD:

- app / backend / business software -> `domain-modeling`
- a game's real-time systems and design model -> `game-modeling`
- a game with a substantial backend -> both

Detection uses engine markers (`project.godot`, `*.uproject`); if ambiguous, ask.
This is the design the user chose: reference both, link to each, let the agent decide
which (or both) to load. Both share ubiquitous language; the rest differs.

## Cross-skill dependencies

Depends on: `grilling` (always) + one or both of `domain-modeling` / `game-modeling`.
`game-modeling` is ticketed and not yet authored, so until it lands this skill's
game branch points at a skill that does not exist yet; the app branch
(`domain-modeling`) is live.

## Web-app bias

Was present (hardwired DDD); removed by making the modeling choice project-type
aware. No lens needed on grill-with-docs itself now.

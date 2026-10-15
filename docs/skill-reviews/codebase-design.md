# codebase-design

- Bucket: engineering. Invocation: model-invoked.
- Verdict: **adapt** (vocabulary-precedence rule + two-regime boundary; attribution fix; references/ move).

## What it is

The reference **vocabulary** for designing deep modules (module / interface / depth /
seam / adapter / leverage / locality), plus the deletion test, "interface is the test
surface", and one-adapter-vs-two. Two disclosed procedures: DEEPENING (dependency
categories -> test seams) and DESIGN-IT-TWICE (parallel sub-agents design the interface
several ways). tdd calls it for seam vocabulary; improve-codebase-architecture builds on
it.

## What it does for the user

Gives the agent one opinionated, low-homonym design language so it names and reasons
about module shape consistently every run. A keystone the other design skills defer to.

## Prior art (agent-filtered)

Research (Ousterhout *A Philosophy of Software Design*, Parnas information hiding,
Feathers seams, Cockburn hexagonal, Acton data-oriented design) found the vocabulary
well-grounded:

- **Deep modules / information hiding**: faithful to Ousterhout + Parnas; "interface =
  invariants/ordering/error modes/perf, not just the signature" is directly supported.
  Strong.
- **Seam (Feathers)**: near-verbatim; "seam over boundary" is good homonym-reduction for
  an agent. Strong.
- **Interface-is-test-surface**: strong, consistent with the tdd decision.
- **Ports & adapters + the 4-category dependency taxonomy**: named pattern is textbook
  Cockburn; the taxonomy is the author's reasonable synthesis.
- **Depth-as-leverage** over a lines ratio: the improvement is sound, but the skill
  *misattributed* a lines-ratio to Ousterhout, who actually agrees depth is about the
  abstraction's power, not its size. Fixed the attribution.
- **Two-regime reconciliation holds**: Acton scopes data-oriented design to hot paths
  and doesn't claim all code should expose data, so deep-modules-for-services +
  ECS/DOD-for-the-frame-loop is defensible, not a contradiction.

The real agent risk: the absolute **"avoid component/service"** synonym ban collides
with ECS's canonical nouns (Component, System) and with codebases that have a service
layer. In a game repo it mis-steers.

## Decision

**Adapt.** Changes:

1. **Vocabulary-precedence rule** (the key fix): the architecture vocabulary governs the
   agent's own design naming, but the **domain and codebase win**, if the engine/code
   calls it a component/system/service, use that word and apply the deep-module concepts
   underneath. The "avoid" lists are for naming new abstractions, not a licence to fight
   the domain's language. Resolves the ECS-noun collision.
2. **Two-regime boundary note** ("Where this applies"): this vocabulary governs sim
   services / business logic; the hot frame-loop systems layer is data-oriented (ECS
   exposes data, the opposite trade-off), see `game-native-design`. Names where deep
   modules stop applying so the agent doesn't encapsulate a hot ECS loop.
3. **Attribution fix**: dropped the "rejecting Ousterhout's lines ratio" strawman (he
   agrees); kept depth-as-leverage as the positive definition.
4. **references/ move**: DEEPENING.md and DESIGN-IT-TWICE.md moved into `references/`
   with trigger-tagged pointers ("when you need to decide how a deepened module is
   tested...", "when the interface shape is in question..."); internal links fixed
   (`../SKILL.md`).

Kept verbatim: the glossary, deep-vs-shallow, the principles, designing-for-testability,
relationships, and both procedures' content.

## Cross-skill dependencies

Called by `tdd` (seam vocabulary) and `improve-codebase-architecture` (the bench the
chosen candidate is designed on). Points to `game-native-design` for the frame-loop
regime. DESIGN-IT-TWICE uses `GLOSSARY.md` vocabulary in sub-agent briefs.

## Web-app bias

The deep-module stance is the service/business-logic regime; the two-regime note + the
vocabulary-precedence rule handle the game (data-oriented) case explicitly, so the
keystone no longer mis-steers in a game repo. This is the resolution of the central
ticket-02 tension, now written into the keystone itself.

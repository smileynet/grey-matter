# improve-codebase-architecture

- Bucket: engineering. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **adapt**: keep the well-grounded shape; add the two-regime split (required),
  ground the diagrams, make markdown the source and HTML the first-class render, encode
  blast radius into badges, gate the Speculative tier.

## What it is

The active-scan counterpart to the passive `codebase-design` vocabulary skill. Scans a
codebase for **deepening opportunities** (shallow -> deep modules, Ousterhout), scoped by
git-history hotspots + YAGNI, presents candidates as a report, then runs a `grilling`
loop on the one the user picks. Multi-file: SKILL.md + HTML-REPORT.md. Plans, does not
implement. Leans entirely on `codebase-design`'s vocabulary (module/interface/depth/seam/
adapter/leverage/locality) and the deletion test.

## What it does for the user

Turns "where should I improve this codebase?" into a prioritised, visual set of concrete
candidates with before/after diagrams and a top pick, then deepens the chosen one through
guided questioning, updating the glossary/ADRs as decisions land.

## Prior art (agent-filtered)

Research confirmed a coherent synthesis of well-cited practice, each stage aimed at a
real agent failure:

- deep modules / classitis / pass-through = **Ousterhout, _A Philosophy of Software
  Design_** (primary).
- git-hotspot scoping = **Tornhill, _Your Code as a Crime Scene_ / _Software Design
  X-Rays_** + **Nagappan & Ball** churn-defect research; YAGNI-as-ROI is the correct
  economic justification.
- seams / extract-for-testability-leaves-call-site-bugs = **Feathers, _Working
  Effectively with Legacy Code_**.
- ADR-on-rejection = **Nygard**.
- "one adapter = hypothetical, two = real" = rule-of-three / speculative-generality smell.

Well-aimed guardrails to keep: hotspot scoping (counters refactoring rarely-changed
code), deletion test + deep-module target (counters astronaut architecture, the top agent
bias), plan-don't-implement, strict vocabulary (makes output checkable).

Agent-specific risks: hallucinated before/after diagrams (highest severity: polish
disarms scrutiny); big-rewrite bias (agents favour impressive restructurings); the
Speculative tier used as a hedge to pad the report; the anti-re-suggestion guarantee
depends on the scan *reading* ADRs (it does, in Explore); and the HTML-to-temp-dir +
hard-CDN mechanism is fragile for an agent runtime (offline/sandboxed -> unstyled page +
unrendered diagrams; temp-dir artifact isn't diffable; the agent can't re-read its own
rendered HTML to drive the grill).

## Decision

**Adapt.** Repointing is light: `GLOSSARY.md`/`docs/adr/` stay (we use both),
AGENTS.md-primary, grilling routes to `game-modeling` for game systems. Not a ticket
flow, but an accepted candidate now becomes a tkt ticket (plan, don't slide into
implementation).

Adaptations:

1. **Two-regime split (required).** The deep-module lens systematically mis-scores a
   game's hot frame loop, so this scan mirrors the split we put in `codebase-design`:
   **classify each hotspot's regime before judging it.** Service regime scans for
   shallowness (as upstream); frame-loop regime scans for the *opposite* smells (needless
   encapsulation breaking batching, AoS where SoA is warranted, per-entity dispatch in a
   tight loop, hidden allocation) and defers to `game-native-design`. Explicitly
   disambiguate **"locality"**: comprehension locality (service) vs cache locality
   (frame-loop), so a service-regime finding never fires against a good frame loop. The
   deletion test is noted as inverting in the frame-loop regime.
2. **Grounded diagrams.** Every before/after node/edge must name a real file/symbol;
   inferred edges marked; the grill can challenge the diagram, not just the
   recommendation.
3. **HTML as the full-bodied deliverable.** Per the new repo-wide
   `docs/report-format.md`: markdown and HTML are siblings chosen by purpose, markdown
   for light skimmable docs, HTML for full-bodied communicative ones. An architecture
   review is full-bodied and visual, so it is authored as HTML (the deliverable in its
   own right, not a render of a markdown source; an optional light markdown summary may
   sit alongside as a skim). It must **degrade gracefully** offline (readable content +
   visible diagram source) and land in-repo (`docs/` durable, `.scratch/` throwaway), not
   an OS temp dir.
4. **Blast radius in the badge rubric** (Strong is harder to earn on wide-reaching
   refactors; bias to the smallest seam) and **gate the Speculative tier** (must still
   pass the deletion test).

Kept: hotspot scoping as a hard gate, deletion test, strict vocabulary, plan-don't-
implement, ADR-on-rejection, the glossary-update side effects, the diagram-pattern
catalogue (plus a new SoA/AoS pattern for frame-loop findings).

## Follow-up

- Backlog ticket **12**: deep-dive the primary sources (Ousterhout, Tornhill, Feathers,
  Nygard, Acton/Fabian) to ground our lenses in the originals and catch any paraphrase
  drift.
- The markdown-for-light / HTML-for-full-bodied rule is now a **repo-wide** convention
  (`docs/report-format.md`, linked from AGENTS.md), not local to this skill.

## Cross-skill dependencies

Tightly paired with `codebase-design` (vocabulary + two-regime split + design-it-twice)
and `game-native-design` (the frame-loop regime). Calls `grilling` and `domain-modeling`/
`game-modeling`. Writes ADRs and `GLOSSARY.md`. An accepted candidate becomes a tkt
ticket, consumed downstream by `implement`. Shares `diagnosing-bugs`' debt in the Feathers
seam lineage.

## Web-app bias

This was the sharpest web/app bias in the set: the entire scan encodes the deep-module
trade-off, which is an **anti-goal** in a game's frame loop. Addressed head-on by the
required two-regime split and the "locality" disambiguation, the same correction applied
to `codebase-design`. Not an optional lens pointer here; regime classification is a gate
in the scan itself.

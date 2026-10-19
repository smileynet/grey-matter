---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, classify each by regime, present them as a full-bodied visual HTML report, then grill through whichever one you pick.
disable-model-invocation: true
---

# Improve Codebase Architecture

Surface architectural friction and propose improvements: in the **service regime**, refactors that turn shallow modules into deep ones; in the **frame-loop regime**, the opposite, structure that restores data-oriented locality. The aim is testability, performance where it matters, and AI-navigability.

This command is _informed_ by the project's domain model and built on a shared design vocabulary:

- Call the Skill tool with "codebase-design" for the architecture vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**) and its principles (the deletion test, "the interface is the test surface", "one adapter = hypothetical seam, two = real"). Use these terms exactly in every service-regime suggestion, and don't drift into "component," "service," "API," or "boundary" (unless the domain or engine already owns that word, per codebase-design's "the domain wins" rule).
- The domain language in `GLOSSARY.md` gives names to good seams; ADRs in `docs/adr/` record decisions this command should not re-litigate. **Read both before scanning** so you don't re-propose something an ADR already rejected.

## Two regimes: classify before you judge

`codebase-design` draws a hard line and so must this scan. The deep-module lens is **wrong** for a game's hot frame loop, and applying it there recommends de-optimising the most performance-sensitive code in the repo.

- **Service regime** (sim services, app/backend modules, tooling, business logic): hide complexity behind a small interface. Scan for **shallowness**: interface nearly as complex as implementation, pass-throughs, leaky seams, extract-for-testability that left bugs at the call site. This is the default and most of the upstream shape.
- **Frame-loop regime** (per-frame systems over component data, data-parallel hot paths): data-oriented design / ECS deliberately **exposes** plain data for cache locality and batching. "Lots of behaviour behind a small interface" is an _anti-goal_ here. Scan for the **opposite** smells: needless encapsulation breaking batching, array-of-structs where struct-of-arrays is warranted, per-entity virtual dispatch in a tight loop, hidden allocation. For this regime call the Skill tool with "game-native-design"; don't apply the deep-module checklist.

**Classify each hotspot's regime before judging it.** A finding in the wrong regime is not a weak finding, it's a wrong one.

**The word "locality" is overloaded and the regimes disagree on it.** In the service regime it means **comprehension locality** (related code/decisions in one place, Ousterhout's sense). In the frame-loop regime it means **cache/memory locality** (data laid out for sequential access). Say which one you mean; never let a service-regime "improve locality" finding fire against a frame loop that already has good cache locality.

## Process

### 1. Explore

**Scope before you scan: YAGNI.** Deepening (or de-encapsulating) a module pays off by making future changes cheaper, so weight the parts of the codebase that actually keep changing. Decide *where* to look before you look:

- If the user named a direction (a module, a subsystem, a pain point), take it, and skip the inference below.
- Otherwise, walk back a good stretch of commit history (`git log --oneline`) to find the hot spots, the files and areas that keep coming up, and let those pull your attention first. If changes are scattered with no clear hot spot, widen the net.

This hotspot gate is load-bearing: a refactor to code that rarely changes has no payoff. Keep it a gate, not a suggestion.

Read `GLOSSARY.md` and any ADRs in the area first. Then spawn a sub-agent to walk the codebase. Don't follow rigid heuristics; explore organically and note where you experience friction, **and record which regime each hotspot is in**. Service-regime questions:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow**, interface nearly as complex as implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no comprehension **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want. (In the frame-loop regime the deletion test inverts: inlining a system's loop can _improve_ the design. Don't run the service-regime deletion test against frame-loop code.)

### 2. Present candidates as a full-bodied HTML report

This review is a **full-bodied, visual, communicative deliverable**: it exists to convey architectural ideas to the user with before/after diagrams, so **HTML is the right format** (see `docs/agents/report-format.md`). Write a self-contained HTML file. A durable review goes in a committed `docs/` path; a throwaway per-run report goes in `.scratch/`. Open it for the user (`xdg-open`/`open`/`start`) and tell them the absolute path.

The report uses **Tailwind** for layout and **Mermaid** for graph-shaped diagrams, mixed with hand-built CSS/SVG for editorial visuals (mass diagrams, cross-sections, collapse animations). **Degrade gracefully**: if these load from a CDN and the network is absent, the content stays readable and the diagram source stays visible, never a blank page. Be visual: each candidate gets a **before/after visualisation**.

Optionally also drop a **light markdown summary** alongside it (`.scratch/architecture-review-<timestamp>.md`): one terse line per candidate (id, regime, files, badge) as a quick skim and as a handle the grill can re-read. This is a sibling skimmable doc, not the source the HTML is generated from, the HTML is the deliverable in its own right.

For each candidate card:

- **Files**: which files/modules/symbols are involved.
- **Regime**: service or frame-loop (so the reader knows which lens applies).
- **Problem**: why the current architecture causes friction (one sentence).
- **Solution**: plain English of what would change (one sentence).
- **Benefits**: in terms of leverage/locality and how tests improve (service), or batching/cache locality and allocation (frame-loop).
- **Before / After diagram**: side-by-side, **grounded in the real files/symbols it depicts**; mark any inferred or hypothetical edge as such. If a diagram needs a paragraph to be understood, redraw it.
- **Recommendation strength**: `Strong`, `Worth exploring`, or `Speculative`, as a badge. **Blast radius counts against strength**: a `Strong` badge is harder to earn on a large, wide-reaching refactor than on a localised one, bias toward the smallest seam that captures the gain. A `Speculative` candidate must still pass the deletion test (or the frame-loop equivalent); don't use the tier as a hedge to pad the report.

End the report with a **Top recommendation** section: which candidate you'd tackle first and why.

**Use GLOSSARY.md vocabulary for the domain and the codebase-design vocabulary for the architecture.** If `GLOSSARY.md` defines "Order," talk about "the Order intake module," not "the FooBarHandler" and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, surface it only when the friction is real enough to warrant revisiting the ADR, and mark it clearly (an amber callout: _"contradicts ADR-0007, but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

See [HTML-REPORT.md](HTML-REPORT.md) for the HTML scaffold, diagram patterns, and styling.

Do NOT propose interfaces yet. After the files are written, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, call the Skill tool with "grilling" to walk the decision tree with them: constraints, dependencies, the shape of the change, what sits behind the seam (service) or how the data is laid out (frame-loop), what tests survive. The grill can challenge the before/after diagram, not just the recommendation, if the diagram doesn't match the real structure, fix it.

Side effects happen inline as decisions crystallise; call the Skill tool with "domain-modeling" (or "game-modeling" for a game system) to keep the domain model current:

- **Naming a module after a concept not in `GLOSSARY.md`?** Add the term to `GLOSSARY.md`. Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `GLOSSARY.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing; skip ephemeral reasons ("not worth it right now") and self-evident ones.
- **User accepts a candidate to act on?** It becomes tracked work: file it as a tkt ticket (see `docs/agents/tkt-conventions.md`) with the candidate's problem/solution and the deletion-test result as context, rather than sliding straight into implementation, this skill plans, a separate flow implements.
- **Want to explore alternative interfaces for a deepened module?** Call the Skill tool with "codebase-design" and use its design-it-twice parallel sub-agent pattern.

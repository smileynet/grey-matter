# HTML Report Format

Per `docs/agents/report-format.md`, an architecture review is a **full-bodied communicative deliverable**, so HTML is its format: the visual document a user studies. The HTML is the deliverable in its own right, not a render of a markdown source (an optional light markdown summary may sit alongside it as a skim, but it is a sibling, not the source). A single self-contained file; a durable review lands in a committed `docs/` path, a throwaway per-run report in `.scratch/`. Tailwind and Mermaid come from CDNs; the report must **degrade gracefully** when the network is absent (readable content, visible ```mermaid``` source, never a blank page). Mermaid handles graph-shaped diagrams; hand-built divs and inline SVG handle editorial visuals. Mix them, or it looks generic.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Architecture review for {{repo name}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* small custom layer for things Tailwind doesn't cover cleanly:
         dashed seam lines, hand-drawn-feeling arrow heads, etc. */
      .seam { stroke-dasharray: 4 4; }
      .leak { stroke: #dc2626; }
      .deep { background: linear-gradient(135deg, #0f172a, #1e293b); }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

The Mermaid `<pre class="mermaid">` blocks hold the raw diagram source, so when the CDN import fails the diagram text is still readable in place rather than vanishing. That is the graceful-degradation property; don't move diagram definitions into JS that only runs after a successful import.

## Header

Repo name, date, and a compact legend: solid box = module, dashed line = seam, red arrow = leakage, thick dark box = deep module. No introduction paragraph. Straight into the candidates.

## Candidate card

The diagrams carry the weight. Prose is sparse, plain, uses the glossary terms (from `codebase-design`) without ceremony.

Each candidate is one `<article>`:

- **Title**: short, names the change (e.g. "Collapse the Order intake pipeline", or for a frame-loop finding "Flatten the particle system to SoA").
- **Badge row**: recommendation strength (`Strong` = emerald, `Worth exploring` = amber, `Speculative` = slate), a **regime** tag (`service` or `frame-loop`), and a dependency-category tag where relevant (`in-process`, `local-substitutable`, `ports & adapters`, `mock`). A `Strong` badge on a wide-blast-radius refactor must be justified in the card; prefer the smallest seam.
- **Files**: monospaced list of the real files/symbols, `font-mono text-sm`.
- **Before / After diagram**: the centrepiece. Two columns, side by side. **Grounded**: every node/edge names a real file or symbol; mark inferred or hypothetical edges (dashed + a note). See patterns below.
- **Problem**: one sentence. What hurts.
- **Solution**: one sentence. What changes.
- **Wins**: bullets, <=6 words each. Service: "Tests hit one interface", "Pricing stops leaking", "Delete 4 shallow wrappers". Frame-loop: "One cache-friendly pass", "No per-entity dispatch", "Zero per-frame allocation".
- **ADR callout** (if applicable): one line in an amber-tinted box.

No paragraphs of explanation. If the diagram needs a paragraph to be understood, redraw the diagram.

## Diagram patterns

Pick the pattern that fits. Mix them. Variety is part of the point. Every diagram claiming to show real structure must be derived from the actual code, not synthesized to look plausible.

### Mermaid graph (the workhorse for dependencies / call flow)

Use a Mermaid `flowchart` or `graph` when the point is "X calls Y calls Z, and look at the mess." Wrap it in a Tailwind card. Style with classDef to colour leakage edges red and the deep module dark. Sequence diagrams work for "before: 6 round-trips; after: 1."

```html
<div class="rounded-lg border border-slate-200 bg-white p-4">
  <pre class="mermaid">
    flowchart LR
      A[OrderHandler] --> B[OrderValidator]
      B --> C[OrderRepo]
      C -.leak.-> D[PricingClient]
      classDef leak stroke:#dc2626,stroke-width:2px;
      class C,D leak
  </pre>
</div>
```

### Hand-built boxes-and-arrows (when Mermaid's layout fights you)

Modules as `<div>`s with borders and labels; arrows as inline SVG `<line>`/`<path>` over a relative container. Reach for this when the "after" should feel like one thick-bordered deep module with greyed-out internals, which Mermaid won't weight correctly.

### Cross-section (good for layered shallowness)

Stack horizontal bands (`h-12 border-l-4`) to show the layers a call passes through. Before: 6 thin layers each doing nothing. After: 1 thick band with the consolidated responsibility.

### Mass diagram (good for "interface as wide as implementation")

Two rectangles per module: interface surface area vs implementation. Before: interface nearly as tall as implementation (shallow). After: short interface, tall implementation (deep).

### Call-graph collapse

Before: a tree of calls as nested boxes. After: the tree collapsed into one box, the now-internal calls shown faded inside.

### SoA / AoS (frame-loop regime)

For a frame-loop candidate, draw memory layout, not call graphs. Before: array-of-structs, each struct a mixed row, the field the loop touches scattered across cache lines. After: struct-of-arrays, the hot field contiguous. This is the visual that makes a cache-locality finding legible.

## Style guidance

- Lean editorial, not corporate-dashboard. Generous whitespace. Serif optional for headings.
- Colour sparingly: one accent (emerald or indigo) plus red for leakage and amber for warnings.
- Keep diagrams ~320px tall so before/after sits side by side without scrolling.
- `text-xs uppercase tracking-wider` for module labels inside diagrams, so they read as schematic.
- Only scripts are the Tailwind CDN and Mermaid ESM import. Otherwise static: no app code, no interactivity beyond Mermaid's rendering.

## Top recommendation section

One larger card. Candidate name, one sentence on why, anchor link to its card. That's it.

## Tone

Plain English, concise, architectural nouns and verbs straight from `codebase-design`. Concision is not an excuse to drift.

**Use exactly** (service regime): module, interface, implementation, depth, deep, shallow, seam, adapter, leverage, locality.

**Never substitute**: component, service, unit (for module) · API, signature (for interface) · boundary (for seam) · layer, wrapper (for module, when you mean module). Exception: when the domain or engine already owns the word (ECS's `component`/`system`, a codebase's `service` layer), use it, per codebase-design's "the domain wins".

**Disambiguate "locality"**: comprehension locality (service) vs cache locality (frame-loop). Don't let one regime's meaning fire against the other's code.

**Phrasings that fit:**

- "Order intake module is shallow: interface nearly matches the implementation."
- "Pricing leaks across the seam."
- "Deepen: one interface, one place to test."
- "Two adapters justify the seam: HTTP in prod, in-memory in tests."
- "Particle update is AoS: the hot field is scattered across cache lines." (frame-loop)

**Wins bullets** name the gain in glossary terms: *"locality: bugs concentrate in one module"*, *"leverage: one interface, N call sites"*, *"cache locality: one contiguous pass"*. Don't write *"easier to maintain"* or *"cleaner code"*, those don't earn their place.

No hedging, no throat-clearing, no "it's worth noting that…". If a sentence could be a bullet, make it a bullet. If a bullet could be cut, cut it. If a term isn't in the vocabulary, reach for one that is before inventing a new one.

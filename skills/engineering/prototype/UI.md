# UI Prototype

Generate **several radically different UI variations** on a single route, switchable from a floating bottom bar. The user flips between variants in the browser, picks one (or steals bits from each), then throws the rest away.

If the question is about logic/state, use [LOGIC.md](LOGIC.md); if it's about game feel, use [GAME.md](GAME.md).

## Why parallel variants (and the trap)

Generating alternatives **in parallel** and comparing them produces better, more divergent designs than iterating serially on one (Dow et al., Stanford: parallel prototyping prevents anchoring to a first idea and decouples the judgement from any single artifact). But the benefit only holds if the variants are **actually divergent**. The failure mode, and it's the one an agent falls into by default, is collapse to near-duplicates: the same layout with different colours and copy. Three slightly-tweaked card grids isn't a UI prototype, it's wallpaper, and it forfeits the whole point. Step 2 is built to force real divergence.

## When this is the right shape

- "What should this page look like?"
- "I want to see a few options for this dashboard before committing."
- "Try a different layout for the settings screen."
- Any time the user would otherwise spend a day picking between three vague mockups in their head.

## Two sub-shapes: strongly prefer sub-shape A

A UI prototype is much easier to judge when it's **butting up against the rest of the app**: real header, real sidebar, real data, real density. A throwaway route on its own is a vacuum: every variant looks fine in isolation. Default to sub-shape A whenever there's a plausible existing page to host the variants.

### Sub-shape A: adjustment to an existing page (preferred)

The route already exists. Variants render **on the same route**, gated by a `?variant=` URL search param. The existing data fetching, params, and auth all stay; only the rendering swaps. If the prototype is for something without a page yet but that *would naturally live inside one* (a new dashboard section, a new settings card, a new step in a flow), it's still sub-shape A: mount the variants inside the host page.

### Sub-shape B: a new page (last resort)

Only when the thing genuinely has no existing page to live inside (an entirely new top-level surface, a flow that can't be embedded). Create a **throwaway route** following the project's existing routing convention; don't invent a new top-level structure. Name it so it's obviously a prototype (include `prototype` in the path or filename). Same `?variant=` pattern. Before committing to B, sanity-check: is there really no existing page this could embed in? An empty route hides design problems a populated one would expose.

In both sub-shapes the floating bottom bar is identical.

## Process

### 1. State the question and pick N

Default to **3 variants**; cap at 5 (beyond that they stop being radically different and become noise). Write the plan in one line, in the prototype's location or a top-of-file comment:

> "Three variants of the settings page, switchable via `?variant=`, on the existing `/settings` route."

### 2. Force divergence, then render

Do **not** jump straight to drafting N components; that's what collapses them to near-duplicates. Instead:

1. **Assign each variant a distinct structural archetype first, in words.** Each slot gets a different *organising principle*, not a different coat of paint. E.g. A = single-column linear flow; B = sidebar + detail master/detail; C = spatial dashboard of cards; D = conversational/step-wizard. Name the archetype per slot before any code. This is the single biggest lever against collapse.
2. **Confirm the set is divergent.** Read the N archetypes back: do any two share a layout and information hierarchy? If so, replace the redundant one with a genuinely different organising principle before drafting.
3. **Fix the cosmetic degrees of freedom.** Same palette, same copy, same content across variants, so the only axis left to differ on is *structure and interaction*. Deny the model the easy cosmetic knobs.
4. **Generate each variant independently**, not conditioned on the others, so variant C isn't a small delta from B (anchoring). Give each a clear exported name (`VariantA`, `VariantB`, ...). Hold each to the page's purpose and data, and the project's component/styling system (Tailwind, shadcn, MUI, plain CSS, whatever).
5. **De-dup check.** With all N drafted, verify they're still structurally different (layout, information hierarchy, primary affordance). If two converged during drafting, redo one with explicit "do not use a `<card grid | sidebar | ...>`" guidance.

### 3. Wire them together

A single switcher component on the route:

```tsx
// pseudo-code, adapt to the project's framework
const variant = searchParams.get('variant') ?? 'A';
return (
  <>
    {variant === 'A' && <VariantA {...data} />}
    {variant === 'B' && <VariantB {...data} />}
    {variant === 'C' && <VariantC {...data} />}
    <PrototypeSwitcher variants={['A','B','C']} current={variant} />
  </>
);
```

Sub-shape A: keep all existing data fetching above the switcher; only the rendered subtree changes per variant. Sub-shape B: the throwaway route under `/prototype/<name>` mounts the same switcher.

### 4. Build the floating switcher

A small fixed-position bar at bottom-centre with three pieces:

- **Left arrow**: previous variant (wraps).
- **Variant label**: the current key and, if the variant exports a name, that name. E.g. `B (Sidebar layout)`.
- **Right arrow**: next variant (wraps).

Behaviour:

- Clicking an arrow updates the URL search param (via the framework's router, `router.replace` on Next, `navigate` on React Router) so the variant is shareable and reload-stable.
- Keyboard `<-` / `->` also cycle. Don't intercept arrow keys when an `<input>`, `<textarea>`, or `[contenteditable]` is focused.
- Visually distinct from the page (high-contrast pill, subtle shadow) so it's obviously not part of the design being evaluated.
- **Hidden in production builds**: gate on `process.env.NODE_ENV !== 'production'` or equivalent, so a stray prototype merge can't ship the bar.

Put the switcher in one shared component so both sub-shapes reuse it.

### 5. Hand it over

When practical, show screenshots, mocks, or embedded interactive views in the
review dashboard so the user can inspect and compare without navigating away and
finding their place again. Use a working embed when the behavior can be tested
there; otherwise use screenshots or mocks, clearly labelled with their fidelity
and limits.

Name the task to try and the question it helps answer. Provide the comparison URL
and `?variant=` keys for deeper interaction or a return visit. When the dashboard
cannot support the needed interaction, open the relevant comparison view using
[report-format's handoff contract](../../../docs/agents/report-format.md#html-rules).
Refresh the review view after revisions, and invite feedback on useful parts from
different variants (e.g. the header from B with the sidebar from C).

Use an existing review dashboard when available. A lightweight in-page comparison
can be enough; this does not require a separate dashboard or embedding every
prototype. Keep the existing throwaway-code, comparison, and capture rules.

### 6. Capture the answer and clean up

Once a variant wins, capture the answer (which variant and why), then capture the prototype the way the [SKILL](SKILL.md) describes (throwaway branch + context pointer on the tkt ticket). Fold the winner into real code and move the rest to the throwaway branch, not main:

- **Sub-shape A**: fold the winner into the existing page; drop the losing variants and switcher from main.
- **Sub-shape B**: promote the winning variant to a real route; drop the throwaway route and switcher from main.

The full set of variants is the primary source, so it lands on the throwaway branch, not the bin; variant components and the switcher left in main rot fast.

## Anti-patterns

- **Variants that differ only in colour or copy.** That's a tweak, not a prototype. Real variants disagree about structure. (Step 2 exists to prevent this.)
- **Sharing too much code between variants.** A shared `<Header>` is fine; a shared `<Layout>` defeats the point. Each variant should be free to throw out the layout.
- **Wiring variants to real mutations.** Read-only prototypes are fine. If a variant must mutate, point it at a stub: the question is "what should this look like", not "does the backend work".
- **Promoting the prototype directly to production.** Variant code was written under prototype constraints; rewrite it properly when folding in.

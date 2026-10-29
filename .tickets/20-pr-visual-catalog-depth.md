---
id: "20"
title: "Consider trimming pr's inline visual catalog to references/ (depth-bar nit)"
status: open
blocked_by: []
priority: low
validation_criteria:
  - "A decision recorded on whether pr's ~120-line inline visual catalog stays verbatim (credited keep) or moves the exhaustive variants into references/ with the core forms kept inline, keeping SKILL.md self-sufficient"
  - "If moved, the credit and the most-common visual forms remain in SKILL.md; only the long tail becomes an additive reference"
tags: ["type:chore", "stream:skills-review"]
---

# Consider trimming pr's inline visual catalog to references/ (depth-bar nit)

## What to build

Decide whether `pr`'s inline visual catalog (the full set of diff/tree/Mermaid/call-graph
variants, ~120 of its 172 lines) stays inline or moves its long tail into `references/`.

Surfaced by the lens audit: `pr` is the longest skill in the set, and the catalog reads
more like a human cookbook than agent-terse, sitting above the set's depth bar. It is a
**deliberate "keep verbatim"** of the credited show-me source (Dex Horthy / HumanLayer),
so this is a judgement call, not a defect, hence a low-pri nit rather than a silent trim.

Options:
- **Keep verbatim** (status quo): honors the credited source; the cost is length.
- **Split**: keep the most-common visual forms + the credit inline (SKILL.md stays
  self-sufficient per the portability rule), move the exhaustive long-tail variants to
  `references/pr-visuals.md` as additive progressive disclosure.

Either way SKILL.md must remain self-sufficient (the core forms inline), and the credit
stays in SKILL.md/CREDITS.md.

## Acceptance criteria

- [ ] A decision recorded on whether the ~120-line inline visual catalog stays verbatim or splits the long tail into `references/`, keeping SKILL.md self-sufficient
- [ ] If moved, the credit and the most-common visual forms remain in SKILL.md; only the long tail becomes an additive reference

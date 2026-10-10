---
id: "03"
title: "Walk through each skill one at a time: what it is, what it does for the user, how to customize it"
status: open
blocked_by: ["01"]
priority: high
env: personal
validation_criteria:
  - "Every skill in engineering, productivity, in-progress, and misc has a committed review note covering: what it is, what it does for the user, and our customization decision (keep / adapt / drop + why)"
  - "Each note flags cross-skill dependencies and any web-app bias that the game-centric lens work (02) must address"
  - "A summary index lists all skills with their keep/adapt/drop verdict"
---

# Walk through each skill one at a time: what it is, what it does for the user, how to customize it

## Context

The source material is `mattpocock/skills` (reviewed in the sibling repo at
`d:\code\skills`). It has 36 skills across four active buckets:

- **engineering/** (21): ask-matt, code-review, codebase-design, diagnosing-bugs,
  domain-modeling, grill-with-docs, implement, implement-spec,
  improve-codebase-architecture, pr, prototype, research, retro,
  setup-matt-pocock-skills, tdd, to-spec, to-tickets, triage, wayfinder, wizard
- **productivity/** (7): grill-me, grilling, handoff, teach, to-questionnaire,
  wait-what, writing-for-agents
- **in-progress/** (7, beta): chief-of-staff, claude-handoff, loop-me,
  setup-ts-deep-modules, writing-beats, writing-fragments, writing-shape
- **misc/** (4, frozen): git-guardrails-claude-code, migrate-to-shoehorn,
  scaffold-exercises, setup-pre-commit

Blocked by ticket 01 because the output format (one ticket per skill vs. one
committed note per skill, tagging, how notes link back) depends on the tkt
conventions decided there.

## What to build

Go through each skill **one at a time**, in discussion with the user, and for
each produce a committed review note capturing:

1. **What it is** — invocation type (user- vs model-invoked), one-line purpose.
2. **What it does for the user** — the real mechanics and the problem it solves.
3. **How we should customize it** — keep / adapt / drop, with reasoning, plus
   concrete adaptation notes (what to strip, rename, or rewire). Watch for the
   Matt-Pocock-specific branding and the "Skill tool" dispatch coupling.
4. **Cross-skill dependencies** — what it calls or is called by (e.g. the
   grilling / domain-modeling / writing-for-agents hubs).
5. **Web-app bias flag** — anything that assumes web development, handed to
   ticket 02 (game-centric lenses).

### Suggested review order (by leverage)

1. Foundations: grilling, domain-modeling, writing-for-agents, setup (the hub).
2. High-value portable singles: tdd, code-review, pr, diagnosing-bugs, to-spec,
   to-tickets, handoff, to-questionnaire, codebase-design.
3. Flow orchestrators: implement, implement-spec, grill-with-docs, retro, ask-matt.
4. Specialized/heavy: wayfinder, triage, improve-codebase-architecture, prototype,
   research, wizard.
5. Beta + frozen: in-progress writing suite, setup-ts-deep-modules,
   setup-pre-commit; skip Claude-Code/vendor-locked ones unless they fit the stack.

All output lands in this repo (likely `docs/skill-reviews/<skill>.md`), with a
summary index. Final storage layout follows the ticket 01 decision.

## Acceptance criteria

- [ ] Every skill in engineering, productivity, in-progress, and misc has a committed review note covering: what it is, what it does for the user, and our customization decision (keep / adapt / drop + why)
- [ ] Each note flags cross-skill dependencies and any web-app bias that the game-centric lens work (02) must address
- [ ] A summary index lists all skills with their keep/adapt/drop verdict

---
id: "10"
title: "Make skills tkt-preferred but tracker-adaptable (GitHub Issues, others) by context"
status: backlog
blocked_by: []
priority: medium
validation_criteria:
  - "A single documented tracker-abstraction contract: skills name tracker operations (frontier, claim, close, dependency, label/state) abstractly and resolve them through one issue-tracker doc, defaulting to tkt"
  - "Each authored skill references that contract rather than hardcoding tkt commands inline, OR a documented decision that inline tkt + a mapping doc is sufficient"
  - "A worked second-adapter example (GitHub Issues) shows the same skill driving a different tracker with no SKILL.md edit"
  - "init-project wires the chosen tracker so downstream skills inherit it"
tags: ["type:enhancement", "stream:skills-review"]
---

# Make skills tkt-preferred but tracker-adaptable (GitHub Issues, others) by context

## What to build

A tracker-abstraction contract so every skill is **tkt-preferred but tracker-adaptable**:
tkt is the default, but a repo can bind the same skills to GitHub Issues, GitLab, or
another tracker by context, without rewriting each SKILL.md.

### Why

Upstream (mattpocock/skills) keeps tracker operations abstract ("the issue tracker
should have been provided to you") and resolves them through one per-repo mapping doc,
with a local-markdown fallback. We have drifted the other way: our adapted skills
(wayfinder, implement-spec, retro, code-review, triage, ...) hardcode `tkt` commands
(`tkt ready`, `tkt claim`, `tkt close`, `blocked_by`) inline. That is fine while tkt is
the only tracker, but it couples the skills to one tool and loses upstream's portability.
grey-matter should stay tkt-first (tkt is ours and the default) while being able to drop
onto a GitHub-Issues repo, which is exactly the surface `triage` needs (inbound issues /
external PRs) and which `tkt import --github` (tkt ticket 86) half-bridges.

### Shape (to decide during the ticket)

- A **single tracker contract** naming the operations skills depend on, abstractly:
  frontier (ready set), claim/lock, close-with-evidence, dependency/blocking, and the
  label/state + category vocabularies (`triage:*`, `kind:*`, `wayfinder:*`, `type:epic`).
- One **issue-tracker doc per repo** that maps those operations onto the concrete tracker
  (today: `docs/tkt-conventions.md`; a GitHub adapter would map frontier -> a label query,
  close -> close issue, blocking -> task-list/sub-issues, etc.).
- Skills reference the **contract**, not inline `tkt` commands -- OR we consciously decide
  that inline-tkt + a per-repo mapping doc (the lighter option, closer to how we work now)
  is enough, and record that decision. Either way the coupling becomes explicit.
- **init-project** selects and wires the tracker so downstream skills inherit it (one
  place sets "this repo's tracker is X").
- A **worked GitHub-Issues adapter** as the proof: one existing skill drives GitHub
  Issues with no edit to its SKILL.md.

### Relationship to existing work

- Does not block the current skill walkthrough (ticket 03): keep authoring tkt-first now;
  this ticket retrofits the abstraction once the set stabilizes, so we abstract against
  real usage rather than guessing the seam.
- `triage` is the first skill that genuinely wants a non-tkt surface (public GitHub
  Issues/PRs), so it is the natural first consumer / motivating case.
- Pairs with tkt ticket 86 (`tkt import --github`) for the issues -> tkt bridge.

## Acceptance criteria

- [ ] A single documented tracker-abstraction contract naming the operations (frontier, claim, close, dependency, label/state) resolved through one issue-tracker doc, defaulting to tkt
- [ ] Each authored skill references that contract rather than hardcoding tkt commands inline, OR a recorded decision that inline-tkt + a mapping doc is sufficient
- [ ] A worked GitHub-Issues adapter shows one skill driving a different tracker with no SKILL.md edit
- [ ] init-project wires the chosen tracker so downstream skills inherit it

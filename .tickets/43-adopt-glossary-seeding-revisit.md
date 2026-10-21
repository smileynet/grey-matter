---
id: "43"
title: "Revisit adopt-project glossary seeding: (b) stage-then-write vs (c) hybrid, from real-use findings"
status: backlog
blocked_by: []
priority: low
tags: ["stream:tooling"]
---

# Revisit adopt-project glossary seeding: (b) stage-then-write vs (c) hybrid, from real-use findings

## What to build

Evaluate whether `adopt-project`'s glossary-from-code seeding should move from the chosen
**(b) stage-then-write** (all inferred terms staged for confirm/correct/reject at the approval
gate; only confirmed terms written) to a **(c) hybrid**: write code-*attested* terms directly
but marked (a term that IS a real high-centrality symbol — its existence/name is a fact), and
stage only *interpretations* (meanings, relationships, synonym/`_Avoid_` rulings) for confirmation.

Deliberately **deferred** (backlog): this is a decision to make *with evidence we don't have yet*.
Make the call after adopt-project has real use.

## Context

Grilled on ticket 40 (2026-10-21). We chose (b) to start — honest-but-slower, the committed
glossary never holds unconfirmed fiction — over (c), to avoid prematurely building an optimization
whose "strongly attests" threshold could itself be a hallucination surface. The revisit question is
empirical, not a priori.

## Acceptance criteria (revisit gate)

- [ ] Decide (b)-stays vs switch-to-(c) based on findings from real adopt-project runs: is the (b) confirmation gate a meaningful friction cost in practice?
- [ ] If switching to (c): define "code-attested" mechanically (e.g. the term is a symbol in the tree-sitter map above a centrality threshold), and confirm that tier is trustworthy (a widely-used but *misnamed* symbol must not ride in unchallenged).
- [ ] Record the decision (update the adopt-project skill + a note on ADR 0001/0002 if it changes the characterization contract).

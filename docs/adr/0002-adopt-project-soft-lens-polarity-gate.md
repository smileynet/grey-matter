# 0002 — adopt-project: soft-lens archetypes + an install/negotiate polarity gate

**Status:** accepted (2026-10-21)

## Context

Scouting real repos under `code/` produced five brownfield starting-state archetypes
(cold-start / mature-bespoke-conflicting / chaotic-multi-tool / lightly-scaffolded-middle /
no-tests-fallback). The question: does adopt-project hard-branch into one of five procedures,
or run one pipeline the archetype merely *tunes*?

A dry-run of the pipeline against `herdr` (a mature repo with its own opinionated AGENTS.md
and its own live `.tickets/` tracker) showed a *pure* soft lens fails: "same step, more
emphasis" still produces the wrong *action*. A high-emphasis reconcile is still a *merge*;
against an incumbent layer the correct default inverts to *don't install, defer*. Worse, a
literal "no tkt → `tkt init`" seed step would fork a second tracker beside herdr's live one
while reporting success — "non-destructive" at the byte level, destructive to the repo's
coherence.

## Decision

**One linear pipeline, with the archetypes as a soft lens, PLUS a single polarity gate.** The
five archetypes are a *descriptive vocabulary* that tunes effort per step (soft lens; no
five-way branch). After Step 1, one binary gate — **is there an incumbent agent layer?**
(existing AGENTS.md doctrine, an existing tracker of any kind, or existing skills) — flips
steps 3–5 (reconcile / seed / wire) between:

- **install-semantics** (no incumbent): scaffold grey-matter's conventions, careful not to clobber.
- **negotiate-semantics** (incumbent present): incumbent is authoritative — reconcile classifies
  each artifact own / leave-alone / pointer-only / ask-before-touch; seed stands down if a
  non-grey-matter tracker already owns the board; wire asserts-existing over creating, and never
  `tkt init`s beside a live tracker.

## Why

This is neither the pure soft lens (which the herdr dry-run falsified) nor five hard branches
(a legibility/maintenance burden; the archetypes overlap and one axis — tests/docs — is
orthogonal). It is *one polarity bit flipping three steps' verb from install to negotiate*,
which keeps the single-pipeline legibility while conceding the honest point that those three
steps need different *logic*, not just different *emphasis*, when an incumbent layer exists.

The git-based "reconcile, never clobber" contract prevents overwriting *bytes*; the polarity
gate prevents creating a *parallel competing system* (two trackers, two AGENTS dialects). Both
are needed — the first does not imply the second.

## Considered

- *Pure soft lens (emphasis only):* rejected — falsified against herdr (would fork its tracker).
- *Five hard branches, one per archetype:* rejected — sprawl; overlapping archetypes; a single
  polarity bit captures the one difference that actually needs different logic.

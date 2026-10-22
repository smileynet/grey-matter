# 0002 — adopt-project: soft-lens archetypes + an install/subsume polarity gate

**Status:** accepted (2026-10-21)

## Context

Scouting real repos under `code/` produced five brownfield starting-state archetypes
(cold-start / mature-bespoke-conflicting / chaotic-multi-tool / lightly-scaffolded-middle /
no-tests-fallback). The question: does adopt-project hard-branch into one of five procedures,
or run one pipeline the archetype merely *tunes*?

A dry-run of the pipeline against `herdr` (a mature repo with its own opinionated AGENTS.md
and its own live `.tickets/` tracker) showed a *pure* soft lens fails: "same step, more
emphasis" still produces the wrong *action*. A literal "no tkt → `tkt init`" seed step would
fork a *second* tracker beside herdr's live one while reporting success — "non-destructive" at
the byte level, destructive to the repo's coherence. So steps 3–5 need different *logic*, not
just different *emphasis*, when an incumbent agent layer exists.

The polarity's *direction* was settled separately (and corrects an earlier draft of this ADR
that said "defer to the incumbent"): adopt-project's purpose is to **subsume and replace** the
incumbent, not tiptoe around it — consistent with "fully adopted" (ADR 0001). The incumbent is
*what's being replaced*, not a protected authority.

## Decision

**One linear pipeline, with the archetypes as a soft lens, PLUS a single polarity gate.** The
five archetypes are a *descriptive vocabulary* that tunes effort per step (soft lens; no
five-way branch). After Step 1, one binary gate — **is there an incumbent agent layer?**
(existing AGENTS.md doctrine, an existing tracker of any kind, or existing skills) — flips
steps 3–5 (reconcile / seed / wire) between:

- **install-semantics** (no incumbent): scaffold grey-matter's conventions, careful not to clobber.
- **subsume-semantics** (incumbent present): **migrate-then-replace.** The incumbent is being
  converted to grey-matter, not deferred to. Capture the incumbent's content *worth keeping*
  (governance rules → AGENTS.md; a real backlog → tkt tickets; decisions → ADRs), then replace
  the incumbent structure with grey-matter's. The replacement is **lossless and gated by
  default**: it is proposed at the approval gate and lands as one reviewable commit, so no
  load-bearing logic is silently dropped. Wholesale *automatic* replacement happens only when the
  user specifically asks for it.
  - *seed:* never run two trackers — migrate the incumbent tracker's tickets into tkt and replace
    it (do not `tkt init` a second board beside a live one, and do not merely defer to theirs).

## Why

This is neither the pure soft lens (which the herdr dry-run falsified) nor five hard branches
(a legibility/maintenance burden; the archetypes overlap and one axis — tests/docs — is
orthogonal). It is *one polarity bit flipping three steps' verb from install to subsume*, which
keeps the single-pipeline legibility while conceding that those three steps need different
*logic* when an incumbent layer exists.

The git-based "reconcile, never clobber" contract prevents overwriting *bytes*; the polarity
gate governs the harder question of what to do with a *whole incumbent system* — subsume it
(migrate its value, then replace), losslessly and behind the approval gate, rather than fork a
parallel competing system or silently discard the incumbent's real logic. Both controls are
needed — the first does not imply the second.

## Considered

- *Pure soft lens (emphasis only):* rejected — falsified against herdr (would fork its tracker).
- *Five hard branches, one per archetype:* rejected — sprawl; overlapping archetypes; a single
  polarity bit captures the one difference that actually needs different logic.
- *Defer to the incumbent (an earlier draft of this ADR):* rejected — produces a half-adopted
  repo, contradicting "fully adopted" (ADR 0001). Replaced by subsume-and-replace.

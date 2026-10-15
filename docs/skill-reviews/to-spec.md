# to-spec

- Bucket: engineering. Invocation: user-invoked.
- Verdict: **adapt** (tkt repoint; one in-direction sharpening; keep the opinionated bits).

## What it is

Turns the current conversation + codebase understanding into a spec, **synthesis, not
interview** (grilling ran earlier). Sketches test seams first (prefer existing/highest/
fewest, ideal one), checks them with the user, then publishes the spec with a
ready-for-agent mark. Fixed template: Problem/Solution (user's perspective), a long
user-story list, Implementation Decisions, Testing Decisions, Out of Scope, Notes. The
hinge between grilling and to-tickets/implement.

## What it does for the user

Captures what grilling established as a durable, implementer-ready spec, without
re-opening settled decisions. Spec-driven development's "write a reviewed spec, then
implement from it", the artifact the rest of the build consumes.

## Prior art (agent-filtered) and two "risks" examined before fixing

Research (RE elicitation/specification split, Connextra/INVEST, Specification by
Example, Spec Kit / Kiro, LLM-requirements studies) confirmed the spine: synthesize-
not-interview is a hallucination mitigation; the template and the spec->tickets->
implement pipeline are well-grounded. It flagged two things as risky; we examined
Pocock's intent before touching them:

- **"LONG, extremely extensive user stories".** Research warned this invites padding
  (the "Mirror Effect": verbose input amplifies into invented requirements). But the
  skill runs *after* a thorough grilling and says "synthesize, don't interview", so the
  intent is an **exhaustiveness demand** against *lossy synthesis* (agent compresses a
  rich grilling into a thin spec, implementer then guesses). Under-specification is the
  worse failure for a spec that drives autonomous implementation, and the same research
  says grounded input *lowers* hallucination. So we **kept the length demand** and only
  made the implicit grounding explicit: "exhaustive over what the conversation and
  codebase established; each story traces to something the user raised; never invent
  capability." A sharpening in the author's own direction, not a hedge away from it.
- **"ideal is one seam".** Research called it an overstatement. But it is the set's
  **depth philosophy** (codebase-design, tdd) applied to speccing: one high seam is
  what a deep, well-placed module looks like, and needing many seams is design pressure
  signalling bad boundaries. We **kept it as-is** and added one clause pointing at
  `codebase-design` when the feature won't collapse to one or two seams, so the "but
  these are genuinely separable" case is handled without weakening the signal.

## Decision

**Adapt.** Changes:

1. **Repoint publishing to tkt** (the real work): write the spec as a doc under
   `docs/` and record it on the ticket as its **spec-slug** (per the issue-tracker
   doc); mark `triage:ready-for-agent` (asserted brief-complete, distinct from `tkt
   ready` per GLOSSARY). Dropped the branding/setup precondition.
2. **Sharpened the story instruction in-direction** (grounded/traceable, keep the
   exhaustiveness demand).
3. **Added the codebase-design escape clause** to the one-seam rule (kept the rule).
4. **Game pointer**: for a game, model vocabulary and testing seams come from
   `game-native-design` / `game-modeling` (deterministic sim core).

Kept verbatim: the whole spec template, synthesize-don't-interview, user-perspective
framing, no-stale-paths, the prototype-snippet exception.

## Cross-skill dependencies

Downstream of `grilling`/`grill-with-docs`; upstream of `to-tickets` and `implement`.
Calls `codebase-design` for seam vocabulary; `game-native-design`/`game-modeling` for a
game. Produces the spec `code-review` later checks against. Reads GLOSSARY/ADRs.

## Web-app bias

Low. The template is domain-neutral; the seam/testing language is handled for games by
the lens/model pointers. "spec" = the document (GLOSSARY), stored at a spec-slug.

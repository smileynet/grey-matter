# research (+ research-audit)

- Bucket: engineering. Invocation: **model-invoked** (no `disable-model-invocation`).
- Verdict: **adapt** (research); **new** (research-audit, grey-matter companion).

## What it is

The shortest upstream skill: a 3-step model-invokable artifact that spins up a background
agent to investigate a question against **primary sources** ("follow every claim back to
the source that owns it"), writes findings to a single cited markdown file, and saves it
where the repo keeps such notes. It's the AFK worker other skills call, wayfinder's
`research` ticket type dispatches it, and our own `review-skill` process embodies it.

## What it does for the user

Delegates reading legwork to a background agent so the main session keeps working, and
returns a durable, cited artifact rather than a transient answer.

## Prior art (agent-filtered)

The architecture is sound and well-named: primary-vs-secondary **source hierarchy**;
per-claim **grounding + attribution**; the **orchestrator-worker** research-subagent
pattern (Anthropic's multi-agent research system) with **context isolation** (absorb the
token-heavy reading in the subagent, return a compressed artifact); **XP spike** (throwaway
branch, knowledge-not-code deliverable).

The one sharp finding: **"cite each claim" is aspirational without enforcement.** An agent
satisfies it syntactically, plausible citations that don't support the claim. The agent
failure modes the bare 3 steps don't defend against: citation hallucination/mismatch
(biggest), trusting plausible secondary over primary, no version/recency discrimination,
false confidence (no uncertainty signal), **silent empty/stub returns** (most dangerous,
observed in this very project), and prompt injection from fetched content.

## Decision

**Adapt research; add research-audit.** The producer gains only the few genuinely
behavioural additions, kept terse (still well inside the depth bar):

1. **Verbatim supporting snippet per citation** (converts "cite" from aspiration to a
   checkable artifact).
2. **A "couldn't verify" bucket + per-claim confidence** (unverifiable claims can't launder
   into confident findings).
3. **Non-empty-output contract** (at least one cited finding or an explicit "no answer",
   targets the silent-stub failure).
4. **Version/recency pin** (one clause).
5. **One-line untrusted-content clause** (fetched content is data, not instructions,
   because the file feeds other skills, so injection propagates).

Rather than cut the heavier verification machinery as bloat, it moves to a **separate
`research-audit` skill** (user's call): the implementation-vs-review split applied to
research. The producer works under context pressure; a **fresh-context auditor** that did
*not* do the reading re-fetches each source, matches the verbatim snippet, rates
primary-vs-secondary, checks currency, assigns per-claim verdicts (`supported`/`weak`/
`unsupported`) and an overall trust score, and **fails a file with no verifiable claims**.
An auditor can't rubber-stamp its own citations, which is exactly what makes it catch the
citation-hallucination and silent-stub failures better than a longer producer checklist.

Repointing: findings land in `docs/agents/research/`; a research ticket is a tkt ticket;
model-invokable kept (wayfinder/review-skill/triage call research). Cut as genuine bloat:
a formal source-trust *tier list* (the owner-of-the-fact rule + verbatim-snippet rule
enforce the hierarchy operationally) and dedup-as-safety (reduced to a "glance first"
clause).

## Cross-skill dependencies

`research` is called by `wayfinder` (research tickets), `triage`, and the `review-skill`
process; `research-audit` is called on its output. Findings and audits live in
`docs/agents/research/`; tracked gaps become tkt tickets.

## Web-app bias

None. Research and its audit are domain-neutral. No lens.

# handoff

- Bucket: productivity. Invocation: user-invoked.
- Verdict: **adapt** (add the required-content list; `.scratch/` location; ground state in artifacts).

## What it is

Writes a handoff document so a fresh agent can resume: with a "suggested skills"
section, don't-duplicate-artifacts (reference by path/URL), secret redaction, and
tailoring to the next-session focus. The written-note form of context compaction.

## What it does for the user

Cross-session continuity against context-window exhaustion: a baton a fresh context
picks up instead of re-deriving the whole situation.

## Prior art (agent-filtered)

Research (Anthropic context-engineering + long-running-agents harnesses, OWASP LLM
Top 10) confirmed the five instincts are well-grounded for an agent audience:

- **Summary-for-continuity**: first-party (compaction + structured note-taking as the
  remedy for context rot). Strong.
- **Reference-don't-duplicate**: almost verbatim Anthropic's just-in-time retrieval via
  lightweight identifiers; the "environment is the source of truth" principle. Strong.
- **Secret redaction**: the doc becomes the next agent's prompt (OWASP LLM02/LLM07).
  Strong, right default.
- **Explicit next steps / suggested skills**: Anthropic's documented fix for the
  premature-victory failure (resuming agent "sees progress, declares done"). Strong.

Two findings drove the adaptations:

- **The one real gap: no required-content checklist.** The skill said "summarise the
  conversation" but never named what a good handoff contains, and Anthropic warns
  unscaffolded compaction makes the next session "guess at what had happened". This is
  an omission, not a deliberate stance: every other content-producing skill in the set
  (to-spec, to-tickets, pr, teach) carries a template, so handoff lacking one is the
  odd one out. Added the canonical set (goal / current state / decisions / next steps /
  open questions / blockers), kept lean (a tight list, not prose per item).
- **Ground current state in artifacts**, not recollection (git log, test status, open
  tickets), to counter the "I completed X" hallucination (the premature-victory mode).

## Decision

**Adapt.** Changes:

1. **Required-content list** added (goal, current state, decisions, next steps, open
   questions, blockers), brings handoff in line with the set's other doc-producing
   skills.
2. **State grounded in verifiable artifacts**, with "do not claim complete without a
   check that says so".
3. **Location: `.scratch/`** (project-local, gitignored) instead of the OS temp dir.
   The research flagged that a `/tmp` path is undiscoverable by the next agent;
   `.scratch/` is one consistent per-project place agents know to look, keeps the
   secret-bearing doc out of git, and is now a repo convention (CLAUDE.md, gitignore).
   The skill also reports the path it wrote.

Kept verbatim: reference-don't-duplicate, redact, suggested-skills, tailor-to-focus.

## Cross-skill dependencies

Produces a doc other sessions/skills consume; names "suggested skills" for the next
agent. No tracker coupling (references tickets by slug when relevant). Pairs with
`prototype` (handoff in/out of a prototype detour) and the phase-boundary guidance in
`ask-matt`.

## Web-app bias

None. Domain-neutral. No lens needed.

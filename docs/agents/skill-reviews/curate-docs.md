# curate-docs

- Bucket: meta. Invocation: user-invoked (`disable-model-invocation: true`).
- Verdict: **new** (grey-matter skill, no upstream origin).

## What it is

A periodic sweep of the repo's agent-facing knowledge (`docs/agents/` + `.scratch/`) that
decides what to **promote**, **move**, or **delete**. It operationalises the lifecycle
rules in `docs/agents/doc-conventions.md`.

## What it does for the user

Keeps the knowledge base from rotting: graduates mature notes into skills, pulls a skill's
private reference material out of the shared docs tree and into the skill's `references/`,
and prunes stale/superseded/deferral-masquerading notes, so `docs/agents/` stays shared
reference and skills own their detail.

## Why it exists

Two needs surfaced during the docs reorganization and the `research` review:

1. The new `docs/` (user-facing) vs `docs/agents/` (agent reference) split, plus the
   agentskills "skill owns its detail in `references/`" layout, create standing curation
   work: material lands in the wrong place over time and needs periodic reclassification.
2. The promotion test (note -> skill) and the dot-prefix/lifecycle rule in
   `doc-conventions.md` needed an owner, a skill that actually runs the test, not just a
   convention doc nobody applies.

The user asked specifically that it address **both** promoting new skills **and** moving
relevant docs into skill `references/`, not just deletion; both are first-class axes here.

## Design

- **Two axes, applied independently**: promotion (promote-to-skill / move-into-references /
  keep-in-docs, via the do-on-cue-vs-read-when-relevant test) and deletion (superseded /
  overtaken-by-a-decision / deferral-masquerading-as-a-note / orphaned-scratch).
- **Recommend-then-confirm**, deletion especially is never unilateral, mirroring the
  terminal-action discipline in `triage` and the present-then-file discipline in `retro`.
- **Dedupe-before-create**: check existing skills/tickets before proposing a new skill or
  doc (same rule as `code-review`/`retro`/`triage`).
- **`git mv` + dangling-link check** on every move, so history is preserved and no pointer
  breaks.
- Larger follow-ups become tkt tickets; durable "revisit later" intent becomes a backlog
  ticket rather than a stranded note.

## Cross-skill dependencies

Applies `doc-conventions.md`. Promotion follows `review-skill`'s depth bar and
`writing-for-agents`. Reuses the dedupe discipline from `code-review`/`retro`/`triage` and
the recommend-then-confirm pattern from `triage`. Files tkt tickets per
`tkt-conventions.md`.

## Web-app bias

None. Repo-knowledge curation is domain-neutral. No lens.

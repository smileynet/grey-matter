# Doc conventions: where things live, and when a note becomes a skill

Three questions decide where any piece of writing belongs: **who reads it**, **how
durable is it**, and **should an agent act on it or read it**. Match those to the
location.

## Audience split

- **Agent-facing instructions** live in `SKILL.md` files and `AGENTS.md`/steering. Terse,
  high-signal, written to the `writing-for-agents` rules. `AGENTS.md` is the standing
  prompt, paid for every session, so it holds only operational instructions and
  **navigation pointers**, never reference-sized material (context rot: more tokens means
  worse adherence, not better).
- **User-facing docs** live at the **`docs/` root**: anything written for a human to read
  (guides, overviews, user-facing explanation). Keep this tree easy for a person to
  navigate; don't bury it under agent material.
- **Agent-facing reference** lives under **`docs/agents/`**, in topic subfolders:
  `docs/agents/skill-reviews/`, `docs/agents/lenses/`, `docs/agents/research/`,
  `docs/agents/proposals/`, plus the operational convention docs
  (`tkt-conventions.md`, `skill-frontmatter.md`, `report-format.md`, this file). This is
  durable, committed, and loaded **on demand via a pointer**, never auto-loaded. The
  topic subfolders prevent `docs/` sprawl and keep user docs findable.

Generated reports/dashboards follow [`report-format.md`](./report-format.md) (markdown for
light skims, HTML for full-bodied deliverables).

## Lifecycle and the dot-prefix rule

Match the name prefix and git status to how durable the thing is:

- **Ephemeral, local, disposable** -> dot-prefixed and gitignored: `.scratch/` (working
  files, handoff notes, throwaway output), `.references/` (cloned prior-art, rehydrated
  from its committed README). The leading `.` signals "tooling/ignore"; nothing here
  survives a fresh clone or `git clean`.
- **Durable, shared, content** -> plain name, committed: `docs/`, `docs/agents/`,
  `skills/`. A committed knowledge dir never takes a dot-prefix, the signal would
  contradict its purpose.

So durable agent knowledge is a plain committed path loaded via a pointer: zero always-on
context cost, full discoverability, survives every clone. `.scratch/` is for transient
state only; a finding left there dies.

## The promotion test

The test for where a piece of knowledge belongs, and when it should move:

> **Should an agent _do_ this on cue, or _read_ it when relevant?**
>
> - **Do-on-cue, with a clear trigger** -> it's a **skill** (`skills/<bucket>/<name>/`),
>   with its detail in the skill's own `references/`.
> - **Read-when-relevant** -> it **stays in `docs/agents/`** as reference, pointed to by
>   whatever needs it.

A note graduates to a skill once it has become a repeatable procedure with a recognizable
activation condition. When it does, its supporting reference material moves **into the
skill's `references/` folder** (per the agentskills layout: `SKILL.md` at the root,
detail in `references/` loaded on demand), not left behind in `docs/agents/`. Don't
skill-ify raw notes prematurely: every half-baked skill dilutes the skill index's trigger
precision.

Reviewing `docs/agents/` and `.scratch/` for promotion (note -> skill, or move a doc into
a skill's `references/`) and for deletion (superseded, overtaken by a decision, a deferral
masquerading as a note) is the job of the `curate-docs` skill. Run it periodically.

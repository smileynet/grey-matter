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
When artifact payload, retention or retrieval is the question, use
[`repository-artifact-hygiene`](../../skills/meta/repository-artifact-hygiene/SKILL.md).
This convention remains the owner of audience, placement and promotion.

## Human-facing writing

For prose a person reads (README, changelog, PR bodies, docs):

- **Start from the reader's task.** Explain what the material helps them understand,
  compare, decide, or do. Describe capabilities through their actions and benefits;
  include technical detail when it helps them operate the system or assess evidence
  and risk.
- **Use plain, precise language.** Replace praise with a concrete capability or
  evidence. Preserve domain terms when they make the meaning more precise.
- **Give each layer a purpose.** Headings orient, summaries convey the key point,
  and examples demonstrate it. Avoid repeating the same explanation across all three.
  Use takeaways when they help the reader or are requested; keep them consistent
  with the body and any starter instructions. Do not append a recap by habit.
- **Fit the audience and genre.** Choose perspective and structure for the task,
  preserving an established project voice. A personal article, PR, procedure,
  fictional scene, and agent instruction have different purposes; one narrative
  pattern or visual treatment does not govern them all.
- **Report evidence by outcome class.** Name what each check actually returned (pass,
  assertion failure, skip, infrastructure error, timeout, survivor) rather than "green";
  a missing command counted as a kill is an infrastructure error. State what remains
  unknown. A gain nobody measured is "not demonstrated here", not a benefit. Count
  distinct faults separately from failing assertions and repeats of one fault: ten
  red tests from one bug are one fault.

Judge AI tells **in clusters, not singly**. One em dash means nothing. Em dashes
plus forced triples plus "robust", "seamless", "leverage", or "delve" plus an
unnecessary recap means rewrite. After editing for style, re-check every factual
claim: tightening a sentence can flatten a hedge into an overclaim. A project with
its own prose linter (e.g. a deck repo's) uses that instead.

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

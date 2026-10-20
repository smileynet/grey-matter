---
id: "40"
title: "Add adopt-project: bring the grey-matter workflow into an existing (brownfield) repo"
status: in_progress
blocked_by: []
priority: medium
tags: ["stream:tooling"]
---

# Add adopt-project: bring the grey-matter workflow into an existing (brownfield) repo

## What to build

A new user-invoked **meta** skill (`skills/meta/adopt-project/SKILL.md` + `agents/openai.yaml`)
that adopts the grey-matter workflow into a repo that **already has code and history** — the
brownfield counterpart to `init-project` (which assumes a fresh/greenfield repo).

Its unique contribution is **characterization-first, non-destructive reconciliation**: build
an honest *as-is* model of the existing repo (vocabulary, conventions, build/test commands,
known-legacy areas) and reconcile grey-matter's structure around what's already there, rather
than scaffolding forward from intent into an assumed-empty repo. It **orchestrates** existing
skills (`init-project`, `domain-modeling`/`game-modeling`, `codebase-design`, `triage`/
`to-tickets`) and hands forward to `wayfinder` for change planning — it does not duplicate them.

## Context

Requested after shipping `wrap-session`. Researched 2026-10-20 via three subagents (prior art,
repo scouting under `d:\code\`, and a teardown of an existing `adopt-project` skill). Key
findings (full detail below) — this is a design brief, not a finished design; grill/spec it
before building.

### Why a new skill (the delta from init-project)

`init-project` scaffolds structure *forward from intent into an (assumed) empty repo and
defers content* (it only creates `.scratch/`/`.references/`, makes AGENTS.md primary + CLAUDE.md
a pointer, runs `tkt init` to an empty board; `GLOSSARY.md`/ADRs are created lazily later). It
assumes **nothing to preserve and nothing to back-fill from**. Brownfield inverts the source of
truth: *characterize content backward from existing code/history/TODOs into an honest as-is
model, then reconcile the structure around what's already there.* Same end-state (AGENTS.md
pointers, GLOSSARY, seeded frontier, wired checks), opposite starting point.

### Prior art

- **Upstream (mattpocock/skills / agentskills.io): none.** The `.references/agentskills` clone
  is the standard + a reference parser; grep for onboard/adopt/existing-repo → zero. This is
  grey-matter's own invention.
- **Ecosystem "init on existing repo":** Claude Code `/init` (scans tree, drafts CLAUDE.md of
  build/test + inferred conventions; **suggests rather than overwrites** when the file exists;
  rule "only include what the agent couldn't infer"; known honesty gap — "a decent skeleton and
  a bad final product" because it can only see what's visible). Cursor "Generate Rules" (derives
  `.mdc` from codebase, non-destructive apply). Aider **repo map** (tree-sitter symbol extraction
  + PageRank over the reference graph to surface high-centrality symbols within a token budget) —
  the cheap way to derive structure without reading everything; grey-matter already has a
  tree-sitter `code` tool (`generate_codebase_overview`, `search_symbols`) to do this in-house.
- **Feathers, *Working Effectively with Legacy Code* (characterization):** document the system's
  *actual* behavior, not the behavior you wish it had — "in production a system becomes its own
  specification." The glossary/standards must be characterized *from code*, not imagined from
  intent. This is `domain-modeling`'s existing mandatory "cross-check against code" rule, flipped
  to be the *starting point*. `codebase-design` already owns the **seam** vocabulary.
- **Direct prior art — catalyst's `.kiro` `adopt-project` skill** (d:\code\catalyst,
  d:\code\catalyst-agentic). A 5-phase flow: **Inventory → Capture → Recommend (approval gate) →
  Deploy (back up, merge, never clobber) → Verify.**
  - *Steal:* the **exhaustive cross-harness inventory matrix** (`.kiro/`, `AGENTS.md`/`AGENT.md`,
    `CLAUDE.md`/`GEMINI.md`, `.cursorrules`+`.cursor/rules/*.mdc`, `.github/copilot-instructions.md`,
    `.windsurfrules`+`.windsurf/rules/*`, `.clinerules/*`, `.rules/*`, `CONTRIBUTING.md`/
    `DEVELOPMENT.md`, `.scratch/`/`.memory/`, existing SKILL.md, `references/`/`.references/`);
    the **non-destructive contract** (back up before touching, merge don't clobber, ask before
    replacing a workflow, approval gate before deploy); the **source→capture→placement routing
    table**; the idempotency guard; the "global skills stay active — this is workspace structure
    only" framing.
  - *Gaps to fill (catalyst's skill doesn't do these):* **glossary-from-code** (it seeds glossary
    only from prose decision docs, never from source symbols), **coding-standards-from-style
    inference** (it captures *stated* rules but never *infers* from formatter configs / dominant
    patterns), and **tracker seeding** (it has no step turning an existing backlog/issues/TODOs
    into tickets — grey-matter's tkt-centric world wants that). Also re-point all catalyst
    coupling (`.memory/`, crew tiers, `mise run add-skill`) to grey-matter reality (AGENTS.md
    primary + CLAUDE.md pointer, `.scratch/`, `tkt`, `docs/agents/` pointers) — same rewrite
    grey-matter already did for its own `init-project` (see `docs/agents/skill-reviews/init-project.md`).

### Brownfield starting-state archetypes (from scouting real repos)

The realistic brownfield repo on this machine is **rarely bare** — 9/10 scouted repos already
had *some* agent scaffolding. The skill's first phase must **detect and classify**, then branch:

1. **Cold-start, well-engineered (no agent layer).** e.g. `lacrosse-bosse` (1,600+ Godot files,
   real gdUnit4 tests, a `justfile`, legible `class_name` domain, but zero AGENTS/tickets/GLOSSARY).
   → **install** over existing code; mine class names + tests + README to synthesize glossary +
   initial frontier. Hard part: backlog mostly isn't written down anywhere.
2. **Mature bespoke agent workflow (conflicting).** e.g. `herdr` (custom opinionated AGENTS.md,
   its own `.tickets/`, its own `herdr-*` SKILL.md files). → **reconcile/merge, not install**;
   never clobber; decide what grey-matter defers to; avoid a second competing tracker/AGENTS dialect.
3. **Chaotic multi-tool / cross-repo residue.** e.g. `catalyst` (aider + .claude + .kiro +
   oh-my-pi at once, overlapping skills, agent material homed in a *sibling* repo, tmp litter).
   → **archaeology then reconcile**; identify authoritative vs abandoned, respect a declared
   multi-repo split, resolve skill-name collisions before adding anything.
4. **Lightly-scaffolded single-tool repo (the common middle).** one AGENTS.md + one `.kiro`/
   `.tickets`, already roughly grey-matter-shaped. → **upgrade/align** to current conventions
   (fill gaps, align tkt tags/lifecycle, dedupe skills).
5. **No-tests / undocumented-domain variant (orthogonal hard axis).** build command but weak/no
   tests, or a big domain with no glossary and sparse TODOs. → **behavior-characterization
   fallback**: derive vocabulary + behavior from code + commit history.

### Proposed shape (to be sharpened in grill/spec, not final)

1. **Survey & classify** — inventory the cross-harness matrix + detect the build/test/lint command
   (justfile / package.json / Cargo.toml / project.godot / Makefile / pyproject); use the
   tree-sitter `code` tool for an Aider-style symbol map + high-centrality modules (don't read
   everything); classify into one of the 5 archetypes.
2. **Characterize the as-is model** — back-fill `GLOSSARY.md` *from code* (via domain/game-modeling's
   mandatory code cross-check as the *primary* loop), record contradictions + legacy/known-broken
   areas honestly; offer ADRs only for decisions already baked into the code.
3. **Derive standards from current style** — state observed conventions ("this repo uses X"), mark
   divergence; include only what the agent couldn't infer.
4. **Seed the board from reality** — turn existing TODO/FIXME, open issues, obvious gaps into tkt
   tickets, but **park most as `backlog`**, promote only a curated frontier to `open` (route through
   `triage` where it fits) so `tkt ready` isn't flooded.
5. **Wire the plumbing (reconcile, never clobber)** — AGENTS.md-primary + CLAUDE.md pointer,
   `.scratch/`, `.references/` + its rehydration README, gitignore, `tkt init` if absent, wire
   consistency checks; back up anything replaced; **approval gate before writing**.
6. **Confirm & hand off** — present as-is model + proposed board for human correction, then stop;
   forward change planning is `wayfinder` (now starting from a real baseline).

### Risks / pitfalls to design against

- **Fictional domain model** (the `/init` "decent skeleton, bad final product" trap): mandatory
  code cross-check, mark unverified terms, human confirmation before commit.
- **Over-writing existing conventions:** reconcile, never replace; back up first; never maintain two
  divergent copies of AGENTS.md/rules.
- **Drowning in existing TODOs:** backlog-by-default, promote a small curated set.
- **Mistaking legacy behavior for bugs** (Feathers): record surprising behavior as characterized
  *fact*, not a silent "fix" — later human-gated decision.
- **Scan cost / hallucinated structure on huge repos:** symbol-graph + centrality, cap depth, be
  explicit about what wasn't examined.
- **One-shot assumption:** make it idempotent / re-runnable as understanding deepens (init-project
  already has an "already scaffolded?" guard to mirror).

### Integration bookkeeping (when built)

New skill → update its bucket `README.md` (User-invoked), `compass` (the on-ramps / health
section — it's a brownfield on-ramp alongside the greenfield `init-project`→`wayfinder`), and the
`docs/agents/maintenance-skills.md` roster together (the set-equality lint fails a missed one), add
the `agents/openai.yaml` sidecar, and deploy via `scripts/install-skills.mjs`. Consider a
`docs/agents/skill-reviews/adopt-project.md` recording the catalyst-prior-art adaptation (the same
way `init-project.md` records its rewrite).

Read first: `skills/meta/init-project/SKILL.md`, `docs/agents/skill-reviews/init-project.md`,
`skills/engineering/domain-modeling` + `game-modeling`, `skills/meta/wayfinder`, `skills/meta/triage`,
`docs/agents/maintenance-skills.md`, `docs/agents/doc-conventions.md`.

## Acceptance criteria

- [ ] `skills/meta/adopt-project/SKILL.md` exists, user-invoked (`disable-model-invocation: true`) with the Codex sidecar `agents/openai.yaml` (`allow_implicit_invocation: false`), written to the `writing-for-agents` rules.
- [ ] The skill first **surveys & classifies** the repo (cross-harness inventory matrix + build/test command detection + tree-sitter symbol map) into a brownfield archetype before writing anything.
- [ ] It **characterizes an as-is model from code** (glossary-from-code via the domain/game-modeling code cross-check; records legacy/known-broken areas) rather than inventing one from intent, and gates on human confirmation before committing it.
- [ ] It is **non-destructive**: existing AGENTS.md/CLAUDE.md/rules/tickets are reconciled (backed up, merged, ask-before-replace), never clobbered; it detects and respects an existing tracker / agent layer rather than creating a competing one.
- [ ] It **seeds the tkt board from reality** (TODO/FIXME/issues/gaps), defaulting most to `backlog` and promoting only a curated frontier to `open`.
- [ ] It **orchestrates** existing skills (init-project plumbing, domain/game-modeling, triage/to-tickets) and **hands forward to wayfinder** for change planning; it does not duplicate them.
- [ ] Indexes updated together (bucket README + compass + maintenance-skills roster) and `node scripts/check-repo.mjs` passes; skill deployed via install-skills.mjs.

---
id: "40"
title: "Add adopt-project: bring the grey-matter workflow into an existing (brownfield) repo"
status: open
blocked_by: ["41", "42"]
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
repo scouting under `d:\code\`, and a teardown of the crew-research `adopt-project` prior art).
**Design grilled to a shared understanding 2026-10-21** (see "Settled design" below); remaining
authoring is the `implement` step. The research findings are retained below the settled design as
the rationale trail.

### Settled design (grilled 2026-10-21)

- **End state = a *fully adopted* project.** The hand-off skills are **part of the workflow**, not
  a to-do list left for the user. "Fully adopted" means the existing project is fully represented
  and operable under the workflow (plumbing wired, as-is model characterized, existing backlog
  captured and triaged into a workable frontier) — **not** that future work has been planned.
- **Bounded by "derivable from the repo as it is."** Everything characterizable or capturable from
  existing code/history/conventions is in scope and called inline; the moment the next step needs a
  *future* the repo doesn't yet contain, that's the seam where adoption ends.
- **Composition — calls inline:** `init-project` (plumbing, *after* inventory/reconcile decides
  what's safe; needs the guard fix in ticket 41), `domain-modeling`/`game-modeling`
  (glossary-from-code), the **conformance-audit** skill (ticket 42; audits existing
  skills/scripts/agent-guidance against current grey-matter standards), and `triage` (backlog
  capture). **Recommends, does not call:** `wayfinder` — it generates *new* work, which is building
  *in* the adopted repo, not adopting it.
- **Characterization — glossary-from-code, stage-then-write (option b).** Inferred terms are
  **staged for confirm/correct/reject at the approval gate**; only confirmed terms are written to
  the target repo's `GLOSSARY.md`. The committed glossary never holds unconfirmed fiction. (A
  backlog ticket will revisit switching to a hybrid — write code-attested symbols directly-but-
  marked, stage only interpretations — based on findings from real use.)
- **Safety — "reconcile, never clobber", on git.** Require a **clean working tree** before adopting
  (hard guardrail), reconcile/merge existing agent files rather than overwrite, present everything
  at the approval gate, land adoption as **one reviewable commit**. Git is the backup (revertable
  history) — no bespoke `.bak` machinery. adopt-project is *meant* to meaningfully reshape the
  project; the safety model is "bold, coherent, fully visible, revertable," not "avoid touching."
- **Archetypes — soft lens + one polarity gate.** The five archetypes (below) are a **descriptive
  vocabulary** that tunes effort (soft lens). PLUS a single binary gate after Step 1: **is there an
  incumbent agent layer?** (existing AGENTS.md doctrine / an existing tracker of any kind / existing
  skills). If yes, steps 3–5 switch from **install-semantics** to **subsume-semantics**:
  - purpose is **subsume and replace** the incumbent, not defer to it — the incumbent is *what's
    being replaced* (consistent with "fully adopted", ADR 0001), not a protected authority.
  - **migrate-then-replace, lossless and gated by default:** capture the incumbent's content worth
    keeping (governance rules → AGENTS.md; real backlog → tkt; decisions → ADRs), then replace the
    incumbent structure with grey-matter's; propose it at the approval gate, land as one reviewable
    commit. Wholesale *automatic* replacement only when the user specifically asks.
  - *seed:* never run two trackers — **migrate** the incumbent tracker's tickets into tkt and replace
    it (not `tkt init` a second board, and not merely defer to theirs).
  This is NOT pure emphasis-tuning (the herdr dry-run proved a pure soft lens would fork herdr's
  live `.tickets/` while reporting success), and NOT a five-way branch — one polarity bit flips
  three steps' *verb* from install to subsume. The "never clobber" git contract prevents
  overwriting *bytes*; the polarity gate governs what to do with a *whole incumbent system*
  (subsume it, losslessly + gated, not fork or discard it). Both needed. (See ADR 0002.)
- **Bucket/invocation:** user-invoked `meta` (`disable-model-invocation: true` + sidecar), the
  brownfield twin of `init-project`.
- **Docs/provenance:** no `skill-reviews/` doc — this ticket is the design record. crew-research is
  cited as **prior art consulted, never authoritative** (home `code/crew-research/atomics/`).

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
- **Prior art consulted — the crew-research `adopt-project` skill** (home:
  `code/crew-research/atomics/`; an incidental localized copy also sits in `catalyst/.kiro/`
  after the global skills were decommissioned and localized into consuming projects). Treated as
  **prior art, not an authoritative source** — grey-matter is a unique reimagining (your own
  skills + Pocock's, for a newer model generation without legacy baggage), not a descendant of
  crew-research. A 5-phase flow worth studying: **Inventory → Capture → Recommend (approval gate)
  → Deploy (back up, merge, never clobber) → Verify.**
  - *Borrow:* the **exhaustive cross-harness inventory matrix** (`.kiro/`, `AGENTS.md`/`AGENT.md`,
    `CLAUDE.md`/`GEMINI.md`, `.cursorrules`+`.cursor/rules/*.mdc`, `.github/copilot-instructions.md`,
    `.windsurfrules`+`.windsurf/rules/*`, `.clinerules/*`, `.rules/*`, `CONTRIBUTING.md`/
    `DEVELOPMENT.md`, `.scratch/`/`.memory/`, existing SKILL.md, `references/`/`.references/`);
    the **non-destructive contract** (merge don't clobber, ask before replacing a workflow,
    approval gate before deploy); the **source→capture→placement routing table**; the "global
    skills stay active — this is workspace structure only" framing.
  - *Gaps we fill (crew-research's skill doesn't do these):* **glossary-from-code** (it seeds
    glossary only from prose decision docs, never from source symbols), **coding-standards-from-style
    inference** (captures *stated* rules but never *infers* from formatter configs / dominant
    patterns), and **tracker seeding** (no step turning an existing backlog/issues/TODOs into
    tickets — grey-matter's tkt-centric world wants that). Re-point any crew-research coupling
    (`.memory/`, crew tiers, `mise run add-skill`) to grey-matter reality (AGENTS.md primary +
    CLAUDE.md pointer, `.scratch/`, `tkt`, `docs/agents/` pointers).

### Brownfield starting-state archetypes (from scouting real repos)

The realistic brownfield repo on this machine is **rarely bare** — 9/10 scouted repos already
had *some* agent scaffolding. The skill's first phase must **detect and classify**, then branch:

1. **Cold-start, well-engineered (no agent layer).** e.g. `lacrosse-bosse` (1,600+ Godot files,
   real gdUnit4 tests, a `justfile`, legible `class_name` domain, but zero AGENTS/tickets/GLOSSARY).
   → **install** over existing code; mine class names + tests + README to synthesize glossary +
   initial frontier. Hard part: backlog mostly isn't written down anywhere.
2. **Mature bespoke agent workflow (conflicting).** e.g. `herdr` (custom opinionated AGENTS.md,
   its own `.tickets/`, its own `herdr-*` SKILL.md files). → **subsume-semantics**: migrate its
   worth-keeping content (governance rules, the live backlog) into grey-matter and replace it,
   lossless + gated; never fork a second tracker or AGENTS dialect.
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

### Pipeline (grilled; one linear flow, archetype = soft lens, + install/subsume polarity on 3–5)

1. **Survey & classify** — inventory the cross-harness matrix + detect the build/test/lint command
   (justfile / package.json / Cargo.toml / project.godot / Makefile / pyproject); use the
   tree-sitter `code` tool for an Aider-style symbol map + high-centrality modules (don't read
   everything); name the archetype(s); **set the polarity bit** (incumbent agent layer? →
   subsume-semantics on steps 3–5, else install-semantics).
2. **Characterize the as-is model** — back-fill a `GLOSSARY.md` *from code* (via domain/game-modeling's
   mandatory code cross-check as the *primary* loop); **stage inferred terms for confirmation** (b);
   record contradictions + legacy/known-broken areas honestly; offer ADRs only for decisions already
   baked into the code.
3. **Conformance-audit + reconcile (polarity-aware)** — call the conformance-audit skill (ticket 42)
   on existing skills/scripts/agent-guidance/docs; reconcile existing agent files. *Install-semantics:*
   scaffold grey-matter conventions, careful not to clobber. *Subsume-semantics:* migrate the
   incumbent's content worth keeping (governance → AGENTS.md, decisions → ADRs) into grey-matter's
   structures, then replace — lossless and gated.
4. **Seed & triage the board** — call `triage` to capture existing TODO/FIXME, issues, and gaps into
   a triaged, ordered frontier (triage's roles move raw findings to `backlog`/`ready-for-agent` so
   `tkt ready` isn't flooded). *Subsume-semantics:* if a non-grey-matter tracker already owns the
   board, **migrate its tickets into tkt and replace it** — never fork a second tracker, never merely
   defer to theirs.
5. **Wire the plumbing (reconcile, never clobber)** — call `init-project` (guard-fixed, ticket 41) to
   create only the genuinely-absent plumbing: AGENTS.md-primary + CLAUDE.md pointer, `.scratch/`,
   `.references/` + its rehydration README, gitignore, `tkt init` if absent, wire consistency checks.
   *Subsume-semantics:* the replacement supersedes incumbent plumbing; never `tkt init` beside a
   still-live tracker (migrate it in step 4 first).
6. **Confirm & recommend** — present the as-is model + triaged board (and any subsume/replace plan) as
   one reviewable change for human correction (approval gate; land as one commit), then **recommend
   `wayfinder`** for forward work and stop. Adoption ends here.

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
the `agents/openai.yaml` sidecar, and deploy via `scripts/install-skills.mjs`. **No `skill-reviews/`
doc** — this ticket is the design record; crew-research is prior art, not an adaptation source.

Read first: `skills/meta/init-project/SKILL.md`, `docs/agents/skill-reviews/init-project.md`,
`skills/engineering/domain-modeling` + `game-modeling`, `skills/meta/wayfinder`, `skills/meta/triage`,
`docs/agents/maintenance-skills.md`, `docs/agents/doc-conventions.md`, and the two ADRs
(adoption boundary; soft-lens + polarity gate). Blocked by ticket 41 (init-project guard fix) and
ticket 42 (conformance-audit skill).

## Acceptance criteria

- [ ] `skills/meta/adopt-project/SKILL.md` exists, user-invoked (`disable-model-invocation: true`) with the Codex sidecar `agents/openai.yaml` (`allow_implicit_invocation: false`), written to the `writing-for-agents` rules.
- [ ] The skill first **surveys & classifies** the repo (cross-harness inventory matrix + build/test command detection + tree-sitter symbol map), names the archetype(s), and **sets the install-vs-negotiate polarity** from "is there an incumbent agent layer?".
- [ ] It **characterizes an as-is model from code** (glossary-from-code via the domain/game-modeling code cross-check; records legacy/known-broken areas) and **stages inferred glossary terms for confirmation** before any are committed.
- [ ] It is **non-destructive on git**: requires a clean working tree, reconciles existing agent files (never clobbers), lands adoption as one reviewable commit; and under **subsume-semantics** it migrates an incumbent tracker/agent layer's worth-keeping content into grey-matter and replaces it (lossless, gated) rather than forking a competing system or deferring to it.
- [ ] It **orchestrates by calling** `init-project` (guard-fixed), `domain-modeling`/`game-modeling`, the conformance-audit skill, and `triage` (full triaged board seed); and **recommends `wayfinder`** for forward work rather than running it. End state is a fully adopted, workable repo.
- [ ] Indexes updated together (bucket README + compass + maintenance-skills roster) and `node scripts/check-repo.mjs` passes; skill deployed via install-skills.mjs.

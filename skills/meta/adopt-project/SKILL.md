---
name: adopt-project
description: "Bring the grey-matter workflow into a repo that already has code and history: characterize the as-is model from the code, reconcile around what exists, seed a triaged board, and wire the plumbing — ending in a fully adopted repo. Use to adopt/onboard an existing (brownfield) project. Trigger: adopt this project, onboard existing repo, bring grey-matter into this codebase, brownfield adoption."
disable-model-invocation: true
---

# Adopt Project

Bring the grey-matter workflow into a repo that **already has code and history** — the brownfield
twin of `init-project` (which scaffolds a fresh repo forward from intent). Where init-project
assumes nothing to preserve and nothing to back-fill from, adopt-project inverts the source of
truth: **characterize the as-is model backward from the existing code, then reconcile grey-matter's
structure around what's already there.**

The end state is a **fully adopted** project: plumbing wired, an honest as-is model characterized,
the existing backlog captured and triaged into a workable frontier (`tkt ready` returns real work).
"Fully adopted" means the project is fully represented and operable under the workflow — **not** that
future work has been planned. It **orchestrates** existing skills rather than reimplementing them.

**Bounded by "derivable from the repo as it is."** Everything characterizable or capturable from
existing code, history, and conventions is in scope. The moment the next step needs a *future* the
repo doesn't yet contain, that is the seam where adoption ends and building begins — so adoption
**recommends `wayfinder`** for forward work and stops, rather than running it.

## Two things govern the whole run

**1. Safety — reconcile on git, never clobber.** Require a **clean working tree** before starting
(hard guardrail — refuse otherwise). Reconcile existing files, never overwrite them. Present
everything at the approval gate and land the whole adoption as **one reviewable commit**. Git is the
backup — the diff is the audit and `git revert` is the undo; no bespoke `.bak` machinery.
adopt-project is *meant* to meaningfully reshape the project — the safety model is "bold, coherent,
fully visible, revertable," not "avoid touching."

**2. Polarity — install vs subsume (set in Step 1, governs Steps 3–5).** One binary gate: **is there
an incumbent agent layer?** (an existing `AGENTS.md` doctrine, a tracker of any kind, or existing
skills).

- **No incumbent → install-semantics:** scaffold grey-matter's conventions over the existing code.
- **Incumbent present → subsume-semantics:** the incumbent is being **subsumed and replaced**, not
  deferred to. **Migrate-then-replace, lossless and gated:** capture its content worth keeping
  (governance rules → `AGENTS.md`; a real backlog → tkt; decisions → ADRs), then replace the
  incumbent structure with grey-matter's. Propose it at the gate; land one reviewable commit.
  Wholesale *automatic* replacement happens only when the user specifically asks.

The git contract prevents overwriting *bytes*; the polarity gate governs what to do with a *whole
incumbent system* (subsume it, don't fork a parallel one or discard its real logic). Both are needed.
Design rationale: `docs/adr/0001-adopt-project-adoption-boundary.md` (adoption boundary) and
`docs/adr/0002-adopt-project-soft-lens-polarity-gate.md` (soft-lens + polarity gate).

## Pipeline

One linear flow. The archetype detected in Step 1 is a **soft lens** — it tunes where effort is high
vs low, it does not branch the pipeline (see Archetypes).

### 1. Survey & classify

Read before writing anything. Inventory the **cross-harness agent layer** (what exists to reconcile):
`.kiro/`, `AGENTS.md`/`AGENT.md`, `CLAUDE.md`/`GEMINI.md`, `.cursorrules` + `.cursor/rules/*.mdc`,
`.github/copilot-instructions.md`, `.windsurfrules` + `.windsurf/rules/*`, `.clinerules/*`, `.rules/*`,
`CONTRIBUTING.md`/`DEVELOPMENT.md`, `.scratch/`/`.memory/`, any `SKILL.md`, a tracker (`.tickets/` or
other), `GLOSSARY.md`, `docs/`, `.references/`. Detect the **build/test/lint command** (justfile /
package.json / Cargo.toml / project.godot / Makefile / pyproject / go.mod). Build a structural map with
the tree-sitter `code` tool (`generate_codebase_overview`, `search_symbols`) and surface the
high-centrality modules — **don't read everything.**

Then two outputs: **name the archetype(s)** (diagnostic, below), and **set the polarity bit** (incumbent
agent layer present? → subsume-semantics for Steps 3–5, else install-semantics).

### 2. Characterize the as-is model

Build an honest description of what the repo currently *is and does*, from the code. Call the Skill tool
with `domain-modeling` (or `game-modeling` for a game's systems — detect an engine marker; load both for
a game with a backend) and run its **mandatory code cross-check as the primary loop**: mine domain
vocabulary from the symbol map and module structure, not from intent. Record contradictions and
legacy/known-broken areas honestly (a running system is its own specification — characterize what *is*,
don't silently "fix" surprising behavior). Offer ADRs only for decisions already baked into the code that
a newcomer would question.

**Stage-then-write (do not auto-write the glossary).** Inferred terms are **staged for
confirm/correct/reject at the approval gate (Step 6)**; only confirmed terms are written to the target's
`GLOSSARY.md`. The committed glossary never holds unconfirmed fiction — this is the guard against the
"decent skeleton, bad final product" trap of inferred context reading as authoritative.

### 3. Conformance-audit & reconcile (polarity-aware)

Call the Skill tool with `conformance-audit` on the existing skills, tool scripts, agent guidance, and
docs — it produces findings (safe-auto-fix vs needs-judgment) against current grey-matter standards.
Then reconcile the existing agent layer:

- **install-semantics:** scaffold grey-matter's conventions, careful not to clobber.
- **subsume-semantics:** migrate the incumbent's content worth keeping (its governance rules into
  `AGENTS.md`, its decisions into ADRs) into grey-matter's structures, then replace the incumbent
  structure. Lossless and gated.

### 4. Seed & triage the board

Call the Skill tool with `triage` to capture the existing backlog — TODO/FIXME, open issues, obvious
gaps from the survey — into tkt, run through the triage roles so raw findings land as
`backlog`/`ready-for-agent` and `tkt ready` isn't flooded. The result is a triaged, ordered frontier.

- **subsume-semantics:** if a non-grey-matter tracker already owns the board, **migrate its tickets into
  tkt and replace it** — never `tkt init` a second board beside a live one, and never merely defer to
  theirs.

### 5. Wire the plumbing

Call the Skill tool with `init-project` to create only the genuinely-absent plumbing (it is
create-what's-missing and idempotent — ticket 41): `AGENTS.md`-primary + `CLAUDE.md` pointer, `.scratch/`,
`.references/` + its rehydration README, gitignore entries, `tkt init` if no tracker exists, and the
consistency checks. It runs *after* this skill's reconcile step has decided what's safe, so it fills real
gaps rather than bailing on a non-empty repo.

- **subsume-semantics:** the replacement supersedes the incumbent plumbing; never `tkt init` beside a
  still-live tracker (Step 4 migrated it first).

### 6. Confirm & recommend

Present the whole adoption as **one reviewable change** for human correction: the staged glossary terms
(Step 2), the reconcile/subsume plan and conformance fixes (Step 3), the triaged board (Step 4), the
plumbing (Step 5). This is the approval gate — the human confirms/corrects before anything lands; then
commit once. Finally, **recommend `wayfinder`** for the first forward chunk of work (new, not derivable
from the as-is repo) and stop. Adoption ends here.

## Archetypes (the soft lens — diagnostic vocabulary, not a branch)

Name the repo's starting state to set expectations and tune effort. These overlap and one axis
(tests/docs) is orthogonal; they do **not** select different procedures — the pipeline is one flow, and
the one real divergence (install vs subsume) is the polarity gate, not the archetype.

1. **Cold-start, no agent layer** — legible code, maybe real tests + a build command, but no
   AGENTS/tracker/GLOSSARY. Install-semantics; invest in glossary-from-code (Step 2) and seeding a
   frontier the repo doesn't yet write down (Step 4); reconcile (Step 3) is near-zero.
2. **Mature bespoke, conflicting** — its own opinionated `AGENTS.md`, its own tracker, its own skills.
   Subsume-semantics; the weight is in Step 3 (migrate its governance + decisions, then replace) and
   Step 4 (migrate its tracker's tickets into tkt).
3. **Chaotic multi-tool / cross-repo** — several agent layers at once (aider + .claude + .kiro …),
   overlapping skills, maybe agent material homed in a sibling repo, litter. Do archaeology in Step 1
   (what's authoritative vs abandoned; respect a declared multi-repo split) before Step 3.
4. **Lightly-scaffolded middle** — one `AGENTS.md` + one tracker, already roughly grey-matter-shaped.
   Subsume-semantics, light: align to current conventions, fill gaps, dedupe.
5. **No-tests / undocumented-domain (orthogonal)** — weak/no tests or a big domain with no glossary.
   Lean harder on characterize-from-code + commit history in Step 2; be explicit about what wasn't
   examined.

## Risks this pipeline is built to avoid

- **Fictional domain model** — inferred terms read as authoritative but are guesses. Mitigated by
  stage-then-write (Step 2) + the approval gate (Step 6).
- **Clobbering / forking the incumbent** — mitigated by the git contract (bytes) + the subsume polarity
  (whole system: migrate-then-replace, never a second tracker).
- **Drowning in TODOs** — mitigated by routing capture through `triage` (backlog-by-default), not
  bulk-ticketing everything onto the frontier.
- **Mistaking legacy behavior for bugs** — record surprising behavior as characterized *fact* in Step 2;
  changing it is a later, human-gated decision (recommend `wayfinder`), not part of adoption.
- **Scan cost / hallucinated structure on huge repos** — symbol-graph + centrality (Step 1), cap depth,
  state what wasn't examined.

## It's working if

- The repo ends fully adopted: plumbing wired, an as-is model the human confirmed, a triaged frontier
  `tkt ready` surfaces, grey-matter's consistency checks wired in.
- Nothing was overwritten outside the one reviewable adoption commit; the whole change is revertable.
- An incumbent agent layer was subsumed (its value migrated, then replaced) — not clobbered, not forked
  into a parallel system, not silently discarded.
- No unconfirmed glossary term was committed; forward planning was recommended (`wayfinder`), not done.

## Does not

- **Plan new work.** Forward change-planning is `wayfinder`, recommended at the end — adoption is bounded
  by what's derivable from the repo as it is.
- **Reimplement what it calls.** Plumbing is `init-project`; glossary is `domain-modeling`/`game-modeling`;
  standards-conformance is `conformance-audit`; backlog capture is `triage`. adopt-project orchestrates.
- **Clobber or defer to an incumbent.** It subsumes-and-replaces, losslessly and gated.

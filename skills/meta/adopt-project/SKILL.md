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
everything at the approval gate. Git is the backup — the diff is the audit and `git revert` is the
undo; no bespoke `.bak` machinery. Commit shape: **one reviewable adoption commit** (relocation,
reconcile, plumbing, safe fixes), then one evidence commit (the audit reports), then the board
commits `tkt new`/`batch` make on their own. They revert together. Never rewrite history (LFS
migration of old commits, purging a file) inside an adoption; name it as an owner decision.

**2. Polarity — install vs subsume (set in Step 1, governs Steps 3–5).** One binary gate: **is there
an incumbent agent layer?** Classify agent artifacts by **role**, not by presence:

- **Agent layer** — instructions for agents working *on this repo*: `AGENTS.md`/`CLAUDE.md` doctrine,
  a tracker of any kind, `.kiro/`/`.claude/` config, committed agent notes (e.g. `.memory/`). This is
  what polarity counts and what subsume-semantics replaces.
- **Shipped artifacts** — skills, steering, or prompt packs the repo **distributes** (signals: an
  install/copy task, packaging metadata, docs telling users to install them). These are product.
  Audit them against the open standard (frontmatter, links that resolve where installed); never
  restructure them into grey-matter's own distribution layout.

When the role is unclear, ask at the gate. Then:

- **No incumbent → install-semantics:** scaffold grey-matter's conventions over the existing code.
- **Incumbent present → subsume-semantics:** the incumbent is being **subsumed and replaced**, not
  deferred to. **Migrate-then-replace, lossless and gated:** capture its content worth keeping
  (governance rules → `AGENTS.md`; a real backlog → tkt; decisions → ADRs; committed knowledge →
  grey-matter paths), then replace the incumbent structure with grey-matter's. Wholesale *automatic*
  replacement happens only when the user specifically asks.

Design rationale: `docs/adr/0001-adopt-project-adoption-boundary.md` (adoption boundary),
`docs/adr/0002-adopt-project-soft-lens-polarity-gate.md` (soft-lens + polarity gate), and
`docs/agents/proposals/05-adopt-project-pilot-revisions.md` (first-pilot revisions).

## Pipeline

One linear flow. The archetype detected in Step 1 is a **soft lens** — it tunes where effort is high
vs low, it does not branch the pipeline (see Archetypes).

### 1. Survey & classify

Read before writing anything. Inventory the **cross-harness agent layer**: `.kiro/`,
`AGENTS.md`/`AGENT.md`, `CLAUDE.md`/`GEMINI.md`, `.cursorrules` + `.cursor/rules/*.mdc`,
`.github/copilot-instructions.md`, `.windsurfrules` + `.windsurf/rules/*`, `.clinerules/*`, `.rules/*`,
`CONTRIBUTING.md`/`DEVELOPMENT.md`, `.scratch/`/`.memory/`, any `SKILL.md`, a tracker (`.tickets/` or
other), `GLOSSARY.md`, `docs/`, `.references/`. Detect the **build/test command** (justfile /
package.json / Cargo.toml / project.godot / Makefile / pyproject / go.mod / mise.toml) and run it
once as the **baseline** every later step is verified against. Map structure with a symbol-map tool
if the harness has one, otherwise `git ls-files` plus targeted grep; surface the high-centrality
modules — **don't read everything**, and state what wasn't examined.

Also detect **repo hygiene** (detail: [references/repo-hygiene.md](references/repo-hygiene.md)):
tracked binaries without Git LFS, sensitive or out-of-place tracked content, and whether
`.references/` has a committed rehydration index.

Then: **name the archetype(s)**, **classify each agent artifact by role** (agent layer vs shipped),
and **set the polarity bit**.

### 2. Characterize the as-is model

Build an honest description of what the repo currently *is and does*, from the code. Call the Skill tool
with `domain-modeling` (or `game-modeling` for a game's systems — detect an engine marker; load both for
a game with a backend) and run its **mandatory code cross-check as the primary loop**: mine domain
vocabulary from the symbol map and module structure, not from intent. Offer ADRs only for decisions
already baked into the code that a newcomer would question.

- **Migrated terms** (an incumbent glossary) carry a cross-check verdict to the gate: confirmed /
  stale / contradicted, with file:line evidence.
- **Inferred terms** are **staged** for confirm/correct/reject at the gate; only confirmed terms are
  written. The committed glossary never holds unconfirmed fiction.
- **Contradictions** between code and its docs are recorded as characterized fact (a running system is
  its own specification — don't silently "fix" surprising behavior). They feed Step 4, not the glossary.

### 3. Conformance-audit & reconcile (polarity-aware)

Call the Skill tool with `conformance-audit` on the existing skills, tool scripts, agent guidance, and
docs — it produces findings (safe-auto-fix vs needs-judgment) against current grey-matter standards.
Then reconcile the existing agent layer:

- **install-semantics:** scaffold grey-matter's conventions, careful not to clobber.
- **subsume-semantics:** migrate the incumbent's content worth keeping into grey-matter's structures,
  then replace the incumbent structure. Lossless and gated.
  - **Relocate dot-prefixed committed knowledge** (e.g. `.memory/`) to grey-matter paths with
    `scripts/relocate-knowledge.mjs` (in this skill's folder): links are rewritten by location,
    recorded evidence is never rewritten, and the baseline's tests + link check must pass again
    after. Procedure and default map: [references/relocation.md](references/relocation.md).

**Reshape `AGENTS.md` by its purpose** (both polarities). First decide who actually loads it — agents
developing this repo, or also consumers of what it ships (shipped artifacts usually don't carry the
root `AGENTS.md` with them). Then cut it to its job: standing rules, non-derivable gotchas, and
navigation pointers. Delete what the environment already answers (task lists, skill lists, `--help`)
and what has a canonical home elsewhere. **Lossless rule:** before deleting a line, confirm its
canonical home holds it; if none does, keep it or move it there. Show the before/after size at the gate.

### 4. Seed & triage the board

Capture the backlog the repo **already has** — TODO/FIXME, open issues, a foreign tracker — into tkt.
Call the Skill tool with `triage` so raw items land as `backlog`/`ready-for-agent` and `tkt ready`
isn't flooded.

- **subsume-semantics:** if a non-grey-matter tracker owns the board, **migrate its tickets into tkt and
  replace it** — never `tkt init` a second board beside a live one, and never merely defer to theirs.

**Audit findings are migration findings, not ready work.** Step 2's contradictions and Step 3's
judgment findings come from an outside audit and may misread the design. With approval at the gate,
file them **one ticket per decision** (not one per finding), backlog by default, framed for the
project's own agent to review first:
- title prefix `Review migration finding:` and tag `migration-finding`;
- a banner: filed by adopt-project, `Confirmation status: unconfirmed`, reproduce each point and
  mark it confirmed / rejected / re-scoped before changing code; rejecting every point is a valid close;
- the first acceptance criterion is that review; proposed remedies are labeled as suggestions;
- one line in the target's `AGENTS.md` saying what the tag means.

Commit the audit reports into the target (`docs/agents/research/adoption-<date>/`) so tickets cite
durable evidence, not `.scratch/`. If the repo keeps a plan table tkt reconciles, add rows.

### 5. Wire the plumbing

Call the Skill tool with `init-project` to create only the genuinely-absent plumbing (it is
create-what's-missing and idempotent): `AGENTS.md`-primary + `CLAUDE.md` pointer, `.scratch/`,
`.references/` + its rehydration README, gitignore entries, the tkt block (`tkt init --write` adds it
to an existing `AGENTS.md`), and the consistency checks. It runs *after* reconcile has decided what's
safe, so it fills real gaps rather than bailing on a non-empty repo.

Then the hygiene wiring from Step 1 ([references/repo-hygiene.md](references/repo-hygiene.md)):
Git LFS for binary assets (current tree only; `git lfs install --local` for the push hook), untrack
sensitive content, and complete the `.references/` index with a clone command per entry.

- **subsume-semantics:** the replacement supersedes the incumbent plumbing; never `tkt init` beside a
  still-live tracker (Step 4 migrated it first).

### 6. Confirm & recommend

Present the whole adoption for human correction: the glossary verdicts and staged terms (Step 2), the
relocation map, the reconcile/subsume plan, the AGENTS.md before/after, and the conformance fixes
(Step 3), the migration findings to file (Step 4), and the plumbing and hygiene changes (Step 5),
plus any history-rewrite follow-ups for the owner. This is the approval gate — nothing lands before
it. Then commit in the shape above, verify against the Step 1 baseline (tests, link check, a fresh
clone if LFS changed), and push. Finally, **recommend `wayfinder`** for the first forward chunk of work
and stop. Adoption ends here.

## Portfolio mode (optional): which sibling repos to adopt

When the user wants to bring several repos over (a migration off another skill set, a new machine),
survey the sibling repos before adopting any of them:

```
node <skill-dir>/scripts/survey-repos.mjs [<parent-dir>] [--exclude <name> ...] [--fresh-days 30] [--warm-days 90]
```

It defaults to the current repo's parent and is read-only. It ranks every git repo there by freshness
(last commit, commits in the fresh window) and reports what adoption would face: a dirty tree, an
incumbent `.memory/`, a tracker, and AGENTS.md references to skills that no longer exist. Exclude
tool repos and retired projects that aren't candidates. Present the tiers and offer two options:

- **Freshest first (default).** Adopt the *now* tier (fresh, clean tree) right away; the
  *now-after-wip* tier once each owner lands its work in progress; *warm* repos on their next real
  work; leave *dormant* ones on whatever fallback the user-level AGENTS.md provides.
- **All.** Adopt every candidate repo in batches of a few per session, freshest first. Each repo still
  runs the full pipeline above with its own approval gate and its own commits; batching never merges
  gates. Dirty repos are skipped (and listed), never stashed or committed on the owner's behalf.

Either way, one repo at a time: the gate per repo is what keeps adoption honest.

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
   Subsume-semantics, light: align to current conventions, fill gaps, dedupe. Expect the weight to
   move into relocation (Step 3) and migration findings (Step 4).
5. **No-tests / undocumented-domain (orthogonal)** — weak/no tests or a big domain with no glossary.
   Lean harder on characterize-from-code + commit history in Step 2; be explicit about what wasn't
   examined.

## Risks this pipeline is built to avoid

- **Fictional domain model** — inferred terms read as authoritative but are guesses. Mitigated by
  stage-then-write (Step 2) + the approval gate (Step 6).
- **Clobbering / forking the incumbent** — mitigated by the git contract (bytes) + the subsume polarity
  (whole system: migrate-then-replace, never a second tracker).
- **Breaking what the repo ships** — mitigated by classifying agent artifacts by role (Step 1).
- **Broken references after a move** — mitigated by location-aware relocation and the before/after
  baseline (Step 3).
- **Drowning the owner in audit output** — mitigated by grouping findings per decision and framing them
  as unconfirmed migration findings (Step 4).
- **Mistaking legacy behavior for bugs** — record surprising behavior as characterized *fact* in Step 2;
  changing it is a later, human-gated decision (recommend `wayfinder`), not part of adoption.
- **Scan cost / hallucinated structure on huge repos** — symbol map + centrality (Step 1), cap depth,
  state what wasn't examined.

## It's working if

- The repo ends fully adopted: plumbing wired, an as-is model the human confirmed, a triaged frontier
  `tkt ready` surfaces, grey-matter's consistency checks wired in.
- Tests and the link check pass after adoption exactly as they did at the Step 1 baseline.
- Nothing was overwritten outside the reviewed adoption commits; the whole change is revertable.
- An incumbent agent layer was subsumed (its value migrated, then replaced) — not clobbered, not forked
  into a parallel system, not silently discarded; shipped artifacts still work where they install.
- No unconfirmed glossary term was committed; every filed audit finding is marked unconfirmed and
  review-first; forward planning was recommended (`wayfinder`), not done.

## Does not

- **Plan new work.** Forward change-planning is `wayfinder`, recommended at the end — adoption is bounded
  by what's derivable from the repo as it is.
- **Reimplement what it calls.** Plumbing is `init-project`; glossary is `domain-modeling`/`game-modeling`;
  standards-conformance is `conformance-audit`; backlog capture is `triage`. adopt-project orchestrates.
- **Clobber or defer to an incumbent.** It subsumes-and-replaces, losslessly and gated.
- **Rewrite history.** History-rewriting cleanups are named for the owner, never done in adoption.

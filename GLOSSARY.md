# grey-matter glossary

The one shared vocabulary for this repo, used identically in prose, docs, tickets,
and agent instructions. It aligns two bounded contexts: **tkt** (the ticket CLI)
and the **skills** (the adapted mattpocock skill set). Where a word means two
things, this file is the tie-breaker.

Rules of use:
- Prefer the **canonical** term everywhere. The listed aliases are what to *avoid*.
- Two words are true homonyms (`ready`, `spec`); the rulings below are binding.
- Maintenance is continuous: when a skill is adapted and introduces or renames a
  term, update this file in the same change (ubiquitous-language discipline).

## Canonical terms

### ticket
The unit of tracked work: one markdown file under `.tickets/`, managed by `tkt`.
Context: both. _Avoid_: "issue" (the skills say issue; here it is a ticket).

### frontier
The set of open tickets whose blockers are all done, i.e. the work takeable now.
Produced by `tkt ready`. Context: both. _Avoid_: bare "ready" for this concept in
prose when it could be read as the triage label (see **ready**, homonym).

### blocked_by
A ticket's dependency edges: the tickets that must be done before it can start.
Flat list, forms a DAG. Context: both. _Avoid_: "blocking links", "blocking edges"
as the field name (fine in prose; the field is `blocked_by`); prose: "blocker".

### parent / child
Containment: a **child** ticket belongs to an epic **parent**. Distinct from
`blocked_by` (ordering). Native in tkt once tkt tickets 192-199 land; until then
emulated (see `docs/agents/tkt-conventions.md`, "Epics"). Context: both.
_Avoid_: "sub-issue" (skills term; map to child).

### epic
A parent ticket that contains children and is done when they are. Context: both.

### assignee
Who owns a ticket in progress. Set by `tkt claim`. Native in tkt once ticket 194
lands; a solo serial workflow can ignore it. Context: both.

### acceptance criteria
The checkable conditions that define a ticket as done. Stored in the ticket's
`validation_criteria` field and the body checkboxes. Context: both.
_Avoid_: "ACs" in prose where unexplained.

### spec  (homonym - see ruling)
The **requirements document** a piece of work is built from (the skills' sense).
This is the canonical meaning of the bare word "spec" in grey-matter.
Context: skills.

### spec-slug  (homonym - see ruling)
The **pointer** stored in tkt's `spec` *field*: a short slug naming the doc a
ticket relates to. The CLI flag is still `--spec`, but the *concept* is the
spec-slug, never confuse it with the spec document. Context: tkt.

### ready  (homonym - see ruling)
Do not use bare "ready" as a noun for a state. Two distinct concepts wear this
word:
- the computed **frontier** (`tkt ready`): open, no open blockers.
- the asserted triage disposition **`triage:ready-for-agent`** /
  **`triage:ready-for-human`**: a human says the brief is complete.
Always use the full canonical term (`frontier`, or the full `triage:ready-for-*`
tag). Never shorten the triage label to "ready."

### triage role / triage disposition
A ticket's triage state, orthogonal to lifecycle `status`. Carried as a
`triage:<value>` tag. Values: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. Context: skills. _Avoid_: "label" (here it is a
namespaced tag).

### status
A ticket's lifecycle state: `open`, `in_progress`, `done`, `backlog`. One value at
a time, enforced by tkt. Distinct from triage role. Context: tkt.

### tag / label namespace
A free-form `tags` entry on a ticket. grey-matter uses a **namespaced** scheme
(`type:`, `triage:`, `kind:`, `epic:`, `stream:`, `wayfinder:`); see
`docs/agents/tkt-conventions.md`. Context: both. _Avoid_: "label" as a distinct feature
(tkt has only tags).

## Game-native terms

The engine-neutral vocabulary for the game-native-design guidance
(`skills/engineering/game-native-design/`). Each neutral term lists its per-engine
translation; the engine word is a translation, never the canonical term.

### simulation update step
The code that advances the game every frame. Canonical neutral term; _avoid_ naming
an engine's callback in neutral prose. Translations: Godot `_physics_process` (fixed)
/ `_process` (render); Unreal `Tick` (and physics substepping for the fixed step).

### fixed timestep
A simulation step run at a constant rate independent of frame rate (stable,
reproducible). Distinct from the variable-rate **render step**. Context: both engines.

### the simulated thing
The neutral unit of behaviour in the loop. _Avoid_ node / actor / entity in neutral
prose. Translations: Godot `Node` (module = **scene**, data = `Resource`); Unreal
`AActor`/`UActorComponent` (service = `USubsystem`); ECS "entity" where one exists.

### game feel / juice
The per-frame audio-visual feedback that makes control feel responsive and alive
(easing, screenshake, hit-stop, particles). An engineering concern delivered in the
loop, not a cosmetic afterthought. Context: skills (game-native).

### vertical slice  (false friend - see ruling)
A **false friend** across domains:
- **web sense**: a thin path through every architectural layer, demoable end to end.
  This is the sense the `to-tickets` / `tdd` tracer-bullet language uses.
- **game sense**: a small chunk of the game built to near-final polish, representative
  of the shipped look and feel.
Qualify it ("tracer-bullet slice" vs "polished slice") whenever both domains are in
play; never let the bare term carry the game meaning in a tracer-bullet context.

## adopt-project terms

The vocabulary for brownfield adoption (`skills/meta/adopt-project`, ticket 40). Distinct
from `init-project`'s greenfield scaffolding.

### adopt (vs init)
**adopt**: bring the grey-matter workflow into a repo that **already has code and history**,
characterizing and reconciling around what exists. **init**: scaffold a **fresh/empty** repo
forward from intent. Context: skills (meta). _Avoid_: using "init" for the brownfield case.

### as-is model
The honest description of what a codebase currently **is and does** — vocabulary as actually
named in the code, conventions as actually followed, real build/test commands, known-legacy
areas — built *before* any planning of change. Context: skills. _Avoid_: "domain model" when
you mean the characterized-from-code baseline specifically.

### characterize
To derive the as-is model **from the code itself** (symbols, structure, commit history), not
from stated intent. After Feathers: a running system is its own specification. Context: skills.

### reconcile (vs clobber)
To merge grey-matter's structure with existing agent files **non-destructively** — never
overwrite; classify each existing artifact and integrate around it. **clobber** is the failure
it avoids: overwriting or shadowing what's already there. Context: skills.

### install-semantics / subsume-semantics
The two polarities of adopt-project's reconcile/seed/wire steps. **install**: no incumbent
agent layer — scaffold grey-matter conventions (carefully). **subsume**: an incumbent agent
layer exists and is **being replaced** — migrate its content worth keeping (governance rules,
backlog, decisions) into grey-matter's structures, then replace it; lossless and gated by
default (automatic only if the user asks). Context: skills. (See ADR 0002.) _Avoid_:
"negotiate-semantics" (the earlier name; adopt-project subsumes the incumbent, it does not
defer to it).

### incumbent agent layer
Pre-existing agent scaffolding in a target repo — an AGENTS.md doctrine, a tracker of any
kind, or existing skills — whose presence flips adopt-project into subsume-semantics (migrate
its value, then replace it). Context: skills. _Avoid_: treating a non-grey-matter tracker as
"absent" just because it isn't tkt.

### conformance-audit
Auditing a repo's existing skills, tool scripts, and agent guidance against grey-matter's
**current** health/maintenance/optimization standards (`skills/meta/conformance-audit`, ticket
42). Called by adopt-project and runnable standalone for ongoing upkeep. Context: skills (meta).

## spike-options terms

The vocabulary for the empirical decision discipline (`skills/engineering/spike-options`).
Distinct from `prototype` (one throwaway answering one design question) and from
`improve-codebase-architecture` (candidates compared on paper, not built).

### spike  (homonym - see ruling)
In grey-matter, a **throwaway build that answers a deciding question for one option** in a
multi-option comparison. Each spike *is* a `prototype` (reuse its throwaway/capture
discipline); the plural, run against one shared question, is a **spike run**. Context:
skills (engineering). _Avoid_: "spike" for a one-off prototype with no comparison (that is
just a `prototype`), and the agile "spike = any timeboxed investigation" sense.

### meaningful option
An approach genuinely in contention to win a decision — distinct enough that it could
change the answer, not a trivial variant. A spike run spikes **every** meaningful option;
there is **no fixed count**. Context: skills. _Avoid_: capping the count, or spiking
near-duplicates (the waste `prototype`'s "diverge in structure, not colour" rule guards).

### deciding question
The single question a spike run exists to answer — the uncertainty that reasoning alone
can't settle and only building reveals. Every spike in the run answers the *same* deciding
question, and each is "done enough" the instant it answers it (not when it works).
Context: skills.

### verdict
The outcome of reviewing a spike run with the user (via `grilling`): which option won,
which lost, and **why**. Recorded as a context pointer on the originating ticket, alongside
the spike branch names, plus integration ticket(s) for the winner (the "integration plan").
An ADR is offered only when the decision clears domain-modeling's three-part gate. Context:
skills.

## delivery-dashboard terms

The vocabulary for the completion-communication artifact
(`skills/productivity/delivery-dashboard`). Distinct from `CHANGELOG.md` (durable, archival,
text) — the dashboard is the living, relevant-now, visual surface.

### delivery dashboard
A single durable, evolving HTML artifact per project that communicates delivered work to the
user in the **JTBD register**. Organized into **tabs by concern/workstream**; each tab carries
a current-state view plus a **short rolling history** of what's currently relevant. Tabs are
**curated and retired** as features integrate — it reflects the present and recent, not a full
archive. Value-language follows `changelog`; HTML rules follow `report-format.md`. Context:
skills (productivity). _Avoid_: "report" (a per-run report is a different artifact), treating
it as append-only (the history rolls).

### JTBD register
The writing register for the delivery dashboard: every explanation reads as if for the person
whose **job-to-be-done** the work serves — the value, what's new about the experience, how it
affects their JTBD — with no jargon, no sausage-making, low cognitive load. The value-language
discipline is `changelog`'s, surfaced visually. Context: skills.

### fidelity ladder
The three-rung rule for how real a dashboard visual is, matched to the feature's build state and
**always labelled with its rung**: **wireframe** (nothing built — a greybox/sketch of the
intended experience), **mocked** (partially built — real layout, representative/stubbed data),
**live** (shipped — real data / the actual thing). Climbing the ladder is the visible progress
signal in a tab's current-state view. The rung label is load-bearing: an unlabelled wireframe
reads as a promise. Context: skills.

Match strength is honest (exact / close / broad / narrow); a blank counterpart is
a real gap, not forced equivalence.

| Concept | tkt term | skills term | Match | Canonical in grey-matter |
| --- | --- | --- | --- | --- |
| Unit of work | ticket | issue / loose "ticket" | close | **ticket** (alias: issue) |
| Unblocked open set | ready / frontier | frontier | exact | **frontier** |
| Dependency edge | blocked_by | blocking edge | exact | **blocked_by** (prose: blocker) |
| Fully-specified, agent-can-start | - | ready-for-agent | (no tkt eq.) | **triage:ready-for-agent** (never bare "ready") |
| Requirements document | - | spec | narrow->slug | **spec** (the document) |
| Doc pointer / ref | spec field | - | broad->doc | **spec-slug** (CLI flag `--spec`) |
| Parent/child | parent (192+) | sub-issue / child | close->exact | **parent** / **child** |
| Category | tags | category role (bug/enhancement) | broad | **kind:** tag |
| Triage disposition | tags | triage role/state | broad | **triage:** tag |
| Claim / WIP | claim -> in_progress | claim (by assignee) | close | **claim** (-> in_progress; assignee 194+) |
| Acceptance check | validation_criteria | acceptance criteria | close | **acceptance criteria** (field: validation_criteria) |

## Ambiguities resolved

- **"ready"**: split into **frontier** (computed) and **triage:ready-for-agent**
  (asserted). Bare "ready" as a state noun is retired.
- **"spec"**: the **document** keeps the word; tkt's pointer field is the
  **spec-slug**.
- **"issue" vs "ticket"**: collapsed to **ticket**; "issue" is a skills alias only.
- **"vertical slice"**: a false friend. Web = thin path through all layers; game = a
  polished representative chunk. Qualify it when both domains are in play.
- **"spike"**: scoped to a throwaway build answering a deciding question for one option in
  a multi-option **spike run** (`spike-options`). A one-off throwaway with no comparison is
  a `prototype`, not a spike; the agile "any timeboxed investigation" sense is not used.

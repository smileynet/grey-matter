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

## Crosswalk: tkt <-> skills

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

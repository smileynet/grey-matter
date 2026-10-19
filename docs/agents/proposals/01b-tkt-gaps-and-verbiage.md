# Proposal: closing the 6 tkt gaps + aligning verbiage

Status: draft for review
Ticket: 01 (adapt-tkt-ticket-system)
Supersedes: the "Gaps" and "would-genuinely-help" sections of
[`01-tkt-ticket-system.md`](./01-tkt-ticket-system.md) with concrete remediation.
Date: 2026-10-10

## The one structural fact that shapes every answer

`tkt` (0.3.1) has **no extensibility surface**: no plugin or hook mechanism, no
custom statuses, no custom frontmatter fields, and `tags` are free-form text with
**no validation, enum, or namespace enforcement**. `tkt init` installs **no git
hook**. What it enforces natively is fixed: the status lifecycle and close gates,
the `blocked_by` DAG (cycle + dangling detection via `tkt validate`), frontmatter
style (`tkt lint`), the computed frontier (`tkt ready`), and decay/stale findings
(`tkt validate` / `tkt audit`).

Therefore every gap below closes the same way: a **convention** (how we use the
primitives tkt already has) plus, where an invariant matters, an **external lint
script** (`tkt query -o json` + `jq`, alongside `tkt validate` and
`tkt lint --check`) wired into a **pre-commit hook and/or CI**, because tkt cannot
enforce a custom rule itself. This mirrors how comparable git-native trackers
(Taskwarrior, Dstask, Fossil) and even GitHub-before-2024 operated: disciplined
conventions over primitives, with a validator catching drift.

A single integration artifact ties it together: a tkt-flavored
**`docs/agents/issue-tracker.md`** (mirroring the upstream seed-template shape) is
the one doc every adapted skill reads to resolve a tracker operation. The gaps are
answered *in that doc*, so the skills never learn tkt's quirks directly.

---

## Gap 1: no native parent/child (epics, wayfinder map, to-tickets source)

**Convention.** An epic is a normal ticket tagged `type:epic` whose `blocked_by`
lists its children. It closes automatically only once every child is done, so the
existing frontier logic gives progress rollup for free. Children also carry a
shared grouping tag `epic:<slug>` so "show all of this epic's work" is one
`tkt query` filter, independent of the edge.

- Prior art: Taskwarrior has no project-level dependency and the community answer
  is an "end-of-project sentinel task" everything depends on; GitHub ran on
  "tracking issues" + task lists this exact way before native sub-issues (2024).
  Both validate the tag + tracking-ticket combination.
- Why both a tag and an edge: the edge gives the *completion node* (rollup); the
  tag gives *grouping/queryability* and keeps the overloaded "blocks = contains"
  edge distinguishable from a real technical blocker (the `type:epic` tag is the
  signal that this ticket's blockers are its children, not its prerequisites).
- Failure mode avoided: an external index doc listing epic->children rots (second
  source of truth). We derive everything from the tags and edges instead.

**Enforcement (lint rule E1):** a ticket tagged `type:epic` must have >=1
`blocked_by`; every child of an epic must carry the matching `epic:<slug>` tag.
A warning, not a hard fail.

**Wayfinder mapping:** the map is a `type:epic` + `wayfinder:map` ticket; decision
tickets are children (tagged `wayfinder:<type>`) that `blocked_by` the map or each
other. No sub-issue API needed; `tkt ready` is the frontier.

## Gap 2: 4-value status can't hold triage roles

**Convention.** Lifecycle `status` (open/in_progress/done/backlog) and triage
*disposition* are **orthogonal axes**. Triage roles live as **namespaced tags**
with a reserved prefix, so they're visibly a mutually-exclusive set:

- `triage:needs-triage`, `triage:needs-info`, `triage:ready-for-agent`,
  `triage:ready-for-human`, `triage:wontfix`
- category axis: `kind:bug`, `kind:enhancement`

- Prior art: **GitLab scoped labels** (`key::value`) are natively
  mutually-exclusive, exactly the semantics we want. tkt can't enforce it, so we
  adopt the `prefix:value` naming and emulate the mutual-exclusion with a lint
  rule. (GitHub has no scoped labels; GitLab's is the model.)

**Enforcement (lint rule E2):** at most one `triage:` tag and at most one `kind:`
tag per ticket. This is the "exactly one state role" invariant the upstream
`triage` skill wants and that tkt won't give us structurally. Hard fail in CI.

**Critical disambiguation (feeds the verbiage section):** `tkt ready` (computed,
no open blockers) is NOT `triage:ready-for-agent` (asserted, fully-specified
brief). They are different concepts that happen to share the word "ready." We keep
both and never let the bare word "ready" stand for the triage label.

## Gap 3: no arbitrary labels (only free-form tags)

This is the enabling constraint for Gaps 1 and 2, not a separate problem. All
label-shaped vocabularies collapse into one **namespaced-tag scheme**:

| Axis | Prefix | Values | Cardinality |
| --- | --- | --- | --- |
| Work type | `type:` | epic, review, lens, research, decision, chore | 0..1 |
| Triage disposition | `triage:` | needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix | 0..1 |
| Category | `kind:` | bug, enhancement | 0..1 |
| Epic grouping | `epic:` | `<epic-slug>` | 0..n |
| Stream / area | `stream:` | skills-review, game-lens, tooling | 0..1 |
| Wayfinder | `wayfinder:` | map, research, prototype, grilling, task | 0..1 |

The prefix *is* the namespace; the lint script enforces the vocabulary and the
cardinalities. This keeps tags small, documented, and greppable (todo.txt
`+project` discipline), and makes an unknown or mistyped tag a lint finding.

**Enforcement (lint rule E3):** every tag matches a known `prefix:value` from this
table; unknown prefixes or values warn. Combined with E1/E2 in one script.

## Gap 4: no assignee / atomic claim

**Convention.** `tkt claim <id>` (-> `in_progress`, pushed) is the WIP soft lock:
an `in_progress` ticket drops off `tkt ready`, so a later serial run won't
re-grab it, and the pushed status change is the visible claim record. No assignee
is needed for a solo developer with serial agent runs.

- Prior art agrees: multi-agent frameworks need assignees + atomic claim only to
  arbitrate concurrent grabs; single-dev serial usage has no contention.
- If we ever run **parallel background agents**, revisit with a lightweight
  convention (e.g. a `claimed-by:<agent>` note in the resolution/body or a
  branch-name-encodes-ticket rule), since tkt still won't give atomic claim. Not
  needed now; recorded so we don't rebuild it from scratch later.

**Enforcement (lint rule E4, advisory):** flag `in_progress` tickets with no
commit activity in N days as stale (overlaps `tkt audit`'s stale-WIP check).

## Gap 5: PR-as-request-surface / PR-as-close flags

**Convention.** Carry the upstream flag verbatim in `issue-tracker.md` so the
`triage` skill keeps working unchanged:

> **PRs as a request surface: no.** _(Set to `yes` if this repo treats external
> PRs as feature requests; the triage skill reads this flag.)_

Default **no** (solo docs repo). Tickets close via `tkt close`, never via a merged
PR. tkt has no PR concept, so if the flag is ever flipped to `yes`, PR operations
route to the git host CLI (`gh`) *beside* tkt, not through it. Only `triage` reads
this flag (confirmed: `implement-spec` consumes the frontier/task-graph, not PRs).

**Enforcement:** none needed; it's a documented default in one doc.

## Gap 6: unused tkt capabilities (backlog, validation_criteria)

Not a gap to close, a decision to record:

- Adopt `validation_criteria` as the acceptance-criteria mechanism (close with
  `--check-all --evidence`), and turn on the close gates we want in
  `.tickets/config.toml` (`require_resolution`, `require_checked_acs`; keep
  `require_validation_evidence = "warn"` for now).
- Reserve `status: backlog` for deliberately parked work (no triage-role analog;
  it is lifecycle, not disposition). A `triage:wontfix` ticket is still *closed*
  (`done`), not `backlog`.

---

## The enforcement bundle (one script, one hook)

Because tkt enforces no custom rule, lint rules E1-E4 live in a single external
script, e.g. `scripts/lint-tickets.sh`, that:

1. runs `tkt validate --strict` (cycles, dangling edges, contract),
2. runs `tkt lint --check` (frontmatter style),
3. runs `tkt query -o json | jq` assertions for E1 (epic has children + grouping),
   E2 (<=1 `triage:` and <=1 `kind:`), E3 (known `prefix:value` tags), E4 (stale
   WIP, advisory).

Wire it into a **pre-commit hook** and a **CI job**. This is the standard
"validator substitutes for a structural constraint the tool lacks" pattern. Each
tkt command used (`validate`, `lint --check`, `query`) exits non-zero on failure,
so the hook composes cleanly.

---

## Verbiage alignment: one language for users and agents

### The problem, precisely

`tkt` and the skills are two **bounded contexts** (DDD) with divergent words, and
two **true homonyms** that will actively mislead a reader or an agent:

- **"ready"**: tkt's computed frontier (no open blockers) vs. the skills'
  `ready-for-agent` asserted label (fully-specified brief).
- **"spec"**: tkt's `spec` field is a *doc slug/pointer*; the skills' "spec" is a
  *full requirements document*.

Ambiguity is expensive twice over: a human misreads, and an **agent fills an
underspecified word from its broadest training prior**, or mis-fires on a trigger
word that means two things. Consistent naming matters more for agents, not less.

### The approach (two layers)

Following DDD ubiquitous-language practice (one preferred term per concept, used
identically in docs, prose, and commands) plus library-science crosswalk practice
(SKOS match strengths for terms that genuinely differ):

1. **Canonical term + documented aliases** for concepts we *can* unify. The
   canonical word is used everywhere in grey-matter prose and docs; the alias is
   listed as "avoid."
2. **A crosswalk table** for concepts that genuinely differ between the tools,
   with an honest match strength (exact / close / broad / narrow), gaps left blank
   rather than forced into false equivalence.
3. **Rename the homonyms** on the side that is less entrenched, rather than
   leaning on qualifiers, because agent trigger words must be unique. Use a
   qualifier only in incidental prose where neither side can move.

### Homonym rulings

- **"ready" -> keep `frontier` for the computed sense.** tkt already exposes the
  concept as `tkt ready` *and* names it "frontier"; in grey-matter prose we say
  **frontier** for "unblocked open work," and we **never shorten `ready-for-agent`
  / `ready-for-human` to bare `ready`.** The triage labels keep their full names
  (now `triage:ready-for-agent`), which makes the collision impossible in tags.
- **"spec" -> `spec` is the document; the pointer is `spec-slug`.** The full
  requirements document is the concept humans and agents reason about most, so it
  keeps the plain word. tkt's `spec` *field* is referred to in our docs as the
  **spec-slug** (the pointer/ref), even though the CLI flag is still `--spec`
  (we can't rename the flag, so the doc names the concept and shows the flag).

### The crosswalk (tkt concept <-> skills concept)

| Concept | tkt term | skills term | Match | Canonical in grey-matter |
| --- | --- | --- | --- | --- |
| Unit of work | `ticket` | "issue" / loose "ticket" | close | **ticket** (alias: issue) |
| Unblocked open set | `ready` / frontier | "frontier" | exact | **frontier** |
| Dependency edge | `blocked_by` | "blocking edge" | exact | **blocked_by** (prose: blocker) |
| Fully-specified, agent-can-start | - | `ready-for-agent` | (no tkt eq.) | **triage:ready-for-agent** (never "ready") |
| Requirements document | - | "spec" | narrow->slug | **spec** (the document) |
| Doc pointer / ref | `spec` field | - | broad->doc | **spec-slug** (CLI flag `--spec`) |
| Parent/child | (none) | "sub-issue" / "child" | close | **epic** + **child** (via `type:epic` + `blocked_by`) |
| Category | `tags` | "category role" | broad | **kind:** tag |
| Triage disposition | `tags` | "triage role/state" | broad | **triage:** tag |
| Claim / WIP | `claim` -> `in_progress` | "claim" (by assignee) | close | **claim** (-> in_progress; no assignee) |
| Acceptance check | `validation_criteria` | "acceptance criteria" | close | **acceptance criteria** (field: validation_criteria) |

Fill the Match column honestly; where a row has no counterpart, the gap is real
(e.g. tkt has no "fully-specified brief" concept; the skills have no computed
frontier) and is left as such, not papered over.

### Where it lives, and how it stays alive

- **`GLOSSARY.md`** at the repo root is the single source of truth, pointed at
  from `CLAUDE.md`/`AGENTS.md` so every agent session loads it. One block per
  concept: canonical term, one-line definition, context (tkt | skills | both),
  "avoid" aliases, and an ambiguity flag pointing at any homonym counterpart.
- The **crosswalk table** lives in `GLOSSARY.md` too (or a sibling it links),
  since it is the map between the two contexts.
- Maintenance is a continuous flagging duty (Evans): when a skill is adapted and
  introduces or renames a term, the glossary is updated in the same change. The
  `domain-modeling` skill, if we keep it, is exactly this discipline.

---

## Decisions this proposal records

1. Every gap closes as **convention + external lint script**; tkt enforces no
   custom rule (no hooks/plugins, unvalidated tags, fixed status).
2. Epics = `type:epic` ticket `blocked_by` its children, children tagged
   `epic:<slug>`.
3. All label-shaped vocabularies become **namespaced tags** (`type:`, `triage:`,
   `kind:`, `epic:`, `stream:`, `wayfinder:`) with documented cardinalities.
4. Triage roles are tags on an axis orthogonal to `status`; mutual exclusion is
   enforced by lint rule E2 (GitLab scoped-label semantics, emulated).
5. Claim = `tkt claim` -> `in_progress`; no assignee; parallel-agent claim is a
   future convention, not built now.
6. PRs are not a request surface (default `no`); tickets close via `tkt close`.
7. Adopt `validation_criteria` + close gates; reserve `backlog` for parked work.
8. Lint rules E1-E4 ship as `scripts/lint-tickets.sh`, wired into a pre-commit
   hook and CI.
9. One shared language: canonical-term-plus-aliases in `GLOSSARY.md`, a SKOS-style
   crosswalk for divergent terms, homonyms renamed (`frontier` not bare "ready";
   `spec` = document, `spec-slug` = pointer).
10. All tracker operations resolve through a tkt-flavored
    `docs/agents/issue-tracker.md`, so skills never learn tkt's quirks directly.

## Follow-ups (to satisfy ticket 01 ACs)

- [ ] Write `docs/agents/tkt-conventions.md` (operational short form of this proposal).
- [ ] Write the tkt-flavored `docs/agents/issue-tracker.md`.
- [ ] Write `GLOSSARY.md` with the crosswalk, pointed at from `CLAUDE.md`.
- [ ] Write `scripts/lint-tickets.sh` (E1-E4 + validate + lint --check) and wire a
      pre-commit hook / CI job.
- [ ] Confirm the namespaced-tag vocabulary and homonym rulings with the user.

## Sources

Structural gaps researched against: Taskwarrior dependencies and the
end-of-project sentinel pattern, todo.txt `+project`, Dstask, Fossil, and GitHub's
pre-2024 tracking-issue era + the 2024 sub-issues announcement; GitLab scoped
labels (`key::value`) as the mutually-exclusive-axis model. tkt's config, lint,
validate, and (absent) hook/plugin surface were confirmed directly against
`tkt 0.3.1` (`config --show`, `capabilities -o json`, per-command `--help`).
Verbiage alignment researched against Evans/Fowler ubiquitous language and bounded
contexts, the DDD anti-corruption layer, SKOS mapping properties (exact/close/
broad/narrow match) and controlled-vocabulary crosswalk practice, and Anthropic's
agent-skill naming guidance. Upstream tracker expectations and the
`issue-tracker.md` indirection were read from `d:\code\skills`. Content from
external sources was rephrased for compliance with licensing restrictions.

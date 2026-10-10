# Proposal: close all gaps via native tkt updates (preferred approach)

Status: draft for review
Ticket: 01 (adapt-tkt-ticket-system)
Supersedes: the "convention + external lint script" remediation in
[`01b-tkt-gaps-and-verbiage.md`](./01b-tkt-gaps-and-verbiage.md) for Gaps 1-4.
Keeps 01b's **verbiage-alignment** section unchanged.
Date: 2026-10-10

## Why this supersedes 01b

01b closed the gaps with conventions over tkt's existing primitives plus an
external `jq` lint script, because it treated tkt as a fixed external tracker.
We **own** tkt (source at `D:\code\tkt`, a Rust CLI installed via
`cargo install --path`). So the preferred approach is to fix each gap **at the
source**: add the missing concepts to tkt's schema, validation, and CLI, instead
of emulating them with naming discipline and a hook we have to maintain forever.

Native beats convention on every axis that matters: clean semantics (no
overloading `blocked_by` to also mean "contains"), real queryability and rollup,
enforcement by `tkt validate` (same machinery that already checks cycles and
dangling deps) instead of a separate script, and a vocabulary that matches the
words users and agents already use (`parent`/`child`, `assignee`), which also
makes the cross-tool verbiage alignment easier.

The codebase is well-factored for this. The ticket is a typed struct
(`src/core/ticket.rs`) with a raw `TicketFile` editor that already preserves
field order and unknown fields; validation is a set of composable `check_*`
functions (`src/findings.rs`) orchestrated by `commands/validate.rs`; the CLI is
a flat clap enum (`src/cli.rs`) where adding a flag is a localized change. Every
new field or check mirrors an existing one.

## The six gaps and their native closure

### Gap 1: no parent/child -> add a native `parent` field

Add `parent: Option<String>` to the ticket schema. `parent` means containment
(this ticket is a child of an epic); `blocked_by` stays purely ordering. The two
never again mean the same thing.

- **Schema** (`src/core/ticket.rs`): add `parent: Option<String>` to `Ticket`,
  parse it in `from_file` (mirrors how `spec` is parsed), add a typed
  `set_parent`/`remove` on `TicketFile` (mirrors `set_blocked_by`). Ordering and
  unknown-field preservation already work via the raw `fm` editor.
- **Validation** (`src/core/validate.rs` + `src/findings.rs`): `parent` must
  resolve to an existing id (new `check_dangling_parent`, mirrors
  `check_dangling_deps`); the parent chain is a DAG, so a new `check_parent_cycles`
  (mirrors `check_cycles`); a ticket can't be its own parent. Wire all into
  `collect_findings`.
- **Rollup + frontier**: a parent is a container, so it is **auto-done when all
  its children are done** and never sits on `tkt ready` itself (it is not work).
  This replaces 01b's "tracking ticket that blocked_by its children" dance with
  real behavior. `tkt blocked` / a new `children` view can show `done/total`.
- **CLI** (`src/cli.rs`): `--parent <id>` on `new`, `batch`, `edit`; a
  `--parent <id>` filter on `query` (and optionally `ready`); surface `parent` in
  `query` JSON and `capabilities`.

Replaces: the `type:epic` tag + tracking-ticket + `epic:<slug>` grouping tag +
lint rule E1. All of that collapses into one field.

### Gap 2 + 3: triage roles / categories -> add validated, single-select label namespaces

01b emulated GitLab scoped labels (`key::value`, mutually exclusive) with a tag
naming convention and a `jq` rule enforcing "at most one `triage:`". Make it
native instead: teach tkt about **label namespaces** declared in
`.tickets/config.toml`, where a namespace can be marked single-select and carry a
closed value set.

```toml
[labels.triage]        # namespace "triage"
single_select = true   # at most one triage:* at a time (validate enforces)
values = ["needs-triage", "needs-info", "ready-for-agent", "ready-for-human", "wontfix"]

[labels.kind]
single_select = true
values = ["bug", "enhancement"]
```

- **Config** (`src/config.rs`): parse a `[labels.*]` table (namespace ->
  {single_select, values}).
- **Validation** (`src/findings.rs`): new `check_label_namespaces` -> a tag whose
  prefix matches a declared namespace must use a known value (closed-set), and a
  single-select namespace may appear at most once per ticket. This is lint rules
  E2 + E3, now enforced by `tkt validate` with no external script.
- **Representation**: these remain `tags` on the ticket (`triage:needs-info`), so
  nothing about storage changes; the config turns an unvalidated free-text tag
  into a validated, closed, optionally-single-select axis.
- Keeps the key disambiguation: `tkt ready` (computed, no open blockers) is NOT
  `triage:ready-for-agent` (asserted brief). Different concepts, both kept.

Replaces: lint rules E2 and E3 and the whole external `jq` script's reason to
exist.

### Gap 4: no assignee / atomic claim -> add an `assignee` field + atomic claim

Add `assignee: Option<String>` to the schema, set by `tkt claim`
(claim-by-assignment), and shown/filtered in `ready`/`query`.

- **Schema**: `assignee` field, parsed/serialized like `spec`.
- **`claim`** (`src/commands/claim.rs`): set `assignee` (default: a configured
  identity or `@me`) alongside `status = in_progress`, and refuse to claim a
  ticket already assigned to someone else unless `--force` (atomic-ish claim; the
  push is still the real race boundary, which is acceptable).
- **Frontier**: `tkt ready` drops tickets that are assigned to someone else, so a
  second agent naturally skips claimed work. This gives wayfinder's
  "assignee is the claim" semantics natively.
- For a solo serial workflow this is optional polish, but it is cheap and it is
  exactly what the upstream `wayfinder` and `implement-spec` skills expect, so
  adding it removes a whole class of future adaptation friction.

Replaces: 01b's "future convention" note and lint rule E4's WIP concern (stale-WIP
detection already exists in `tkt audit`).

### Gap 5: PR-as-request-surface / PR-as-close -> keep as config, not a tkt feature

This one is genuinely a usage decision, not a tkt limitation. tkt is git-native
and has no PR concept, and shouldn't grow one. Record the policy in the
tkt-flavored `docs/agents/issue-tracker.md` (default: PRs are not a request
surface; tickets close via `tkt close`). Only the `triage` skill reads the flag.
No code change.

### Gap 6: unused capabilities (backlog, validation_criteria) -> config, not code

Adopt `validation_criteria` as the acceptance mechanism and turn on the close
gates we want in `.tickets/config.toml` (`require_resolution`,
`require_checked_acs`; keep `require_validation_evidence = "warn"`). Reserve
`status: backlog` for parked work. No code change.

## Net effect

| Gap | 01b (convention + lint) | 01c (native, preferred) |
| --- | --- | --- |
| 1 parent/child | `type:epic` tag + tracking ticket + `epic:` tag + lint E1 | `parent` field + validate checks + auto-rollup |
| 2 triage axis | `triage:` tag prefix + `jq` "pick one" rule | `[labels.triage]` single-select namespace, validate-enforced |
| 3 label scheme | namespaced tags + lint E3 | `[labels.*]` closed-value namespaces, validate-enforced |
| 4 claim/assignee | `in_progress` soft lock, future convention | `assignee` field + claim-by-assignment + frontier skip |
| 5 PR flags | config doc | config doc (unchanged) |
| 6 backlog/VC | config | config (unchanged) |

The external `scripts/lint-tickets.sh` and its git hook from 01b are **no longer
needed**: `tkt validate` enforces every structural invariant natively.

## Verbiage alignment

Unchanged from 01b: canonical-term-plus-aliases in `GLOSSARY.md`, a SKOS-style
crosswalk for divergent terms, homonyms renamed (`frontier` not bare "ready";
`spec` = the document, the tkt pointer field is the `spec-slug`). Native fields
actually *help* here: `parent`/`child` and `assignee` are the words the skills
already use, so the crosswalk rows for those collapse to `exactMatch`.

## Scope note: tkt is a shipped tool with other users

tkt has a changelog, a plugin manifest, telemetry, and a release process, so it is
not a private throwaway. Every change here is **additive and backward compatible**:
new optional fields default to absent, new `[labels.*]` config is opt-in, and
existing tickets validate unchanged. Each lands behind tests mirroring the
existing test suites in `ticket.rs`/`findings.rs`. This keeps the work shippable
upstream rather than forking behavior for grey-matter alone.

## Decisions this proposal records

1. Close Gaps 1-4 with **native tkt features**, not conventions + an external
   lint script. 01b's workaround is superseded for these.
2. Gap 1: native `parent` field; parent auto-done when children done; never on the
   frontier; validated for dangling refs and parent cycles.
3. Gaps 2-3: `[labels.*]` namespaces in config (single-select + closed value set),
   enforced by `tkt validate`.
4. Gap 4: native `assignee` field, set by `tkt claim`, honored by the frontier.
5. Gaps 5-6 stay config/usage decisions (no tkt code change).
6. All changes additive and backward compatible, test-backed, shippable upstream.
7. Verbiage alignment from 01b stands; native naming makes it easier.

## Work breakdown (tickets created in the tkt repo)

These are tracked in **tkt's own `.tickets/`** (the work is on the tkt codebase),
all high priority. grey-matter ticket 01 records the decision and depends on their
completion. Sequence (blocking edges in parentheses):

- T-A **`parent` field: schema + parse + serialize** (`core/ticket.rs`).
- T-B **`parent` validation: dangling + cycle checks** (`core/validate.rs`,
  `findings.rs`, `commands/validate.rs`) - blocked by T-A.
- T-C **`parent` CLI + query/capabilities surface** (`cli.rs`, `commands/new.rs`,
  `batch.rs`, `edit.rs`, `query.rs`, `capabilities.rs`) - blocked by T-A.
- T-D **parent rollup + frontier semantics** (auto-done, excluded from `ready`,
  `children`/`blocked` view) - blocked by T-A, T-C.
- T-E **`[labels.*]` config: parse namespaces** (`config.rs`).
- T-F **label-namespace validation** (single-select + closed-set in `findings.rs`,
  wired into `validate`) - blocked by T-E.
- T-G **`assignee` field: schema + `claim` sets it + frontier honors it**
  (`core/ticket.rs`, `commands/claim.rs`, `ready.rs`, `query.rs`).
- T-H **docs + capabilities + CHANGELOG**: update `tkt capabilities`, the agent
  snippet (`init`), README/CHANGELOG for the new fields and config - blocked by
  T-C, T-D, T-F, T-G.

## Follow-ups in grey-matter (after the tkt work lands)

- [ ] Write the tkt-flavored `docs/agents/issue-tracker.md` using the native
      `parent`/`assignee`/labels features (no lint script).
- [ ] Write `GLOSSARY.md` + crosswalk (from 01b), pointed at from `CLAUDE.md`.
- [ ] Adopt the `[labels.*]` config in grey-matter's `.tickets/config.toml`.
- [ ] Drop the planned `scripts/lint-tickets.sh` from 01b (superseded).

## Sources

Design grounded in a direct read of the tkt source at `D:\code\tkt`
(`src/core/ticket.rs`, `src/core/validate.rs`, `src/findings.rs`,
`src/commands/validate.rs`, `src/cli.rs`). Prior art for the chosen native
shapes: GitLab scoped labels (`key::value`, mutually exclusive) for the
single-select label namespace; GitHub sub-issues (parent/child + progress rollup)
for the `parent` field semantics; assignee-as-claim from the upstream `wayfinder`
skill. Content from external sources was rephrased for compliance with licensing
restrictions.
